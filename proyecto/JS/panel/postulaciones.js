// ════════════════════════════════════════════════════════════
//  postulaciones.js  —  Panel Administrativo
// ════════════════════════════════════════════════════════════

const API = '';

let postulaciones = [];
let vacantesMap   = {};
let busqueda      = '';
let filtroEstado  = 'todos';
let filtroVacante = 'todas';
let paginaActual  = 1;

const FILAS_POR_PAGINA = 8;

const tabla          = document.getElementById('tablaPostulaciones');
const emptyState     = document.getElementById('emptyState');
const paginacion     = document.getElementById('paginacion');
const inputBuscar    = document.getElementById('buscarPost');
const selEstado      = document.getElementById('filtroEstado');
const selVacante     = document.getElementById('filtroVacante');
const modalVer       = document.getElementById('modalVer');
const cerrarVer      = document.getElementById('cerrarVer');

const ESTADOS = {
    pendiente: { texto: 'Pendiente', clase: 'badge-pendiente' },
    revisado:  { texto: 'Revisado',  clase: 'badge-revisado'  },
    aceptado:  { texto: 'Aceptado',  clase: 'badge-aceptado'  },
    rechazado: { texto: 'Rechazado', clase: 'badge-rechazado' }
};

// ════════════════════════════════════════════════════════════
//  DESCARGA DE CV
// ════════════════════════════════════════════════════════════

function descargarCV(archivo, nombrePostulante){
    if(!archivo){
        UIAlert.toast('No hay CV disponible para esta postulación.', 'warning');
        return;
    }
    const link    = document.createElement('a');
    link.href     = `${API}/cvs/${encodeURIComponent(archivo)}`;
    link.download = `CV_${(nombrePostulante || 'postulante').replace(/\s+/g, '_')}.pdf`;
    link.target   = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ════════════════════════════════════════════════════════════
//  CARGA DE DATOS
// ════════════════════════════════════════════════════════════

async function cargarDatos(){
    try {
        const resV = await fetch(`${API}/recursos-humanos`);
        if(resV.ok){
            const vacantes = await resV.json();
            vacantes.forEach(v => { vacantesMap[v.id_rh] = v.titulo; });
            llenarFiltroVacante(vacantes);
        }
        const resP = await fetch(`${API}/postulaciones`, {
            credentials: 'include'
        });
        if(!resP.ok) throw new Error('Error al obtener postulaciones');
        postulaciones = await resP.json();
        renderTabla();
    } catch(error){
        console.error(error);
        UIAlert.toast('Error al cargar postulaciones.', 'error');
    }
}

function llenarFiltroVacante(vacantes){
    const sel = document.getElementById('filtroVacante');
    vacantes.forEach(v => {
        const opt = document.createElement('option');
        opt.value       = v.id_rh;
        opt.textContent = v.titulo;
        sel.appendChild(opt);
    });
}

// ════════════════════════════════════════════════════════════
//  STATS
// ════════════════════════════════════════════════════════════

function actualizarStats(){
    document.getElementById('statTotal').textContent      = postulaciones.length;
    document.getElementById('statPendientes').textContent = postulaciones.filter(p => p.estado === 'pendiente').length;
    document.getElementById('statRevisados').textContent  = postulaciones.filter(p => p.estado === 'revisado').length;
    document.getElementById('statAceptados').textContent  = postulaciones.filter(p => p.estado === 'aceptado').length;
    document.getElementById('statRechazados').textContent = postulaciones.filter(p => p.estado === 'rechazado').length;
}

// ════════════════════════════════════════════════════════════
//  FILTRADO
// ════════════════════════════════════════════════════════════

function obtenerFiltrados(){
    return postulaciones.filter(p => {
        const vacanteTitulo = (vacantesMap[p.id_rh] || '').toLowerCase();
        const coincideBusq  = p.nombre.toLowerCase().includes(busqueda.toLowerCase())
                        || vacanteTitulo.includes(busqueda.toLowerCase());
        const coincideEst   = filtroEstado  === 'todos'  || p.estado  === filtroEstado;
        const coincideVac   = filtroVacante === 'todas'  || String(p.id_rh) === filtroVacante;
        return coincideBusq && coincideEst && coincideVac;
    });
}

// ════════════════════════════════════════════════════════════
//  RENDER TABLA — botones: Ver y Eliminar
// ════════════════════════════════════════════════════════════

function renderTabla(){
    const datos = obtenerFiltrados();
    const totalPaginas = Math.max(1, Math.ceil(datos.length / FILAS_POR_PAGINA));
    if(paginaActual > totalPaginas) paginaActual = totalPaginas;

    const inicio   = (paginaActual - 1) * FILAS_POR_PAGINA;
    const visibles = datos.slice(inicio, inicio + FILAS_POR_PAGINA);

    tabla.innerHTML = '';
    emptyState.style.display = visibles.length === 0 ? 'block' : 'none';

    visibles.forEach(p => {
        const est     = ESTADOS[p.estado] || ESTADOS.pendiente;
        const vacante = vacantesMap[p.id_rh] || `Vacante #${p.id_rh}`;
        const fecha   = p.fecha_postulacion
            ? new Date(p.fecha_postulacion).toLocaleDateString('es-MX')
            : '---';

        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${p.id_postulacion}</td>
            <td><strong>${p.nombre}</strong></td>
            <td>${p.correo}</td>
            <td>${p.telefono || '—'}</td>
            <td>${vacante}</td>
            <td><span class="badge-estado ${est.clase}">${est.texto}</span></td>
            <td>${fecha}</td>
            <td class="acciones">
                <button class="ver" title="Ver detalle" data-id="${p.id_postulacion}">
                    <span class="material-symbols-outlined">visibility</span>
                </button>
                <button class="eliminar" title="Eliminar" data-id="${p.id_postulacion}" data-nombre="${p.nombre}">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </td>
        `;
        tabla.appendChild(fila);
    });

    renderPaginacion(totalPaginas);
    actualizarStats();

    // ✅ Asignar eventos a botones
    asignarEventosTabla();
}

function asignarEventosTabla(){
    // Botones Ver
    tabla.querySelectorAll('.ver').forEach(btn => {
        btn.addEventListener('click', () => abrirVer(Number(btn.dataset.id)));
    });

    // ✅ Botones Eliminar — Ahora usan UIAlert.delete()
    tabla.querySelectorAll('.eliminar').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const id = Number(btn.dataset.id);
            const nombre = btn.dataset.nombre;

            console.log('Eliminar postulación:', { id, nombre });

            // ✅ Usar UIAlert.delete() — Modal consistente
            const confirma = await UIAlert.delete('postulación', nombre);

            if(!confirma) {
                console.log('Eliminación cancelada');
                return;
            }

            // El usuario confirmó, proceder a eliminar
            try {
                const res = await fetch(`${API}/postulaciones/${id}`, { 
    method: 'DELETE',
    credentials: 'include'
});

                if(!res.ok){
                    const error = await res.json();
                    throw new Error(error.mensaje || 'Error al eliminar');
                }

                // Eliminar de la lista local
                postulaciones = postulaciones.filter(p => p.id_postulacion !== id);
                paginaActual = 1;
                renderTabla();

                console.log('Postulación eliminada correctamente');

                // ✅ Toast de confirmación
                UIAlert.toast(`Postulación de "${nombre}" eliminada correctamente.`, 'success');

            } catch(error){
                console.error('Error al eliminar:', error);
                UIAlert.toast(error.message || 'Error al eliminar la postulación.', 'error');
            }
        });
    });
}

// ════════════════════════════════════════════════════════════
//  PAGINACIÓN
// ════════════════════════════════════════════════════════════

function renderPaginacion(totalPaginas){
    paginacion.innerHTML = '';
    if(totalPaginas <= 1) return;

    const crearBtn = (texto, pagina, activo = false, disabled = false) => {
        const btn = document.createElement('button');
        btn.textContent = texto;
        if(activo)   btn.classList.add('active');
        if(disabled) btn.disabled = true;
        btn.addEventListener('click', () => {
            paginaActual = pagina;
            renderTabla();
            tabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        return btn;
    };

    paginacion.appendChild(crearBtn('‹', paginaActual - 1, false, paginaActual === 1));
    let ini = Math.max(1, paginaActual - 2);
    let fin = Math.min(totalPaginas, ini + 4);
    ini     = Math.max(1, fin - 4);
    for(let i = ini; i <= fin; i++) paginacion.appendChild(crearBtn(i, i, i === paginaActual));
    paginacion.appendChild(crearBtn('›', paginaActual + 1, false, paginaActual === totalPaginas));
}

// ════════════════════════════════════════════════════════════
//  MODAL VER DETALLE
// ════════════════════════════════════════════════════════════

function abrirVer(id){
    const p = postulaciones.find(x => x.id_postulacion === id);
    if(!p) return;

    const est     = ESTADOS[p.estado] || ESTADOS.pendiente;
    const vacante = vacantesMap[p.id_rh] || `Vacante #${p.id_rh}`;
    const fecha   = p.fecha_postulacion
        ? new Date(p.fecha_postulacion).toLocaleString('es-MX')
        : '---';

    document.getElementById('verNombre').textContent   = p.nombre;
    document.getElementById('verVacante').textContent  = vacante;
    document.getElementById('verCorreo').textContent   = p.correo;
    document.getElementById('verTelefono').textContent = p.telefono || 'No proporcionado';
    document.getElementById('verFecha').textContent    = fecha;

    const estadoEl = document.getElementById('verEstado');
    estadoEl.textContent = est.texto;
    estadoEl.className   = `badge-estado ${est.clase}`;

    // ✅ Botón de descarga — solo en el modal, con onclick para evitar navegación
    const cvBtn = document.getElementById('verCV');
    if(p.cv){
        cvBtn.style.display = 'inline-flex';
        cvBtn.onclick = (e) => {
            e.preventDefault();
            descargarCV(p.cv, p.nombre);
        };
    } else {
        cvBtn.style.display = 'none';
    }

    // Chips de estado
    const chips = document.getElementById('estadoChips');
    chips.innerHTML = '';
    Object.entries(ESTADOS).forEach(([val, info]) => {
        const chip = document.createElement('button');
        chip.className      = `chip-estado ${val === p.estado ? 'chip-activo' : ''}`;
        chip.textContent    = info.texto;
        chip.dataset.estado = val;
        chip.addEventListener('click', () => cambiarEstado(id, val));
        chips.appendChild(chip);
    });

    const content = modalVer.querySelector('.modal-post-ver');
    if(content) content.scrollTop = 0;

    modalVer.classList.add('show');
}

async function cambiarEstado(id, nuevoEstado){
    try {
        const res = await fetch(`${API}/postulaciones/${id}/estado`, {
            method:  'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body:    JSON.stringify({ estado: nuevoEstado })
        });
        if(!res.ok) throw new Error();

        const p = postulaciones.find(x => x.id_postulacion === id);
        if(p) p.estado = nuevoEstado;

        const est = ESTADOS[nuevoEstado];
        document.getElementById('verEstado').textContent = est.texto;
        document.getElementById('verEstado').className   = `badge-estado ${est.clase}`;

        document.querySelectorAll('.chip-estado').forEach(c => {
            c.classList.toggle('chip-activo', c.dataset.estado === nuevoEstado);
        });

        renderTabla();
        UIAlert.toast(`Estado actualizado a "${est.texto}".`, 'success');
    } catch {
        UIAlert.toast('Error al actualizar el estado.', 'error');
    }
}

cerrarVer.addEventListener('click', () => modalVer.classList.remove('show'));
window.addEventListener('click', e => { if(e.target === modalVer) modalVer.classList.remove('show'); });

// ════════════════════════════════════════════════════════════
//  FILTROS
// ════════════════════════════════════════════════════════════

inputBuscar.addEventListener('input',  () => { busqueda = inputBuscar.value; paginaActual = 1; renderTabla(); });
selEstado.addEventListener('change',   () => { filtroEstado = selEstado.value; paginaActual = 1; renderTabla(); });
selVacante.addEventListener('change',  () => { filtroVacante = selVacante.value; paginaActual = 1; renderTabla(); });

// ════════════════════════════════════════════════════════════
//  INICIO
// ════════════════════════════════════════════════════════════

console.log('Script cargado. Iniciando carga de postulaciones...');
cargarDatos();