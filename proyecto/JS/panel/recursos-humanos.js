// =========================
//  CONFIG API
// =========================

const API = '';

let vacantes = [];

// =========================
//  ESTADO DE FILTROS / PAGINACION
// =========================

const FILAS_POR_PAGINA = 5;

let busqueda     = "";
let filtroEstado = "todas";
let paginaActual = 1;

// =========================
//  ELEMENTOS
// =========================

const tabla        = document.getElementById('tablaVacantes');
const emptyState   = document.getElementById('emptyState');
const paginacion   = document.getElementById('paginacion');
const inputBuscar  = document.getElementById('buscarVacante');
const selectEstado = document.getElementById('filtroEstado');

const modalVista  = document.getElementById('modalVista');
const cerrarVista = document.getElementById('cerrarVista');

// ✅ Verificación de elementos
console.log('Elementos cargados:', {
    tabla: !!tabla,
    inputBuscar: !!inputBuscar,
    selectEstado: !!selectEstado
});

// =========================
//  TEXTOS / CLASES POR ESTADO
// =========================

const ESTADOS = {
    disponible: { texto: "Disponible",       clase: "badge-activo" },
    cerrada:    { texto: "Cerrada",          clase: "badge-inactivo" },
    proxima:    { texto: "Próxima a Cerrar", clase: "badge-proximo" }
};

// =========================
//  CARGA DE DATOS
// =========================

async function cargarVacantes(){
    try {
        const res = await fetch(`${API}/recursos-humanos`, {
            credentials: 'include'
        });
        if(!res.ok) throw new Error('Error al obtener vacantes');

        const datos = await res.json();

    vacantes = datos.map(v => ({
            id:           v.id_rh,
            puesto:       v.titulo,
            img:          v.imagen || '../../img/logo_ci.png',    // ya es la URL completa de Cloudinary
            estado:       v.estado,
            registro:     v.fecha_publicacion
                ? new Date(v.fecha_publicacion).toLocaleDateString('es-MX')
                : '---',
            descripcion:  v.descripcion,
            requisitos:   v.requisitos
                ? v.requisitos.split(/\r?\n|,/).map(r => r.trim()).filter(Boolean)
                : [],
            horario:      v.horario,
            salario:      v.salario
        }));

        console.log('Vacantes cargadas:', vacantes.length);
        renderTabla();

    } catch(error){
        console.error('Error cargando vacantes:', error);
        if(typeof UIAlert !== 'undefined'){
            UIAlert.toast('Error al cargar las vacantes.', 'error');
        }
    }
}

// =========================
//  ACTUALIZAR ESTADÍSTICAS
// =========================

function actualizarStats(){
    const total     = vacantes.length;
    const activas   = vacantes.filter(v => v.estado === 'disponible').length;
    const inactivas = vacantes.filter(v => v.estado === 'cerrada').length;
    const proximas  = vacantes.filter(v => v.estado === 'proxima').length;

    const statTotal = document.getElementById('statTotal');
    const statActivas = document.getElementById('statActivas');
    const statInactivas = document.getElementById('statInactivas');
    const statProximas = document.getElementById('statProximas');

    if(statTotal) statTotal.textContent = total;
    if(statActivas) statActivas.textContent = activas;
    if(statInactivas) statInactivas.textContent = inactivas;
    if(statProximas) statProximas.textContent = proximas;
}

// =========================
//  FILTRADO
// =========================

function obtenerFiltrados(){
    let filtroABuscar = filtroEstado;
    if(filtroEstado === 'inactivo') filtroABuscar = 'cerrada';
    
    return vacantes.filter(v => {
        const coincideBusqueda = v.puesto.toLowerCase().includes(busqueda.toLowerCase());
        const coincideEstado = filtroABuscar === 'todas' || v.estado === filtroABuscar;
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
    
    if(emptyState) {
        emptyState.style.display = visibles.length === 0 ? 'block' : 'none';
    }

    visibles.forEach(v => {
        const estado = ESTADOS[v.estado] || ESTADOS.disponible;

        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${v.id}</td>
            <td>${v.puesto}</td>
            <td class="cell-img">
                <img src="${v.img}" alt="${v.puesto}"
                    onerror="this.src='../../img/logo_ci.png'">
            </td>
            <td><span class="badge-estado ${estado.clase}">${estado.texto}</span></td>
            <td>${v.registro}</td>
            <td class="acciones">
                <button class="ver" title="Ver" data-id="${v.id}">
                    <span class="material-symbols-outlined">visibility</span>
                </button>
                <a href="editar vacante.html?id=${v.id}" class="editar" title="Editar">
                    <span class="material-symbols-outlined">edit</span>
                </a>
                <button class="eliminar" title="Eliminar" data-id="${v.id}" data-nombre="${v.puesto}">
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
    // ✅ Botones de eliminar — Ahora usan UIAlert.delete()
    tabla.querySelectorAll('.eliminar').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const id = Number(btn.dataset.id);
            const nombre = btn.dataset.nombre;
            
            console.log('Eliminar vacante:', { id, nombre });
            
            // ✅ NUEVO: Usar UIAlert.delete() en lugar del modal HTML
            const confirma = await UIAlert.delete('vacante', nombre);
            
            if(!confirma) {
                console.log('Eliminación cancelada');
                return;
            }
            
            // El usuario confirmó, proceder a eliminar
            try {
                const res = await fetch(`${API}/recursos-humanos/${id}`, { 
                    method: 'DELETE' 
                });
                
                if(!res.ok){
                    const error = await res.json();
                    throw new Error(error.mensaje || 'Error al eliminar');
                }
                
                // Eliminar de la lista local
                vacantes = vacantes.filter(v => v.id !== id);
                paginaActual = 1;
                renderTabla();
                
                console.log('Vacante eliminada correctamente');
                
                // ✅ Toast de confirmación
                UIAlert.toast(`Vacante "${nombre}" eliminada correctamente.`, 'success');
                
            } catch(error){
                console.error('Error al eliminar:', error);
                UIAlert.toast(error.message || 'Error al eliminar la vacante.', 'error');
            }
        });
    });

    // Botones de ver
    tabla.querySelectorAll('.ver').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
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
        if(activo) btn.classList.add('active');
        if(deshabilitado) btn.disabled = true;

        btn.addEventListener('click', () => {
            paginaActual = pagina;
            renderTabla();
            tabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

// =========================
//  MODAL VISTA PREVIA
// =========================

function abrirVista(id){
    const v = vacantes.find(item => item.id === id);
    if(!v) return;

    const estado = ESTADOS[v.estado] || ESTADOS.disponible;
    const vistaImg = document.getElementById('vistaImg');
    const vistaTitulo = document.getElementById('vistaTitulo');
    const vistaDescripcion = document.getElementById('vistaDescripcion');
    const vistaHorario = document.getElementById('vistaHorario');
    const vistaSalario = document.getElementById('vistaSalario');
    const vistaEstado = document.getElementById('vistaEstado');
    const vistaRequisitos = document.getElementById('vistaRequisitos');

    if(vistaImg) {
        vistaImg.src = v.img;
        vistaImg.onerror = function(){ this.src = '../../img/logo_ci.png'; };
    }
    if(vistaTitulo) vistaTitulo.textContent = v.puesto;
    if(vistaDescripcion) vistaDescripcion.textContent = v.descripcion;
    if(vistaHorario) vistaHorario.textContent = v.horario || 'No especificado';
    if(vistaSalario) vistaSalario.textContent = v.salario || 'No especificado';

    if(vistaEstado) {
        vistaEstado.textContent = estado.texto;
        vistaEstado.className = `badge-estado ${estado.clase}`;
    }

    if(vistaRequisitos) {
        vistaRequisitos.innerHTML = '';
        if(v.requisitos.length > 0){
            v.requisitos.forEach(r => {
                const p = document.createElement('p');
                p.textContent = `• ${r}`;
                vistaRequisitos.appendChild(p);
            });
        } else {
            const p = document.createElement('p');
            p.textContent = 'No especificados';
            vistaRequisitos.appendChild(p);
        }
    }

    if(modalVista){
        const contenidoVista = modalVista.querySelector('.modal-content');
        if(contenidoVista) contenidoVista.scrollTop = 0;
        modalVista.classList.add('show');
    }
}

if(cerrarVista){
    cerrarVista.addEventListener('click', () => {
        if(modalVista) modalVista.classList.remove('show');
    });
}

window.addEventListener('click', (e) => {
    if(e.target === modalVista && modalVista){
        modalVista.classList.remove('show');
    }
});

// =========================
//  EVENTOS DE FILTROS
// =========================

if(inputBuscar){
    inputBuscar.addEventListener('input', () => {
        busqueda = inputBuscar.value;
        paginaActual = 1;
        renderTabla();
    });
}

if(selectEstado){
    selectEstado.addEventListener('change', () => {
        filtroEstado = selectEstado.value;
        paginaActual = 1;
        renderTabla();
    });
}



// =========================
//  INICIO
// =========================

console.log('Script cargado. Iniciando carga de vacantes...');
cargarVacantes();