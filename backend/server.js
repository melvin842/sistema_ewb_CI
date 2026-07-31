require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const pool    = require('./db');
const multer  = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const fs      = require('fs');
const path    = require('path');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();

const JWT_SECRET = process.env.JWT_SECRET || 'CAMBIA_ESTO_EN_.env';

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5500',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

// ════════════════════════════════════════════════════════════
//  MIDDLEWARE DE AUTENTICACIÓN
// ════════════════════════════════════════════════════════════

function verificarSesion(req, res, next) {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).json({ success: false, mensaje: 'No autenticado' });
    }
    try {
        req.usuario = jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({ success: false, mensaje: 'Sesión inválida o expirada' });
    }
}

function requiereRol(...rolesPermitidos) {
    return (req, res, next) => {
        if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({ success: false, mensaje: 'No tienes permisos para esta acción' });
        }
        next();
    };
}

// =========================
//  RUTAS BASE
// =========================
// Solo los CVs se mantienen en disco local (son PDFs, fuera del alcance
// de esta migración). Todo lo demás (productos, RH, noticias, perfil)
// ahora vive en Cloudinary.

const raiz       = path.join(__dirname, '..');
const carpetaCVs = path.join(raiz, 'CVs', 'recursos_humanos');

if (!fs.existsSync(carpetaCVs)) {
    fs.mkdirSync(carpetaCVs, { recursive: true });
    console.log('Carpeta creada:', carpetaCVs);
}

app.use(express.static(path.join(raiz, 'proyecto')));

app.get('/', (req, res) => {
    res.redirect('/HTML/index.html');
});

// ════════════════════════════════════════════════════════════
//  ACTUALIZACIÓN AUTOMÁTICA DE ESTADO POR FECHA DE CIERRE
// ════════════════════════════════════════════════════════════

async function actualizarEstadosVacantes() {
    try {
        await pool.query(
            `UPDATE recursos_humanos
             SET estado = 'cerrada'
             WHERE fecha_cierre IS NOT NULL
               AND fecha_cierre < CURRENT_DATE
               AND estado <> 'cerrada'`
        );

        await pool.query(
            `UPDATE recursos_humanos
             SET estado = 'proxima'
             WHERE fecha_cierre IS NOT NULL
               AND fecha_cierre >= CURRENT_DATE
               AND fecha_cierre <= CURRENT_DATE + INTERVAL '7 days'
               AND estado NOT IN ('proxima', 'cerrada')`
        );

        await pool.query(
            `UPDATE recursos_humanos
             SET estado = 'disponible'
             WHERE fecha_cierre IS NOT NULL
               AND fecha_cierre > CURRENT_DATE + INTERVAL '7 days'
               AND estado = 'proxima'`
        );
    } catch (error) {
        console.error('Error al actualizar estados automáticos de vacantes:', error);
    }
}

// ═════════════════════════════════════════════════════════════
//  MIDDLEWARE — Manejo de Errores de Multer
// ═════════════════════════════════════════════════════════════

const handleMulterError = (err, req, res, next) => {
    if (err && err.code === 'ABORTED') {
        return next();
    }
    if (err) {
        console.error('Error en multer:', err.message);
        return res.status(400).json({ success: false, mensaje: 'Error al procesar archivos' });
    }
    next();
};

// =========================
//  MULTER + CLOUDINARY — Perfil
// =========================

const storagePerfil = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'proyecto-ci/perfil',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
    }
});

const uploadPerfil = multer({
    storage: storagePerfil,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// =========================
//  MULTER + CLOUDINARY — Productos
// =========================

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'proyecto-ci/productos',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

const uploadFields = upload.fields([
    { name: 'imagen',  maxCount: 1  },
    { name: 'galeria', maxCount: 10 }
]);

// =========================
//  MULTER + CLOUDINARY — Recursos Humanos
// =========================

const storageRH = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'proyecto-ci/rh',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
    }
});

const uploadRH = multer({
    storage: storageRH,
    limits: { fileSize: 10 * 1024 * 1024 }
});

// =========================
//  MULTER — CVs (se queda en disco local, no se migra)
// =========================

const storageCV = multer.diskStorage({
    destination: (req, file, cb) => cb(null, carpetaCVs),
    filename:    (req, file, cb) =>
        cb(null, Date.now() + '_' + Math.random().toString(36).slice(2) + path.extname(file.originalname))
});

const uploadCV = multer({
    storage: storageCV,
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() === '.pdf') cb(null, true);
        else cb(new Error('Solo se permiten archivos PDF'));
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});

// =========================
//  MULTER + CLOUDINARY — Noticias
// =========================

const storageNoticias = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'proyecto-ci/noticias',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
    }
});

const uploadNoticias = multer({
    storage: storageNoticias,
    limits: { fileSize: 10 * 1024 * 1024 }
});

// ════════════════════════════════════════════════════════════
//  LOGIN
// ════════════════════════════════════════════════════════════

app.post('/login', async (req, res) => {
    const { correo, contrasena } = req.body;
    try {
        const resultado = await pool.query(
            `SELECT * FROM usuario WHERE correo = $1`,
            [correo]
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({ success: false, mensaje: 'Correo o contraseña incorrectos' });
        }

        const u = resultado.rows[0];

        const coincide = await bcrypt.compare(contrasena, u.contrasena);
        if (!coincide) {
            return res.status(401).json({ success: false, mensaje: 'Correo o contraseña incorrectos' });
        }

        const token = jwt.sign(
            { id: u.id_usuario, rol: u.rol },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            secure: process.env.NODE_ENV === 'production'
        });

        res.json({
            success: true,
            mensaje: 'Acceso permitido',
            usuario: {
                id_usuario: u.id_usuario,
                nombre: u.nombre,
                correo: u.correo,
                rol: u.rol,
                nombre_completo: u.nombre_completo,
                foto_perfil: u.foto_perfil
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, mensaje: 'Error del servidor' });
    }
});

app.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, mensaje: 'Sesión cerrada' });
});

app.get('/sesion', verificarSesion, (req, res) => {
    res.json({ success: true, usuario: req.usuario });
});

// ════════════════════════════════════════════════════════════
//  PRODUCTOS — lecturas públicas, escrituras protegidas
// ════════════════════════════════════════════════════════════

app.get('/productos', async (req, res) => {
    try {
        const resultado = await pool.query(`SELECT * FROM productos ORDER BY id_producto ASC`);
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener productos' });
    }
});

app.get('/productos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const prod = await pool.query(`SELECT * FROM productos WHERE id_producto = $1`, [id]);
        if (prod.rows.length === 0)
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        const galeria = await pool.query(
            `SELECT id, imagen, descripcion FROM imagenes_producto WHERE id_producto = $1 ORDER BY id ASC`, [id]
        );
        res.json({ ...prod.rows[0], galeria: galeria.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener producto' });
    }
});

app.post('/productos', verificarSesion, uploadFields, handleMulterError, async (req, res) => {
    const { nombre, descripcion, descripcion_corta, tipo, estado, fecha } = req.body;
    const imagenPrincipal = req.files['imagen']?.[0]?.path     || 'logo_ci.png'; // URL de Cloudinary
    const imagenPublicId  = req.files['imagen']?.[0]?.filename || null;         // public_id de Cloudinary
    const galeriaFiles    = req.files['galeria'] || [];
    try {
        const resultado = await pool.query(
            `INSERT INTO productos (nombre, imagen, imagen_public_id, descripcion, descripcion_corta, tipo, estado, fecha)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [nombre, imagenPrincipal, imagenPublicId, descripcion, descripcion_corta || null, tipo, estado, fecha || null]
        );
        const idNuevo = resultado.rows[0].id_producto;
        for (let i = 0; i < galeriaFiles.length; i++) {
            const desc = req.body[`galeria_desc_${i}`] || '';
            await pool.query(
                `INSERT INTO imagenes_producto (id_producto, imagen, imagen_public_id, descripcion) VALUES ($1,$2,$3,$4)`,
                [idNuevo, galeriaFiles[i].path, galeriaFiles[i].filename, desc]
            );
        }
        res.json({ success: true, producto: resultado.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, mensaje: 'Error al guardar producto', error: error.message });
    }
});

app.put('/productos/:id', verificarSesion, uploadFields, handleMulterError, async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, descripcion_corta, tipo, estado } = req.body;
    const galeriaFiles = req.files['galeria'] || [];
    try {
        let imagenFinal, imagenPublicIdFinal;

        if (req.files['imagen']?.[0]) {
            imagenFinal         = req.files['imagen'][0].path;
            imagenPublicIdFinal = req.files['imagen'][0].filename;

            const actualPrev = await pool.query(`SELECT imagen_public_id FROM productos WHERE id_producto = $1`, [id]);
            if (actualPrev.rows[0]?.imagen_public_id) {
                try { await cloudinary.uploader.destroy(actualPrev.rows[0].imagen_public_id); }
                catch (e) { console.warn('No se pudo borrar imagen anterior de Cloudinary:', e.message); }
            }
        } else {
            const actual = await pool.query(`SELECT imagen, imagen_public_id FROM productos WHERE id_producto = $1`, [id]);
            imagenFinal         = actual.rows[0]?.imagen || 'logo_ci.png';
            imagenPublicIdFinal = actual.rows[0]?.imagen_public_id || null;
        }

        const resultado = await pool.query(
            `UPDATE productos SET nombre=$1,descripcion=$2,descripcion_corta=$3,tipo=$4,estado=$5,imagen=$6,imagen_public_id=$7
             WHERE id_producto=$8 RETURNING *`,
            [nombre, descripcion, descripcion_corta || null, tipo, estado, imagenFinal, imagenPublicIdFinal, id]
        );

        if (resultado.rows.length === 0)
            return res.status(404).json({ success: false, mensaje: 'Producto no encontrado' });

        for (let i = 0; i < galeriaFiles.length; i++) {
            const desc = req.body[`galeria_desc_${i}`] || '';
            await pool.query(
                `INSERT INTO imagenes_producto (id_producto, imagen, imagen_public_id, descripcion) VALUES ($1,$2,$3,$4)`,
                [id, galeriaFiles[i].path, galeriaFiles[i].filename, desc]
            );
        }
        res.json({ success: true, producto: resultado.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, mensaje: 'Error al actualizar producto', error: error.message });
    }
});

app.put('/productos/galeria/:idImagen', verificarSesion, async (req, res) => {
    const { idImagen }  = req.params;
    const { descripcion } = req.body;
    try {
        const resultado = await pool.query(
            `UPDATE imagenes_producto SET descripcion = $1 WHERE id = $2 RETURNING *`,
            [descripcion || '', idImagen]
        );
        if (resultado.rows.length === 0)
            return res.status(404).json({ success: false, mensaje: 'Imagen no encontrada' });
        res.json({ success: true, imagen: resultado.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, mensaje: 'Error al actualizar descripción de la imagen' });
    }
});

app.delete('/productos/galeria/:idImagen', verificarSesion, async (req, res) => {
    const { idImagen } = req.params;
    try {
        const img = await pool.query(`SELECT imagen_public_id FROM imagenes_producto WHERE id = $1`, [idImagen]);
        if (img.rows.length === 0)
            return res.status(404).json({ success: false, mensaje: 'Imagen no encontrada' });

        await pool.query(`DELETE FROM imagenes_producto WHERE id = $1`, [idImagen]);

        if (img.rows[0].imagen_public_id) {
            try {
                await cloudinary.uploader.destroy(img.rows[0].imagen_public_id);
            } catch (errCloud) {
                console.warn('No se pudo eliminar la imagen de Cloudinary:', errCloud.message);
            }
        }

        res.json({ success: true, mensaje: 'Imagen eliminada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, mensaje: 'Error al eliminar imagen' });
    }
});

app.delete('/productos/:id', verificarSesion, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query(`DELETE FROM productos WHERE id_producto = $1`, [id]);
        res.json({ success: true, mensaje: 'Producto eliminado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, mensaje: 'Error al eliminar producto' });
    }
});

// ════════════════════════════════════════════════════════════
//  RECURSOS HUMANOS
// ════════════════════════════════════════════════════════════

app.get('/recursos-humanos', async (req, res) => {
    try {
        await actualizarEstadosVacantes();
        const resultado = await pool.query(
            `SELECT * FROM recursos_humanos ORDER BY fecha_publicacion DESC`
        );
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener vacantes' });
    }
});

app.get('/recursos-humanos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await actualizarEstadosVacantes();
        const resultado = await pool.query(
            `SELECT * FROM recursos_humanos WHERE id_rh = $1`, [id]
        );
        if (resultado.rows.length === 0)
            return res.status(404).json({ mensaje: 'Vacante no encontrada' });
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener vacante' });
    }
});

app.post('/recursos-humanos', verificarSesion, uploadRH.single('imagen'), handleMulterError, async (req, res) => {
    const { titulo, descripcion, requisitos, ofrecemos,
            horario, salario, fecha_cierre, estado, icono } = req.body;
    const imagen         = req.file?.path     || null; // URL de Cloudinary
    const imagenPublicId = req.file?.filename || null; // public_id

    try {
        const resultado = await pool.query(
            `INSERT INTO recursos_humanos
             (titulo, descripcion, requisitos, ofrecemos, horario, salario,
              fecha_cierre, estado, icono, imagen, imagen_public_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
            [titulo, descripcion, requisitos || null, ofrecemos || null,
             horario || null, salario || null,
             fecha_cierre || null,
             estado || 'disponible',
             icono  || 'work',
             imagen, imagenPublicId]
        );
        res.json({ success: true, vacante: resultado.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, mensaje: 'Error al crear vacante', error: error.message });
    }
});

app.put('/recursos-humanos/:id', verificarSesion, uploadRH.single('imagen'), handleMulterError, async (req, res) => {
    const { id } = req.params;
    const { titulo, descripcion, requisitos, ofrecemos,
            horario, salario, fecha_cierre, estado, icono } = req.body;

    try {
        let imagenFinal, imagenPublicIdFinal;

        if (req.file) {
            imagenFinal         = req.file.path;
            imagenPublicIdFinal = req.file.filename;

            const actualPrev = await pool.query(
                `SELECT imagen_public_id FROM recursos_humanos WHERE id_rh = $1`, [id]
            );
            if (actualPrev.rows[0]?.imagen_public_id) {
                try { await cloudinary.uploader.destroy(actualPrev.rows[0].imagen_public_id); }
                catch (e) { console.warn('No se pudo borrar imagen anterior de Cloudinary:', e.message); }
            }
        } else {
            const actual = await pool.query(
                `SELECT imagen, imagen_public_id FROM recursos_humanos WHERE id_rh = $1`, [id]
            );
            imagenFinal         = actual.rows[0]?.imagen || null;
            imagenPublicIdFinal = actual.rows[0]?.imagen_public_id || null;
        }

        const resultado = await pool.query(
            `UPDATE recursos_humanos
             SET titulo=$1, descripcion=$2, requisitos=$3, ofrecemos=$4,
                 horario=$5, salario=$6, fecha_cierre=$7, estado=$8,
                 icono=$9, imagen=$10, imagen_public_id=$11
             WHERE id_rh=$12 RETURNING *`,
            [titulo, descripcion, requisitos || null, ofrecemos || null,
             horario || null, salario || null,
             fecha_cierre || null,
             estado || 'disponible',
             icono  || 'work',
             imagenFinal, imagenPublicIdFinal, id]
        );

        if (resultado.rows.length === 0)
            return res.status(404).json({ success: false, mensaje: 'Vacante no encontrada' });

        res.json({ success: true, vacante: resultado.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, mensaje: 'Error al actualizar vacante', error: error.message });
    }
});

app.delete('/recursos-humanos/:id', verificarSesion, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query(`DELETE FROM recursos_humanos WHERE id_rh = $1`, [id]);
        res.json({ success: true, mensaje: 'Vacante eliminada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, mensaje: 'Error al eliminar vacante' });
    }
});

actualizarEstadosVacantes();
setInterval(actualizarEstadosVacantes, 60 * 60 * 1000);

// ════════════════════════════════════════════════════════════
//  POSTULACIONES — el envío es público, gestión protegida
//  (los CVs se quedan en disco local, sin cambios de Cloudinary)
// ════════════════════════════════════════════════════════════

app.get('/postulaciones', verificarSesion, async (req, res) => {
    try {
        const resultado = await pool.query(
            `SELECT p.*, rh.titulo AS vacante_titulo
            FROM postulaciones p
            LEFT JOIN recursos_humanos rh ON p.id_rh = rh.id_rh
            ORDER BY p.fecha_postulacion DESC`
        );
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener postulaciones' });
    }
});

app.post('/postulaciones', uploadCV.single('cv'), handleMulterError, async (req, res) => {
    const { nombre, correo, telefono, id_rh } = req.body;
    if (!nombre || !correo || !id_rh)
        return res.status(400).json({ success: false, mensaje: 'Faltan campos obligatorios.' });
    if (!req.file)
        return res.status(400).json({ success: false, mensaje: 'Debe adjuntar un CV en PDF.' });
    try {
        const resultado = await pool.query(
            `INSERT INTO postulaciones (nombre, correo, telefono, cv, id_rh)
             VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [nombre, correo, telefono || null, req.file.filename, id_rh]
        );
        res.json({ success: true, postulacion: resultado.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, mensaje: 'Error al guardar la postulación.' });
    }
});

app.put('/postulaciones/:id/estado', verificarSesion, async (req, res) => {
    const { id }     = req.params;
    const { estado } = req.body;
    const validos    = ['pendiente', 'revisado', 'aceptado', 'rechazado'];
    if (!validos.includes(estado))
        return res.status(400).json({ success: false, mensaje: 'Estado no válido.' });
    try {
        const resultado = await pool.query(
            `UPDATE postulaciones SET estado=$1 WHERE id_postulacion=$2 RETURNING *`,
            [estado, id]
        );
        if (resultado.rows.length === 0)
            return res.status(404).json({ success: false, mensaje: 'Postulación no encontrada.' });
        res.json({ success: true, postulacion: resultado.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, mensaje: 'Error al actualizar estado.' });
    }
});

app.delete('/postulaciones/:id', verificarSesion, async (req, res) => {
    const { id } = req.params;
    try {
        const post = await pool.query(
            `SELECT cv FROM postulaciones WHERE id_postulacion=$1`, [id]
        );
        if (post.rows.length === 0)
            return res.status(404).json({ success: false, mensaje: 'Postulación no encontrada.' });
        await pool.query(`DELETE FROM postulaciones WHERE id_postulacion=$1`, [id]);
        const rutaCV = path.join(carpetaCVs, post.rows[0].cv);
        if (fs.existsSync(rutaCV)) fs.unlinkSync(rutaCV);
        res.json({ success: true, mensaje: 'Postulación eliminada.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, mensaje: 'Error al eliminar postulación.' });
    }
});

app.get('/cvs/:archivo', verificarSesion, (req, res) => {
    const nombreArchivo = decodeURIComponent(req.params.archivo);
    const rutaCV = path.join(carpetaCVs, nombreArchivo);
    if (!fs.existsSync(rutaCV))
        return res.status(404).json({ mensaje: 'Archivo no encontrado.' });
    res.download(rutaCV, nombreArchivo);
});

// ════════════════════════════════════════════════════════════
//  NOTICIAS — lecturas públicas, escrituras protegidas
// ════════════════════════════════════════════════════════════

app.get('/noticias', async (req, res) => {
    try {
        const resultado = await pool.query(
            `SELECT * FROM noticias ORDER BY fecha_publicacion DESC`
        );

        const noticiasConGaleria = await Promise.all(
            resultado.rows.map(async (noticia) => {
                const galeria = await pool.query(
                    `SELECT id, imagen FROM imagenes_noticia WHERE id_noticia = $1 ORDER BY id ASC`,
                    [noticia.id_noticia]
                );
                return { ...noticia, galeria: galeria.rows };
            })
        );

        res.json(noticiasConGaleria);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener noticias' });
    }
});

app.get('/noticias/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const noticia = await pool.query(
            `SELECT * FROM noticias WHERE id_noticia = $1`, [id]
        );
        if (noticia.rows.length === 0)
            return res.status(404).json({ mensaje: 'Noticia no encontrada' });

        const galeria = await pool.query(
            `SELECT id, imagen FROM imagenes_noticia WHERE id_noticia = $1 ORDER BY id ASC`, [id]
        );

        res.json({ ...noticia.rows[0], galeria: galeria.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener noticia' });
    }
});

app.post('/noticias', verificarSesion, uploadNoticias.fields([
    { name: 'imagen', maxCount: 1 },
    { name: 'galeria', maxCount: 5 }
]), handleMulterError, async (req, res) => {
    const { tipo, categoria, titulo, contenido, estado, fecha_publicacion } = req.body;
    const imagen         = req.files['imagen']?.[0]?.path     || null; // URL de Cloudinary
    const imagenPublicId = req.files['imagen']?.[0]?.filename || null; // public_id
    const galeriaFiles   = req.files['galeria'] || [];

    try {
        if (!tipo || !categoria || !titulo || !contenido) {
            return res.status(400).json({ success: false, mensaje: 'Faltan campos obligatorios' });
        }

        const resultado = await pool.query(
            `INSERT INTO noticias
            (tipo, categoria, titulo, contenido, estado, imagen, imagen_public_id, fecha_publicacion)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [tipo, categoria, titulo, contenido, estado || 'activo', imagen, imagenPublicId,
             fecha_publicacion || new Date().toISOString().split('T')[0]]
        );

        const idNuevo = resultado.rows[0].id_noticia;

        for (let i = 0; i < galeriaFiles.length; i++) {
            await pool.query(
                `INSERT INTO imagenes_noticia (id_noticia, imagen, imagen_public_id) VALUES ($1,$2,$3)`,
                [idNuevo, galeriaFiles[i].path, galeriaFiles[i].filename]
            );
        }

        res.json({ success: true, noticia: resultado.rows[0] });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, mensaje: 'Error al crear noticia', error: error.message });
    }
});

app.put('/noticias/:id', verificarSesion, uploadNoticias.fields([
    { name: 'imagen', maxCount: 1 },
    { name: 'galeria', maxCount: 5 }
]), handleMulterError, async (req, res) => {
    const { id } = req.params;
    const { tipo, categoria, titulo, contenido, estado, fecha_publicacion } = req.body;
    const galeriaFiles = req.files['galeria'] || [];

    try {
        let imagenFinal, imagenPublicIdFinal;

        if (req.files['imagen']?.[0]) {
            imagenFinal         = req.files['imagen'][0].path;
            imagenPublicIdFinal = req.files['imagen'][0].filename;

            const actualPrev = await pool.query(
                `SELECT imagen_public_id FROM noticias WHERE id_noticia = $1`, [id]
            );
            if (actualPrev.rows[0]?.imagen_public_id) {
                try { await cloudinary.uploader.destroy(actualPrev.rows[0].imagen_public_id); }
                catch (e) { console.warn('No se pudo borrar imagen anterior de Cloudinary:', e.message); }
            }
        } else {
            const actual = await pool.query(
                `SELECT imagen, imagen_public_id FROM noticias WHERE id_noticia = $1`, [id]
            );
            imagenFinal         = actual.rows[0]?.imagen || null;
            imagenPublicIdFinal = actual.rows[0]?.imagen_public_id || null;
        }

        const resultado = await pool.query(
            `UPDATE noticias
             SET tipo=$1, categoria=$2, titulo=$3, contenido=$4, estado=$5, imagen=$6, imagen_public_id=$7, fecha_publicacion=$8
             WHERE id_noticia=$9 RETURNING *`,
            [tipo, categoria, titulo, contenido, estado || 'activo', imagenFinal, imagenPublicIdFinal, fecha_publicacion, id]
        );

        if (resultado.rows.length === 0)
            return res.status(404).json({ success: false, mensaje: 'Noticia no encontrada' });

        for (let i = 0; i < galeriaFiles.length; i++) {
            await pool.query(
                `INSERT INTO imagenes_noticia (id_noticia, imagen, imagen_public_id) VALUES ($1,$2,$3)`,
                [id, galeriaFiles[i].path, galeriaFiles[i].filename]
            );
        }

        res.json({ success: true, noticia: resultado.rows[0] });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, mensaje: 'Error al actualizar noticia', error: error.message });
    }
});

app.delete('/noticias/:id', verificarSesion, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query(`DELETE FROM noticias WHERE id_noticia = $1`, [id]);
        res.json({ success: true, mensaje: 'Noticia eliminada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, mensaje: 'Error al eliminar noticia' });
    }
});

app.delete('/noticias/:idNoticia/galeria/:idImagen', verificarSesion, async (req, res) => {
    const { idNoticia, idImagen } = req.params;
    try {
        const img = await pool.query(
            `SELECT imagen_public_id FROM imagenes_noticia WHERE id = $1 AND id_noticia = $2`,
            [idImagen, idNoticia]
        );
        if (img.rows.length === 0)
            return res.status(404).json({ success: false, mensaje: 'Imagen no encontrada' });

        await pool.query(`DELETE FROM imagenes_noticia WHERE id = $1`, [idImagen]);

        if (img.rows[0].imagen_public_id) {
            try {
                await cloudinary.uploader.destroy(img.rows[0].imagen_public_id);
            } catch (errCloud) {
                console.warn('No se pudo eliminar la imagen de Cloudinary:', errCloud.message);
            }
        }

        res.json({ success: true, mensaje: 'Imagen eliminada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, mensaje: 'Error al eliminar imagen' });
    }
});

// ════════════════════════════════════════════════════════════
//  SUGERENCIAS — el envío público sigue abierto; gestión protegida
// ════════════════════════════════════════════════════════════

app.get('/sugerencias', verificarSesion, async (req, res) => {
    try {
        const resultado = await pool.query(
           `SELECT * FROM sugerencias ORDER BY fecha_envio DESC`
        );
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener sugerencias' });
    }
});

app.get('/sugerencias/estado/:estado', verificarSesion, async (req, res) => {
    const { estado } = req.params;
    const validos = ['pendiente', 'revisada'];
    if (!validos.includes(estado))
        return res.status(400).json({ success: false, mensaje: 'Estado no válido' });
    try {
        const resultado = await pool.query(
            `SELECT * FROM sugerencias WHERE estado = $1 ORDER BY fecha_envio DESC`,
            [estado]
        );
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener sugerencias' });
    }
});

app.post('/sugerencias', async (req, res) => {
    const { nombre, correo, asunto, mensaje } = req.body;

    try {
        if (!nombre || !correo || !asunto || !mensaje) {
            return res.status(400).json({ success: false, mensaje: 'Faltan campos obligatorios' });
        }

        const resultado = await pool.query(
            `INSERT INTO sugerencias (nombre, correo, asunto, mensaje)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [nombre, correo, asunto, mensaje]
        );

        res.json({ success: true, sugerencia: resultado.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, mensaje: 'Error al guardar sugerencia' });
    }
});

app.patch('/sugerencias/:id/revisar', verificarSesion, async (req, res) => {
    const { id } = req.params;

    try {
        const resultado = await pool.query(
            `UPDATE sugerencias SET estado = 'revisada' WHERE id_sugerencia = $1 RETURNING *`,
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ success: false, mensaje: 'Sugerencia no encontrada' });
        }

        res.json({ success: true, sugerencia: resultado.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, mensaje: 'Error al actualizar sugerencia' });
    }
});

app.delete('/sugerencias/:id', verificarSesion, async (req, res) => {
    const { id } = req.params;

    try {
        const resultado = await pool.query(
            `DELETE FROM sugerencias WHERE id_sugerencia = $1 RETURNING *`,
            [id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ success: false, mensaje: 'Sugerencia no encontrada' });
        }

        res.json({ success: true, mensaje: 'Sugerencia eliminada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, mensaje: 'Error al eliminar sugerencia' });
    }
});

// ════════════════════════════════════════════════════════════
//  USUARIO / PERFIL — todo protegido; creación además exige admin
// ════════════════════════════════════════════════════════════

app.get('/usuario/:id', verificarSesion, async (req, res) => {
    const { id } = req.params;
    try {
        const resultado = await pool.query(
            `SELECT id_usuario, nombre, correo, rol, nombre_completo, foto_perfil
             FROM usuario WHERE id_usuario = $1`,
            [id]
        );
        if (resultado.rows.length === 0)
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener usuario' });
    }
});

app.put('/usuario/:id', verificarSesion, uploadPerfil.single('foto_perfil'), handleMulterError, async (req, res) => {
    const { id } = req.params;
    const { nombre_completo, correo, contrasena_actual, contrasena_nueva } = req.body;

    try {
        const actual = await pool.query(`SELECT * FROM usuario WHERE id_usuario = $1`, [id]);
        if (actual.rows.length === 0)
            return res.status(404).json({ success: false, mensaje: 'Usuario no encontrado' });

        let fotoFinal         = actual.rows[0].foto_perfil;
        let fotoPublicIdFinal = actual.rows[0].foto_perfil_public_id;

        if (req.file) {
            fotoFinal         = req.file.path;     // URL de Cloudinary
            fotoPublicIdFinal = req.file.filename; // public_id

            if (actual.rows[0].foto_perfil_public_id) {
                try {
                    await cloudinary.uploader.destroy(actual.rows[0].foto_perfil_public_id);
                } catch (errCloud) {
                    console.warn('No se pudo eliminar la foto anterior de Cloudinary:', errCloud.message);
                }
            }
        }

        let nuevaContrasena = actual.rows[0].contrasena;
        if (contrasena_nueva) {
            const coincideActual = await bcrypt.compare(contrasena_actual || '', actual.rows[0].contrasena);
            if (!coincideActual) {
                return res.status(401).json({ success: false, mensaje: 'La contraseña actual no es correcta' });
            }
            nuevaContrasena = await bcrypt.hash(contrasena_nueva, 10);
        }

        const resultado = await pool.query(
            `UPDATE usuario
             SET nombre_completo = $1, correo = $2, foto_perfil = $3, foto_perfil_public_id = $4, contrasena = $5
             WHERE id_usuario = $6
             RETURNING id_usuario, nombre, correo, rol, nombre_completo, foto_perfil`,
            [nombre_completo, correo, fotoFinal, fotoPublicIdFinal, nuevaContrasena, id]
        );

        res.json({ success: true, usuario: resultado.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, mensaje: 'Error al actualizar perfil', error: error.message });
    }
});

app.post('/usuario', verificarSesion, requiereRol('administrador'), async (req, res) => {
    const { nombre, correo, contrasena, nombre_completo, rol } = req.body;

    if (!nombre || !correo || !contrasena || !nombre_completo) {
        return res.status(400).json({ success: false, mensaje: 'Faltan campos obligatorios' });
    }

    try {
        const hash = await bcrypt.hash(contrasena, 10);
        const resultado = await pool.query(
            `INSERT INTO usuario (nombre, correo, contrasena, nombre_completo, rol)
             VALUES ($1,$2,$3,$4,$5)
             RETURNING id_usuario, nombre, correo, rol, nombre_completo`,
            [nombre, correo, hash, nombre_completo, rol || 'editor']
        );
        res.json({ success: true, usuario: resultado.rows[0] });
    } catch (error) {
        console.error(error);
        if (error.code === '23505') {
            return res.status(409).json({ success: false, mensaje: 'Ese nombre de usuario o correo ya existe' });
        }
        res.status(500).json({ success: false, mensaje: 'Error al crear usuario', error: error.message });
    }
});

// ════════════════════════════════════════════════════════════
//  INICIAR SERVIDOR
// ════════════════════════════════════════════════════════════

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('Servidor ejecutándose en puerto', PORT);
    console.log('CVs:', carpetaCVs);
    console.log('Imágenes (productos/RH/noticias/perfil): Cloudinary');
});