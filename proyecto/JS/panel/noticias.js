// ════════════════════════════════════════════════════════════
//  noticias.js (panel administrativo)
//  Carga noticias desde la BD y las muestra en grid
// ════════════════════════════════════════════════════════════

const API = '';

let noticias = [];

const CARDS_POR_PAGE = 6;
let busqueda     = "";
let filtroTipo   = "todos";
let filtroEstado = "todos";
let paginaActual = 1;

// =========================
//  ELEMENTOS
// =========================

const newsGrid     = document.getElementById('newsGrid');
const emptyState   = document.getElementById('emptyState');
const paginacion   = document.getElementById('paginacion');
const inputBuscar  = document.getElementById('buscarNoticia');
const selectTipo   = document.getElementById('filtroTipo');
const selectEstado = document.getElementById('filtroEstado');

// =========================
//  CARGAR NOTICIAS DESDE BD
// =========================

async function cargarNoticias(){
    try {
        const res = await fetch(`${API}/noticias`, {
            credentials: 'include'
        });
        if(!res.ok) throw new Error('Error al obtener noticias');

        const datos = await res.json();

        noticias = datos.map(n => ({
            id:        n.id_noticia,
            tipo:      n.tipo,
            titulo:    n.titulo,
            categoria: n.categoria,
            extracto:  n.contenido.length > 100
                           ? n.contenido.substring(0, 100) + '...'
                           : n.contenido,
            fecha:     n.fecha_publicacion
                           ? new Date(n.fecha_publicacion).toLocaleDateString('es-MX')
                           : '---',
            estado:    n.estado,
            img:       n.imagen
                           ? `${API}/img/noticias/${n.imagen}`
                           : '../../img/logo_ci.png'
        }));

        renderCards();

    } catch(error){
        console.error('Error cargando noticias:', error);
        if(typeof UIAlert !== 'undefined'){
            UIAlert.toast('Error al cargar las noticias.', 'error');
        }
    }
}

// =========================
//  ESTADÍSTICAS
// =========================

function actualizarStats(){
    document.getElementById('statTotal').textContent      = noticias.length;
    document.getElementById('statPublicadas').textContent = noticias.filter(n => n.estado === 'activo').length;
    document.getElementById('statOcultas').textContent    = noticias.filter(n => n.estado === 'oculta' || n.estado === 'inactivo').length;
    document.getElementById('statAlertas').textContent    = noticias.filter(n => n.tipo   === 'alerta').length;
}

// =========================
//  FILTRADO
// =========================

function obtenerFiltrados(){
    return noticias.filter(n => {
        const coincideTexto  = n.titulo.toLowerCase().includes(busqueda.toLowerCase());
        const coincideTipo   = filtroTipo   === 'todos' || n.tipo   === filtroTipo;
        // ✅ El estado en BD es 'activo' u 'oculta'
        const coincideEstado = filtroEstado === 'todos' || 
                              (filtroEstado === 'activo'  && n.estado === 'activo') ||
                              (filtroEstado === 'inactivo' && (n.estado === 'oculta' || n.estado === 'inactivo'));
        return coincideTexto && coincideTipo && coincideEstado;
    });
}

// =========================
//  RENDER CARDS
// =========================

function renderCards(){
    const datos = obtenerFiltrados();
    const totalPaginas = Math.max(1, Math.ceil(datos.length / CARDS_POR_PAGE));
    if(paginaActual > totalPaginas) paginaActual = totalPaginas;

    const inicio   = (paginaActual - 1) * CARDS_POR_PAGE;
    const visibles = datos.slice(inicio, inicio + CARDS_POR_PAGE);

    newsGrid.innerHTML = '';

    if(visibles.length === 0){
        emptyState.style.display = 'block';
        newsGrid.style.display   = 'none';
    } else {
        emptyState.style.display = 'none';
        newsGrid.style.display   = 'grid';
    }

    const badgeTextos = {
        noticia:    'Noticia',
        aviso:      'Aviso',
        comunicado: 'Comunicado',
        alerta:     'Alerta'
    };

    visibles.forEach(n => {

        // ✅ Estado en BD es 'activo' u 'oculta'
        const estadoTexto = n.estado === 'activo' ? 'Publicada' : 'Oculta';
        const estadoClase = n.estado === 'activo' ? 'publicada' : 'oculta';

        const card = document.createElement('div');
        card.className = 'news-card-admin';

        card.innerHTML = `
            <div class="card-img">
                <img src="${n.img}" alt="${n.titulo}"
                     onerror="this.src='../../img/logo_ci.png'">
                <span class="card-badge badge-${n.tipo}">${badgeTextos[n.tipo] || n.tipo}</span>
                <span class="card-estado ${estadoClase}">${estadoTexto}</span>
            </div>

            <div class="card-body">
                <span class="card-date">${n.fecha}</span>
                <h3 class="card-titulo">${n.titulo}</h3>
                <p class="card-extracto">${n.extracto}</p>
            </div>

            <div class="card-acciones">
                <a href="editar noticia.html?id=${n.id}" class="btn-editar">
                    <span class="material-symbols-outlined">edit</span>
                    Editar
                </a>
                <button class="btn-eliminar" data-id="${n.id}" data-titulo="${n.titulo}">
                    <span class="material-symbols-outlined">delete</span>
                    Eliminar
                </button>
            </div>
        `;

        newsGrid.appendChild(card);
    });

    renderPaginacion(totalPaginas);
    actualizarStats();

    // ✅ Asignar eventos a botones de eliminar
    asignarEventosEliminar();
}

// =========================
//  EVENTOS DE ELIMINACIÓN
// =========================

function asignarEventosEliminar(){
    newsGrid.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const id = Number(btn.dataset.id);
            const titulo = btn.dataset.titulo;
            
            console.log('Eliminar noticia:', { id, titulo });
            
            // ✅ Usar UIAlert.delete() — Modal consistente
            const confirma = await UIAlert.delete('noticia', titulo);
            
            if(!confirma) {
                console.log('Eliminación cancelada');
                return;
            }
            
            // El usuario confirmó, proceder a eliminar
            try {
                const res = await fetch(`${API}/noticias/${id}`, { 
                    method: 'DELETE' 
                });
                
                if(!res.ok){
                    const error = await res.json();
                    throw new Error(error.mensaje || 'Error al eliminar');
                }
                
                // Eliminar de la lista local
                noticias = noticias.filter(n => n.id !== id);
                paginaActual = 1;
                renderCards();
                
                console.log('Noticia eliminada correctamente');
                
                // ✅ Toast de confirmación
                UIAlert.toast(`Noticia "${titulo}" eliminada correctamente.`, 'success');
                
            } catch(error){
                console.error('Error al eliminar:', error);
                UIAlert.toast(error.message || 'Error al eliminar la noticia.', 'error');
            }
        });
    });
}

// =========================
//  PAGINACIÓN
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
            renderCards();
            newsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        return btn;
    };

    paginacion.appendChild(crearBtn('‹', paginaActual - 1, false, paginaActual === 1));

    let ini = Math.max(1, paginaActual - 2);
    let fin = Math.min(totalPaginas, ini + 4);
    ini     = Math.max(1, fin - 4);

    for(let i = ini; i <= fin; i++){
        paginacion.appendChild(crearBtn(i, i, i === paginaActual));
    }

    paginacion.appendChild(crearBtn('›', paginaActual + 1, false, paginaActual === totalPaginas));
}

// =========================
//  EVENTOS FILTROS
// =========================

inputBuscar.addEventListener('input', () => {
    busqueda     = inputBuscar.value;
    paginaActual = 1;
    renderCards();
});

selectTipo.addEventListener('change', () => {
    filtroTipo   = selectTipo.value;
    paginaActual = 1;
    renderCards();
});

selectEstado.addEventListener('change', () => {
    filtroEstado = selectEstado.value;
    paginaActual = 1;
    renderCards();
});

// =========================
//  INICIO
// =========================

console.log('Script cargado. Iniciando carga de noticias...');
cargarNoticias();