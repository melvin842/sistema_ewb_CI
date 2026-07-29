// =========================
//  POSTULACIONES — configuración multer para CVs
// =========================

const carpetaCVs = path.join(raiz, 'cvs');

if(!fs.existsSync(carpetaCVs)){
    fs.mkdirSync(carpetaCVs, { recursive: true });
    console.log('Carpeta CVs creada:', carpetaCVs);
}

const storageCV = multer.diskStorage({
    destination: (req, file, cb) => cb(null, carpetaCVs),
    filename:    (req, file, cb) =>
        cb(null, Date.now() + '_' + Math.random().toString(36).slice(2) + path.extname(file.originalname))
});

const uploadCV = multer({
    storage: storageCV,
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
if(ext === '.pdf'){
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos PDF, DOC o DOCX'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB máximo
});

// =========================
//  POSTULACIONES — POST (enviar postulación)
// =========================

app.post('/postulaciones', uploadCV.single('cv'), async (req, res) => {

    const { nombre, correo, telefono, id_rh } = req.body;
    const cv = req.file?.filename;

    if(!nombre || !correo || !id_rh || !cv){
        return res.status(400).json({ success: false, mensaje: 'Faltan campos obligatorios.' });
    }

    try {
        await pool.query(
            `INSERT INTO postulaciones (nombre, correo, telefono, cv, id_rh)
             VALUES ($1, $2, $3, $4, $5)`,
            [nombre, correo, telefono || null, cv, id_rh]
        );

        res.json({ success: true, mensaje: 'Postulación recibida correctamente.' });

    } catch(error){
        console.error(error);
        res.status(500).json({ success: false, mensaje: 'Error al guardar la postulación.' });
    }
});

// =========================
//  POSTULACIONES — GET (listar por vacante, para el panel)
// =========================

app.get('/postulaciones/:id_rh', async (req, res) => {

    const { id_rh } = req.params;

    try {
        const resultado = await pool.query(
            `SELECT * FROM postulaciones WHERE id_rh = $1 ORDER BY fecha_postulacion DESC`,
            [id_rh]
        );
        res.json(resultado.rows);
    } catch(error){
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener postulaciones.' });
    }
});