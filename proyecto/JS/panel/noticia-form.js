// ════════════════════════════════════════════════════════════
//  noticia-form.js — Agregar y Editar Noticia
// ════════════════════════════════════════════════════════════

const API = '';

const params     = new URLSearchParams(window.location.search);
const idNoticia  = params.get('id') ? Number(params.get('id')) : null;
const modoEditar = idNoticia !== null;

const formNoticia          = document.getElementById('formNoticia');
const tituloForm           = document.getElementById('tituloFormulario');
const btnGuardar           = document.getElementById('btnGuardar');
const imagenPrincipalBox   = document.getElementById('imagenPrincipal');
const inputImagenPrincipal = document.getElementById('inputImagenPrincipal');
const inputGaleria         = document.getElementById('inputGaleria');
const triggerGaleria       = document.getElementById('triggerGaleria');
const galeriaExtra         = document.getElementById('galeriaExtra');

const LOGO_DEFAULT = '../../img/logo_ci.png';
const MAX_GALERIA  = 5;

// ✅ Devuelve la fecha de HOY en hora local (YYYY-MM-DD), sin el
// desfase de toISOString() (que convierte a UTC y puede saltar
// al día siguiente o anterior según la hora y zona horaria).
function obtenerFechaLocal(){
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = String(hoy.getMonth() + 1).padStart(2, '0');
    const d = String(hoy.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Array para acumular archivos nuevos de galería
let archivosGaleria = [];

// ✅ IDs de imágenes existentes marcadas para eliminar.
// Solo se borran de la BD cuando el usuario confirma con "Actualizar".
// Si cancela (o recarga sin guardar), nunca se envía el DELETE y
// la imagen sigue intacta en el servidor.
let imagenesAEliminar = [];

// ════════════════════════════════════════════════════════════
//  IMAGEN PRINCIPAL — clic en el box abre el input
// ════════════════════════════════════════════════════════════

imagenPrincipalBox.addEventListener('click', () => inputImagenPrincipal.click());

inputImagenPrincipal.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        let img = imagenPrincipalBox.querySelector('img');
        if(!img){
            img = document.createElement('img');
            img.style.cssText = 'width:100%; height:100%; object-fit:cover;';
            imagenPrincipalBox.appendChild(img);
        }
        img.src = ev.target.result;

        const ph = imagenPrincipalBox.querySelector('.placeholder');
        if(ph) ph.style.display = 'none';

        actualizarPreview();
    };
    reader.readAsDataURL(file);
});

// ════════════════════════════════════════════════════════════
//  GALERÍA — FIX doble apertura:
//  triggerGaleria es un <div> (no <label>), así que el
//  navegador NO activa el input automáticamente. Solo lo
//  hace nuestro listener → una sola apertura del explorador.
// ════════════════════════════════════════════════════════════

triggerGaleria.addEventListener('click', () => inputGaleria.click());

inputGaleria.addEventListener('change', (e) => {
    const nuevos = Array.from(e.target.files);
    const yaHay  = galeriaExtra.querySelectorAll('.galeria-item').length;
    const libres = MAX_GALERIA - yaHay;

    nuevos.slice(0, libres).forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => agregarMiniatura(file, ev.target.result);
        reader.readAsDataURL(file);
    });

    // Permite volver a seleccionar el mismo archivo
    inputGaleria.value = '';
});

// Agrega una miniatura visual al contenedor de galería
function agregarMiniatura(file, src, idExistente = null){
    const item = document.createElement('div');
    item.className = 'galeria-item';

    // Imagen preview
    const img  = document.createElement('img');
    img.src    = src;
    img.onerror = () => { img.src = LOGO_DEFAULT; };
    // Guarda el archivo real para enviarlo en el FormData
    if(file) img._file = file;

    // Botón quitar
    const btnQ     = document.createElement('button');
    btnQ.type      = 'button';
    btnQ.className = 'remove-img';
    btnQ.innerHTML = '&times;';
    btnQ.title     = 'Quitar imagen';
    btnQ.addEventListener('click', async () => {
        // ✅ Pide confirmación antes de quitar la imagen, igual que en
        // la pantalla de productos.
        const ok = await UIAlert.confirm({
            icon:      'delete',
            iconType:  'danger',
            title:     '¿Eliminar esta imagen?',
            message:   'Esta acción no se puede deshacer.',
            btnOk:     'Eliminar',
            btnCancel: 'Cancelar',
            danger:    true
        });
        if(!ok) return;

        if(idExistente){
            imagenesAEliminar.push(idExistente);
        }
        item.remove();
    });

    item.appendChild(img);
    item.appendChild(btnQ);

    // Inserta ANTES del trigger de "Agregar Imágenes"
    galeriaExtra.insertBefore(item, triggerGaleria);
}

// ════════════════════════════════════════════════════════════
//  VISTA PREVIA EN TIEMPO REAL
// ════════════════════════════════════════════════════════════

const TIPOS_BADGE = {
    noticia:    { clase: 'badge-noticia',    texto: 'Noticia'     },
    aviso:      { clase: 'badge-aviso',      texto: 'Aviso'       },
    comunicado: { clase: 'badge-comunicado', texto: 'Comunicado'  },
    alerta:     { clase: 'badge-alerta',     texto: 'Alerta'      }
};

function actualizarPreview(){
    const tipo      = document.getElementById('tipo')?.value || 'noticia';
    const titulo    = document.getElementById('titulo')?.value || '';
    const fecha     = document.getElementById('fechaPublicacion')?.value || '';
    const contenido = document.getElementById('contenido')?.value || '';

    // Imagen
    const imgBox    = imagenPrincipalBox.querySelector('img');
    const previewImg = document.getElementById('previewImg');
    if(previewImg){
        if(imgBox?.src){
            previewImg.src           = imgBox.src;
            previewImg.style.display = 'block';
        } else {
            previewImg.style.display = 'none';
        }
    }

    // Badge tipo
    const info       = TIPOS_BADGE[tipo] || TIPOS_BADGE.noticia;
    const badgeEl    = document.getElementById('previewBadge');
    if(badgeEl){
        badgeEl.className   = `preview-badge ${info.clase}`;
        badgeEl.textContent = info.texto;
    }

    // Fecha
    const fechaEl = document.getElementById('previewFecha');
    if(fechaEl){
        fechaEl.textContent = fecha
            ? new Date(fecha).toLocaleDateString('es-MX', { day:'2-digit', month:'long', year:'numeric' })
            : '—';
    }

    // Título
    const tituloEl = document.getElementById('previewTitulo');
    if(tituloEl) tituloEl.textContent = titulo || 'Título de la noticia';

    // Contenido (extracto)
    const contenidoEl = document.getElementById('previewContenido');
    if(contenidoEl){
        const txt = contenido.trim();
        contenidoEl.textContent = txt
            ? (txt.length > 100 ? txt.substring(0, 100) + '...' : txt)
            : 'Aquí se mostrará un extracto del contenido...';
    }
}

// Listeners en tiempo real
['tipo','titulo','contenido'].forEach(id => {
    document.getElementById(id)?.addEventListener('input',  actualizarPreview);
    document.getElementById(id)?.addEventListener('change', actualizarPreview);
});
document.getElementById('fechaPublicacion')?.addEventListener('change', actualizarPreview);

// ════════════════════════════════════════════════════════════
//  MODO EDITAR / AGREGAR
// ════════════════════════════════════════════════════════════

if(modoEditar){
    tituloForm.textContent = 'Editar Noticia';
    btnGuardar.innerHTML   = `<span class="material-symbols-outlined">save</span> Actualizar`;

    fetch(`${API}/noticias/${idNoticia}`, {
    credentials: 'include'
})
    .then(res => { if(!res.ok) throw new Error('Noticia no encontrada'); return res.json(); })
    .then(n => cargarDatos(n))
    .catch(err => {
        console.error(err);
        if(typeof UIAlert !== 'undefined') UIAlert.toast('No se pudo cargar la noticia.', 'error');
    });
} else {
    tituloForm.textContent = 'Agregar Noticia';
    // Fecha de hoy por defecto — y bloqueada: no se permite una fecha
    // distinta al día de publicación real al crear la noticia.
    const hoy = obtenerFechaLocal();
    const inputFecha = document.getElementById('fechaPublicacion');
    if(inputFecha){
        inputFecha.value = hoy;
        inputFecha.min   = hoy;
        inputFecha.max   = hoy;
    }
    actualizarPreview();
}

// ════════════════════════════════════════════════════════════
//  CARGAR DATOS (modo editar)
// ════════════════════════════════════════════════════════════

function cargarDatos(n){
    // Campos de texto
    const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val || ''; };
    setVal('tipo',            n.tipo);
    setVal('titulo',          n.titulo);
    setVal('contenido',       n.contenido);
    setVal('categoria',       n.categoria);

    // Fecha — se toma tal cual la guarda la BD (YYYY-MM-DD), sin pasar
    // por new Date().toISOString() para evitar el desfase de UTC.
    if(n.fecha_publicacion){
        const f = document.getElementById('fechaPublicacion');
        if(f){
            const fechaOriginal = String(n.fecha_publicacion).split('T')[0];
            f.value = fechaOriginal;
            // No se permite retroceder antes del día de publicación original,
            // pero sí adelantarla (sin límite superior).
            f.min = fechaOriginal;
            f.removeAttribute('max');
        }
    }

    // Estado: 'activo' u 'oculta'
    const radio = document.querySelector(`input[name="estado"][value="${n.estado || 'activo'}"]`);
    if(radio) radio.checked = true;

    // Imagen principal
    if(n.imagen){
        const img = document.createElement('img');
        img.src   = `${API}/img/noticias/${n.imagen}`;
        img.onerror = () => { img.src = LOGO_DEFAULT; };
        img.style.cssText = 'width:100%; height:100%; object-fit:cover;';
        imagenPrincipalBox.innerHTML = '';
        imagenPrincipalBox.appendChild(img);
        // Vuelve a meter el input (lo necesita el listener)
        const inp = document.createElement('input');
        inp.type   = 'file';
        inp.id     = 'inputImagenPrincipal';
        inp.accept = 'image/*';
        inp.style.display = 'none';
        imagenPrincipalBox.appendChild(inp);
        inp.addEventListener('change', inputImagenPrincipal.onchange || (() => {}));
    }

    // Galería existente — muestra miniaturas con opción de eliminar
    if(Array.isArray(n.galeria)){
        n.galeria.forEach(item => {
            const src = `${API}/img/noticias/${item.imagen || item}`;
            const idImg = item.id || null;
            agregarMiniatura(null, src, idImg);
        });
    }

    actualizarPreview();
}

// ════════════════════════════════════════════════════════════
//  ENVÍO DEL FORMULARIO
// ════════════════════════════════════════════════════════════

formNoticia.addEventListener('submit', async (e) => {
    e.preventDefault();

    const tipo      = document.getElementById('tipo')?.value?.trim();
    const categoria = document.getElementById('categoria')?.value?.trim();
    const titulo    = document.getElementById('titulo')?.value?.trim();
    const contenido = document.getElementById('contenido')?.value?.trim();
    const fecha     = document.getElementById('fechaPublicacion')?.value;
    const estado    = document.querySelector('input[name="estado"]:checked')?.value || 'activo';

    if(!tipo || !categoria || !titulo || !contenido){
        if(typeof UIAlert !== 'undefined') UIAlert.toast('Completa todos los campos obligatorios.', 'warning');
        return;
    }

    const formData = new FormData();
    formData.append('tipo',             tipo);
    formData.append('categoria',        categoria);
    formData.append('titulo',           titulo);
    formData.append('contenido',        contenido);
    formData.append('estado',           estado);
    formData.append('fecha_publicacion', fecha || obtenerFechaLocal());

    // Imagen principal (si el usuario seleccionó una nueva)
    const inputImg = document.getElementById('inputImagenPrincipal');
    if(inputImg?.files[0]) formData.append('imagen', inputImg.files[0]);

    // Imágenes de galería NUEVAS (las que tienen _file)
    galeriaExtra.querySelectorAll('.galeria-item img').forEach(img => {
        if(img._file) formData.append('galeria', img._file);
    });

    const url    = modoEditar ? `${API}/noticias/${idNoticia}` : `${API}/noticias`;
    const metodo = modoEditar ? 'PUT' : 'POST';

    btnGuardar.disabled = true;

    try {
        const res = await fetch(url, { 
            method: metodo, 
            credentials: 'include',
            body: formData 
        });
        const data = await res.json();

        if(!res.ok) throw new Error(data.mensaje || `Error ${res.status}`);

        // ✅ Solo ahora, con el guardado ya confirmado y exitoso,
        // se eliminan del servidor las imágenes que el usuario marcó
        // para quitar durante la edición.
        if(modoEditar && imagenesAEliminar.length > 0){
    await Promise.all(
        imagenesAEliminar.map(idImg =>
            fetch(`${API}/noticias/${idNoticia}/galeria/${idImg}`, { 
                method: 'DELETE',
                credentials: 'include'
            })
                .catch(err => console.warn('No se pudo eliminar imagen del servidor:', err))
        )
    );
}

        if(typeof UIAlert !== 'undefined'){
            await UIAlert.alert({
                icon:    'check_circle',
                iconType:'success',
                title:   modoEditar ? 'Noticia actualizada' : 'Noticia agregada',
                message: modoEditar ? 'Los cambios se guardaron.' : 'La noticia fue publicada.',
                btnOk:   'Aceptar'
            });
        }

        window.location.href = 'noticias.html';

    } catch(err){
        console.error(err);
        if(typeof UIAlert !== 'undefined') UIAlert.toast(`Error: ${err.message}`, 'error');
        btnGuardar.disabled = false;
    }
});