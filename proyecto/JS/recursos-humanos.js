// ════════════════════════════════════════════════════════════
//  recursos-humanos.js
//  Modal de vacante + Modal de postulación
//  Carga vacantes dinámicamente desde el backend
// ════════════════════════════════════════════════════════════

const API = '';

// ── ID de la vacante actualmente abierta ──
let idRHActual = null;

// ════════════════════════════════════════════════════════════
//  CARGAR VACANTES DESDE BACKEND
// ════════════════════════════════════════════════════════════

async function cargarVacantes() {

    const contenedor = document.getElementById('vacanciesContainer');

    contenedor.innerHTML = `
        <div class="cargando">
            <span class="material-symbols-outlined spin">refresh</span>
            <p>Cargando vacantes...</p>
        </div>
    `;

    try {

        const res = await fetch(`${API}/recursos-humanos`);
        if (!res.ok) throw new Error('Error al obtener vacantes');

        const vacantes = await res.json();

        // Solo muestra disponibles y próximas a cerrar
        const visibles = vacantes.filter(v => v.estado !== 'cerrada' || true);
        // (mostramos todas, incluso cerradas, para que el modal muestre "vacante cerrada")

        if (vacantes.length === 0) {
            contenedor.innerHTML = `
                <div class="vacancies-empty">
                    <span class="material-symbols-outlined">work_off</span>
                    <h3>Actualmente no contamos con vacantes disponibles</h3>
                    <p>Las oportunidades laborales son publicadas de acuerdo con las necesidades operativas de la empresa. Te invitamos a consultar periódicamente esta sección.</p>
                </div>
            `;
            return;
        }

        contenedor.innerHTML = '';

        vacantes.forEach(v => {
            const card = crearCard(v);
            contenedor.appendChild(card);
        });

        // Asigna eventos a los nuevos links generados
        document.querySelectorAll('.vacancy-more').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                abrirModalRH(link.closest('.vacancy-card'));
            });
        });

    } catch (error) {
    console.error('Error cargando vacantes:', error);
    contenedor.innerHTML = `
        <div class="offline-state">
            <div class="offline-icon">
                <span class="material-symbols-outlined">wifi_off</span>
            </div>
            <h3>Sin conexión con el servidor</h3>
            <p>No pudimos cargar las oportunidades laborales. Verifica tu conexión e inténtalo de nuevo.</p>
            <button class="offline-retry" onclick="cargarVacantes()">
                <span class="material-symbols-outlined">refresh</span>
                Reintentar
            </button>
        </div>
    `;
    }
}

// ════════════════════════════════════════════════════════════
//  CREAR CARD DE VACANTE
// ════════════════════════════════════════════════════════════

function crearCard(v) {

    // ✅ PRIMERO: usa el icono guardado en la BD
    let icono = v.icono || 'work';

    // FALLBACK: si no hay icono en la BD, intenta inferir del título
    if (!v.icono) {
        const iconos = {
            'administrativo': 'badge',
            'producción':      'precision_manufacturing',
            'chofer':          'local_shipping',
            'repartidor':      'local_shipping',
            'ventas':          'point_of_sale',
            'almacén':         'warehouse',
        };
        const tituloLower = (v.titulo || '').toLowerCase();
        for (const [clave, val] of Object.entries(iconos)) {
            if (tituloLower.includes(clave)) { icono = val; break; }
        }
    }

    // Imagen: usa la del registro o un fallback
    const imgSrc = v.imagen
        ? `${API}/img/rh/${v.imagen}`
        : '../img/personal 2.png';

    // Tipo de jornada desde horario
    const tipo = v.horario
        ? (v.horario.toLowerCase().includes('rotativo') ? 'Turno rotativo' : 'Tiempo completo')
        : 'Tiempo completo';

    // Fecha de cierre formateada
    const fecha = v.fecha_cierre
        ? new Date(v.fecha_cierre).toLocaleDateString('es-MX')
        : '';

    // Descripción corta (primeros 120 caracteres)
    const descCorta = v.descripcion
        ? (v.descripcion.length > 120 ? v.descripcion.substring(0, 120) + '...' : v.descripcion)
        : '';

    const card = document.createElement('div');
    card.className = 'vacancy-card';

    // data-* con TODOS los campos necesarios para el modal
    card.dataset.id          = v.id_rh;
    card.dataset.titulo      = v.titulo       || '';
    card.dataset.descripcion = v.descripcion  || '';
    card.dataset.requisitos  = v.requisitos   || '';
    card.dataset.horario     = v.horario      || '';
    card.dataset.salario     = v.salario      || '';
    card.dataset.ofrecemos   = v.ofrecemos    || '';
    card.dataset.estado      = v.estado       || 'disponible';
    card.dataset.fecha       = fecha;
    card.dataset.img         = imgSrc;

    card.innerHTML = `
        <img src="${imgSrc}" alt="${v.titulo}" onerror="this.src='../img/personal 2.png'">
        <div class="vacancy-info">
            <div class="vacancy-title">
                <div class="vacancy-icon">
                    <span class="material-symbols-outlined">${icono}</span>
                </div>
                <h3>${v.titulo}</h3>
            </div>
            <p>${descCorta}</p>
            <span class="vacancy-type">${tipo}</span>
            <a href="#" class="vacancy-more">Más información</a>
        </div>
    `;

    return card;
}

// ════════════════════════════════════════════════════════════
//  ABRIR MODAL VACANTE
// ════════════════════════════════════════════════════════════

const modalRH      = document.getElementById('modalRH');
const closeModalRH = document.querySelector('.close-modal-rh');

function abrirModalRH(card) {

    // ✅ Aquí ya llega el id_rh real desde la BD
    idRHActual = card.dataset.id || null;

    document.getElementById('rhModalImg').src                 = card.dataset.img         || '';
    document.getElementById('rhModalTitulo').textContent      = card.dataset.titulo       || '';
    document.getElementById('rhModalFecha').textContent       = card.dataset.fecha        || '';
    document.getElementById('rhModalDescripcion').textContent = card.dataset.descripcion  || '';
    document.getElementById('rhModalHorario').textContent     = card.dataset.horario      || '';
    document.getElementById('rhModalSalario').textContent     = card.dataset.salario      || '';

    // Requisitos y ofrecemos con saltos de línea
    document.getElementById('rhModalRequisitos').innerHTML =
        (card.dataset.requisitos || '').replace(/\n/g, '<br>');

    document.getElementById('rhModalOfrecemos').innerHTML =
        (card.dataset.ofrecemos || '').replace(/\n/g, '<br>');

    // Estado
    const estado   = card.dataset.estado || 'disponible';
    const estadoEl = document.getElementById('rhModalEstado');
    const textos   = { disponible: 'Vacante disponible', cerrada: 'Vacante cerrada', proxima: 'Próxima a cerrar' };
    const colores  = { disponible: '#026432', cerrada: '#cc0000', proxima: '#e6b400' };
    estadoEl.textContent      = textos[estado] || estado;
    estadoEl.style.background = colores[estado] || '#026432';

    // Contacto / botones / mensaje cerrada
    const contactoEl  = document.querySelector('.rh-contacto');
    const botonesEl   = document.querySelector('.rh-btns');
    const prevMensaje = document.getElementById('rhMensajeCerrada');
    if (prevMensaje) prevMensaje.remove();

    if (estado === 'cerrada') {
        contactoEl.style.display = 'none';
        botonesEl.style.display  = 'none';
        const msg = document.createElement('p');
        msg.id = 'rhMensajeCerrada';
        msg.textContent = 'Esta vacante ya no se encuentra disponible. Te invitamos a consultar otras oportunidades laborales.';
        msg.style.cssText = 'color:#026432; font-weight:600; text-align:center; margin-top:12px;';
        botonesEl.insertAdjacentElement('afterend', msg);
    } else {
        contactoEl.style.display = '';
        botonesEl.style.display  = '';
    }

    document.querySelector('.modal-rh-content').scrollTop = 0;
    modalRH.classList.add('show');
    document.body.style.overflow = 'hidden';
}

closeModalRH.addEventListener('click', cerrarModalRH);
window.addEventListener('click', e => { if (e.target === modalRH) cerrarModalRH(); });

function cerrarModalRH() {
    modalRH.classList.remove('show');
    document.body.style.overflow = '';
}

// ════════════════════════════════════════════════════════════
//  BOTÓN POSTULARME
// ════════════════════════════════════════════════════════════

document.getElementById('btnPostularme').addEventListener('click', () => {
    cerrarModalRH();
    abrirModalPostulacion();
});

// ════════════════════════════════════════════════════════════
//  MODAL DE POSTULACIÓN
// ════════════════════════════════════════════════════════════

const modalPost      = document.getElementById('modalPostulacion');
const closeModalPost = document.getElementById('closeModalPost');
const formPost       = document.getElementById('formPostulacion');
const inputCV        = document.getElementById('postCV');
const cvNombre       = document.getElementById('cvNombre');

function abrirModalPostulacion() {
    const titulo = document.getElementById('rhModalTitulo').textContent;
    document.getElementById('postTituloVacante').textContent = titulo;

    formPost.reset();
    cvNombre.textContent = 'Ningún archivo seleccionado';
    document.getElementById('postError').style.display = 'none';

    const content = document.querySelector('#modalPostulacion .modal-rh-content');
    if (content) content.scrollTop = 0;

    modalPost.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function cerrarModalPost() {
    modalPost.classList.remove('show');
    document.body.style.overflow = '';
}

closeModalPost.addEventListener('click', cerrarModalPost);
document.getElementById('closeModalPost2').addEventListener('click', cerrarModalPost);
window.addEventListener('click', e => { if (e.target === modalPost) cerrarModalPost(); });

// Nombre del archivo seleccionado
inputCV.addEventListener('change', () => {
    cvNombre.textContent = inputCV.files[0]?.name || 'Ningún archivo seleccionado';
});

// ── ENVÍO ──
formPost.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre   = document.getElementById('postNombre').value.trim();
    const correo   = document.getElementById('postCorreo').value.trim();
    const telefono = document.getElementById('postTelefono').value.trim();
    const cv       = inputCV.files[0];

    if (!nombre || !correo || !cv) {
        mostrarErrorPost('Por favor completa todos los campos obligatorios.');
        return;
    }

    // ✅ Ahora idRHActual siempre tiene el id real de la BD
    if (!idRHActual) {
        mostrarErrorPost('No se pudo identificar la vacante. Intenta de nuevo.');
        return;
    }

    const formData = new FormData();
    formData.append('nombre',   nombre);
    formData.append('correo',   correo);
    formData.append('telefono', telefono);
    formData.append('cv',       cv);
    formData.append('id_rh',    idRHActual);

    const btnEnviar       = document.getElementById('btnEnviarPost');
    btnEnviar.disabled    = true;
    btnEnviar.textContent = 'Enviando...';

    try {
        const res  = await fetch(`${API}/postulaciones`, { method: 'POST', body: formData });
        const data = await res.json();

        if (!res.ok || !data.success) throw new Error(data.mensaje || 'Error al enviar');

        cerrarModalPost();
        
        // ✅ CAMBIO: Usa UIAlert.postulationSuccess() en lugar de mostrarExitoPost()
        await UIAlert.postulationSuccess();

    } catch (error) {
        console.error(error);
        mostrarErrorPost(error.message || 'Ocurrió un error. Intenta más tarde.');
    } finally {
        btnEnviar.disabled    = false;
        btnEnviar.textContent = 'Enviar Postulación';
    }
});

function mostrarErrorPost(msg) {
    const el = document.getElementById('postError');
    el.textContent   = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
}

// ✅ ELIMINADA: La función mostrarExitoPost() ya no se usa
// Ahora se usa UIAlert.postulationSuccess() que no depende de elementos HTML

// ════════════════════════════════════════════════════════════
//  INICIO
// ════════════════════════════════════════════════════════════

cargarVacantes();