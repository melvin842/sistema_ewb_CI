(function () {

// =========================
//  ESTADO DE FILTROS / PAGINACION
// =========================

const FILAS_POR_PAGINA = 5;

let sugerencias  = [];
let busqueda     = "";
let filtroEstado = "todas";
let paginaActual = 1;
let idAEliminar  = null;
let idEnVista    = null;

// =========================
//  ELEMENTOS
// =========================

const tabla        = document.getElementById('tablaSugerencias');
const emptyState   = document.getElementById('emptyState');
const paginacion   = document.getElementById('paginacion');
const inputBuscar  = document.getElementById('buscarSugerencia');
const selectEstado = document.getElementById('filtroEstado');

const modalEliminar   = document.getElementById('modalEliminar');
const cancelEliminar  = document.getElementById('cancelEliminar');
const confirmEliminar = document.getElementById('confirmEliminar');

const modalVista     = document.getElementById('modalVista');
const cerrarVista    = document.getElementById('cerrarVista');
const marcarRevisada = document.getElementById('marcarRevisada');

// =========================
//  TEXTOS / CLASES POR ESTADO
// =========================

const ESTADOS = {
    pendiente: { texto: "Pendiente", clase: "badge-proximo" },
    revisada:  { texto: "Revisada",  clase: "badge-activo"  }
};

// ═════════════════════════════════════════════════════════════
//  CARGAR SUGERENCIAS DESDE BACKEND
// ═════════════════════════════════════════════════════════════

async function cargarSugerencias(){
    try {
        const respuesta = await fetch('/sugerencias', {
            credentials: 'include'
        });

        if(!respuesta.ok){
            throw new Error(`Error ${respuesta.status}`);
        }

        sugerencias = await respuesta.json();
        renderTabla();

    } catch(error){
        console.error('Error al cargar sugerencias:', error);
        UIAlert.toast('Error al cargar las sugerencias', 'error');
    }
}

// =========================
//  ACTUALIZAR TARJETAS DE ESTADISTICAS
// =========================

function actualizarStats(){
    const total      = sugerencias.length;
    const revisadas  = sugerencias.filter(s => s.estado === 'revisada').length;
    const pendientes = sugerencias.filter(s => s.estado === 'pendiente').length;

    document.getElementById('statTotal').textContent      = total;
    document.getElementById('statRevisadas').textContent  = revisadas;
    document.getElementById('statPendientes').textContent = pendientes;
}

// =========================
//  FILTRADO
// =========================

function obtenerFiltrados(){
    return sugerencias.filter(s => {
        const texto = busqueda.toLowerCase();

        const coincideBusqueda =
            s.nombre.toLowerCase().includes(texto) ||
            s.asunto.toLowerCase().includes(texto) ||
            s.correo.toLowerCase().includes(texto);

        const coincideEstado = filtroEstado === 'todas' || s.estado === filtroEstado;

        return coincideBusqueda && coincideEstado;
    });
}

// =========================
//  RENDER TABLA
// =========================

function renderTabla(){

    const datos = obtenerFiltrados();

    const totalPaginas = Math.max(1, Math.ceil(datos.length / FILAS_POR_PAGINA));
    if(paginaActual > totalPaginas) paginaActual = totalPaginas;

    const inicio   = (paginaActual - 1) * FILAS_POR_PAGINA;
    const visibles = datos.slice(inicio, inicio + FILAS_POR_PAGINA);

    tabla.innerHTML = '';

    emptyState.style.display = visibles.length === 0 ? 'block' : 'none';

    visibles.forEach(s => {

        const estado = ESTADOS[s.estado] || ESTADOS.pendiente;

        const fecha = s.fecha_envio
            ? new Date(s.fecha_envio).toLocaleDateString('es-MX', {
                day:   '2-digit',
                month: '2-digit',
                year:  'numeric'
              })
            : '—';

        const fila = document.createElement('tr');

        fila.innerHTML = `
            <td>${s.id_sugerencia}</td>
            <td>${s.nombre}</td>
            <td>${s.correo}</td>
            <td>${s.asunto}</td>
            <td><span class="badge-estado ${estado.clase}">${estado.texto}</span></td>
            <td>${fecha}</td>
            <td class="acciones">
                <button class="ver" title="Ver" data-id="${s.id_sugerencia}">
                    <span class="material-symbols-outlined">visibility</span>
                </button>
                <button class="eliminar" title="Eliminar" data-id="${s.id_sugerencia}">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </td>
        `;

        tabla.appendChild(fila);
    });

    renderPaginacion(totalPaginas);
    actualizarStats();

    // ── Listeners botones ──
    tabla.querySelectorAll('.eliminar').forEach(btn => {
        btn.addEventListener('click', () => {
            const id         = Number(btn.dataset.id);
            const sugerencia = sugerencias.find(s => s.id_sugerencia === id);
            idAEliminar      = id;
            eliminarSugerencia(sugerencia?.asunto || 'esta sugerencia');
        });
    });

    tabla.querySelectorAll('.ver').forEach(btn => {
        btn.addEventListener('click', () => {
            abrirVista(Number(btn.dataset.id));
        });
    });
}

// =========================
//  RENDER PAGINACION
// =========================

function renderPaginacion(totalPaginas){

    paginacion.innerHTML = '';

    if(totalPaginas <= 1) return;

    const crearBtn = (texto, pagina, activo = false, deshabilitado = false) => {
        const btn = document.createElement('button');
        btn.textContent = texto;
        if(activo)        btn.classList.add('active');
        if(deshabilitado) btn.disabled = true;

        btn.addEventListener('click', () => {
            paginaActual = pagina;
            renderTabla();
            const contenedor = tabla.closest('section, .content, main');
            if(contenedor) contenedor.scrollIntoView({ behavior: 'smooth', block: 'start' });
            else           tabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        return btn;
    };

    paginacion.appendChild(crearBtn('‹', paginaActual - 1, false, paginaActual === 1));

    let inicio = Math.max(1, paginaActual - 2);
    let fin    = Math.min(totalPaginas, inicio + 4);
    inicio     = Math.max(1, fin - 4);

    for(let i = inicio; i <= fin; i++){
        paginacion.appendChild(crearBtn(i, i, i === paginaActual));
    }

    paginacion.appendChild(crearBtn('›', paginaActual + 1, false, paginaActual === totalPaginas));
}

// ═════════════════════════════════════════════════════════════
//  MODAL VER SUGERENCIA
// ═════════════════════════════════════════════════════════════

function abrirVista(id){

    const s = sugerencias.find(item => item.id_sugerencia === id);
    if(!s) return;

    idEnVista = id;

    const estado = ESTADOS[s.estado] || ESTADOS.pendiente;

    const fecha = s.fecha_envio
        ? new Date(s.fecha_envio).toLocaleDateString('es-MX', {
            day:   '2-digit',
            month: '2-digit',
            year:  'numeric'
          })
        : '—';

    document.getElementById('vistaAsunto').textContent  = s.asunto;
    document.getElementById('vistaNombre').textContent  = s.nombre;
    document.getElementById('vistaCorreo').textContent  = s.correo;
    document.getElementById('vistaFecha').textContent   = fecha;
    document.getElementById('vistaMensaje').textContent = s.mensaje;

    const estadoEl       = document.getElementById('vistaEstado');
    estadoEl.textContent = estado.texto;
    estadoEl.className   = `badge-estado ${estado.clase}`;

    marcarRevisada.style.display = s.estado === 'pendiente' ? 'inline-block' : 'none';

    modalVista.scrollTop = 0;
    modalVista.classList.add('show');
}

marcarRevisada.addEventListener('click', async () => {
    if(idEnVista === null) return;

    try {
        const respuesta = await fetch(`/sugerencias/${idEnVista}/revisar`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if(!respuesta.ok) throw new Error(`Error ${respuesta.status}`);

        const resultado = await respuesta.json();
        if(!resultado.success) throw new Error(resultado.mensaje || 'Error desconocido');

        const s = sugerencias.find(item => item.id_sugerencia === idEnVista);
        if(s) s.estado = 'revisada';

        UIAlert.toast('Sugerencia marcada como revisada', 'success');
        renderTabla();
        modalVista.classList.remove('show');
        idEnVista = null;

    } catch(error){
        console.error('Error al marcar como revisada:', error);
        UIAlert.toast('Error al actualizar la sugerencia', 'error');
    }
});

cerrarVista.addEventListener('click', () => {
    modalVista.classList.remove('show');
    idEnVista = null;
});

window.addEventListener('click', (e) => {
    if(e.target === modalVista){
        modalVista.classList.remove('show');
        idEnVista = null;
    }
});

// ═════════════════════════════════════════════════════════════
//  ELIMINAR SUGERENCIA — usa UIAlert.delete de alerts.js
// ═════════════════════════════════════════════════════════════

async function eliminarSugerencia(asunto){
    const confirma = await UIAlert.delete('sugerencia', asunto);
    if(!confirma) return;

    try {
        const respuesta = await fetch(`/sugerencias/${idAEliminar}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if(!respuesta.ok) throw new Error(`Error ${respuesta.status}`);

        const resultado = await respuesta.json();
        if(!resultado.success) throw new Error(resultado.mensaje || 'Error desconocido');

        // Quitar del array local
        sugerencias = sugerencias.filter(s => s.id_sugerencia !== idAEliminar);
        idAEliminar = null;

        UIAlert.toast('Sugerencia eliminada correctamente', 'success');
        renderTabla();

    } catch(error){
        console.error('Error al eliminar:', error);
        UIAlert.toast('Error al eliminar la sugerencia', 'error');
        idAEliminar = null;
    }
}

// =========================
//  EVENTOS DE FILTROS
// =========================

inputBuscar.addEventListener('input', () => {
    busqueda     = inputBuscar.value;
    paginaActual = 1;
    renderTabla();
});

selectEstado.addEventListener('change', () => {
    filtroEstado = selectEstado.value;
    paginaActual = 1;
    renderTabla();
});


// =========================
//  INICIALIZAR
// =========================

window.addEventListener('DOMContentLoaded', () => {
    cargarSugerencias();
});

})();