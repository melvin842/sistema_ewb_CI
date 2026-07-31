// ════════════════════════════════════════════════════════════
//  noticias.js (página pública)
//  ✅ Maneja estados de carga, errores y filtros correctamente
// ════════════════════════════════════════════════════════════

const API = '';
const LOGO_DEFAULT = '../img/logo_ci.png';

let todasLasNoticias = [];
let filtroActivo     = 'todos';
let subfiltroActivo  = 'todos-avisos';

// =========================
//  ELEMENTOS DEL DOM
// =========================

const newsContainer = document.getElementById('newsContainer');
const newsCargando  = document.getElementById('newsCargando');
const newsEmpty     = document.getElementById('newsEmpty');
const newsError     = document.getElementById('newsError');
const modalNews     = document.getElementById('modalNews');

// =========================
//  SETUP FILTROS (antes de cargar datos)
// =========================

function setupFiltros(){
    // Botones de filtro principal
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filtroActivo = btn.dataset.filter;

            const subfilters = document.getElementById('subfilters');
            if(filtroActivo === 'avisos'){
                subfilters.classList.add('show');
            } else {
                subfilters.classList.remove('show');
                subfiltroActivo = 'todos-avisos';
                document.querySelectorAll('.subfilter-btn').forEach(b => b.classList.remove('active'));
                const todosBtn = document.querySelector('[data-sub="todos-avisos"]');
                if(todosBtn) todosBtn.classList.add('active');
            }

            renderizarCards();
        });
    });

    // Sub-filtros
    document.querySelectorAll('.subfilter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.subfilter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            subfiltroActivo = btn.dataset.sub;
            renderizarCards();
        });
    });
}

// =========================
//  CARGAR NOTICIAS DESDE BD
// =========================

async function cargarNoticias(){
    try {
        // Muestra estado de carga (misma rueda que Productos y Recursos Humanos)
        if(newsCargando) newsCargando.style.display = 'none';
        if(newsEmpty) newsEmpty.style.display = 'none';
        if(newsError) newsError.style.display = 'none';

        if(newsContainer){
            newsContainer.style.display = 'flex';
            newsContainer.innerHTML = `
                <div class="cargando">
                    <span class="material-symbols-outlined spin">refresh</span>
                    <p>Cargando noticias...</p>
                </div>
            `;
        }

        const res = await fetch(`${API}/noticias`, { method: 'GET' });
        
        if(!res.ok) throw new Error(`Error ${res.status}`);

        const datos = await res.json();

        // Filtra solo noticias activas (publicadas)
        todasLasNoticias = datos
            .filter(n => n.estado === 'activo')
            .map(n => {
                // Construye el array de imágenes:
                // imagen principal primero, luego galería
                const imgs = [];

                if(n.imagen){
    imgs.push(n.imagen);                                  // ya es la URL completa
}

                if(Array.isArray(n.galeria)){
                    n.galeria.forEach(item => {
                    const rutaImg = item.imagen || item;
                    if(rutaImg){
                    imgs.push(rutaImg);                            // ya es la URL completa
                }
            });
        }

                if(imgs.length === 0) imgs.push(LOGO_DEFAULT);

                return {
                    id:        n.id_noticia,
                    tipo:      n.tipo,
                    titulo:    n.titulo,
                    categoria: n.categoria,
                    fecha:     n.fecha_publicacion
                        ? new Date(n.fecha_publicacion).toLocaleDateString('es-MX', {
                            day:   '2-digit',
                            month: 'long',
                            year:  'numeric'
                          })
                        : '---',
                    contenido: n.contenido,
                    img:       imgs[0],
                    imgs:      imgs
                };
            });

        // Ordena por fecha descendente
        todasLasNoticias.sort((a, b) => {
            const fechaA = new Date(b.fecha);
            const fechaB = new Date(a.fecha);
            return fechaA - fechaB;
        });

        console.log('✅ Noticias cargadas:', todasLasNoticias.length);

        // Oculta carga, muestra contenido
        if(newsCargando) newsCargando.style.display = 'none';
        if(newsError) newsError.style.display = 'none';

        if(newsContainer) newsContainer.style.display = 'grid';

        renderizarCards();
        setupModal();

    } catch(error){
        console.error('❌ Error cargando noticias:', error);

        // Misma pantalla de "sin conexión" que Productos y RH
        if(newsCargando) newsCargando.style.display = 'none';
        if(newsEmpty) newsEmpty.style.display = 'none';
        if(newsError) newsError.style.display = 'none';

        if(newsContainer){
            newsContainer.style.display = 'flex';
            newsContainer.innerHTML = `
                <div class="offline-state">
                    <div class="offline-icon">
                        <span class="material-symbols-outlined">wifi_off</span>
                    </div>
                    <h3>Sin conexión con el servidor</h3>
                    <p>No pudimos cargar las noticias y avisos. Verifica tu conexión e inténtalo de nuevo.</p>
                    <button class="offline-retry" onclick="cargarNoticias()">
                        <span class="material-symbols-outlined">refresh</span>
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
}

// =========================
//  RENDERIZAR CARDS
// =========================

function renderizarCards(){
    if(!newsContainer) return;

    newsContainer.innerHTML = '';

    const tiposAvisos = ['aviso', 'comunicado', 'alerta'];
    let visibles = 0;

    todasLasNoticias.forEach(n => {
        let mostrar = false;

        if(filtroActivo === 'todos'){
            mostrar = true;
        } else if(filtroActivo === 'noticia'){
            mostrar = n.tipo === 'noticia';
        } else if(filtroActivo === 'avisos'){
            mostrar = subfiltroActivo === 'todos-avisos'
                ? tiposAvisos.includes(n.tipo)
                : n.tipo === subfiltroActivo;
        }

        if(!mostrar) return;
        visibles++;

        const card = document.createElement('div');
        card.className = 'news-card';

        // Guarda datos de la noticia en atributos
        card.dataset.tipo      = n.tipo;
        card.dataset.titulo    = n.titulo;
        card.dataset.categoria = n.categoria;
        card.dataset.fecha     = n.fecha;
        card.dataset.contenido = n.contenido;
        card.dataset.img       = n.img;
        card.dataset.imgs      = JSON.stringify(n.imgs);

        let badgeHTML = '';
        if(n.tipo !== 'noticia'){
            badgeHTML = `<span class="news-badge badge-${n.tipo}">
                ${n.tipo.charAt(0).toUpperCase() + n.tipo.slice(1)}
            </span>`;
        }

        const extracto = n.contenido.length > 100 
            ? n.contenido.substring(0, 100) + '...' 
            : n.contenido;

        card.innerHTML = `
            <img src="${n.img}" alt="${n.titulo}"
                 onerror="this.src='${LOGO_DEFAULT}'">
            <div class="news-card-info">
                ${badgeHTML}
                <span class="news-card-date">${n.fecha}</span>
                <h3>${n.titulo}</h3>
                <p>${extracto}</p>
                <a href="#" class="news-more">Leer más</a>
            </div>
        `;

        newsContainer.appendChild(card);
    });

    // Muestra/oculta estados
    if(newsContainer) newsContainer.style.display = visibles > 0 ? 'grid' : 'none';
    if(newsEmpty) newsEmpty.style.display = visibles === 0 ? 'block' : 'none';
}

// =========================
//  MODAL
// =========================

function setupModal(){
    const closeModalNews = document.querySelector('.close-modal-news');

    let imagenes  = [];
    let indiceImg = 0;

    function mostrarImagen(i){
        const imgEl  = document.getElementById('newsModalImg');
        const prevBtn = document.getElementById('modalImgPrev');
        const nextBtn = document.getElementById('modalImgNext');

        indiceImg = i;
        imgEl.src = imagenes[i] || LOGO_DEFAULT;
        imgEl.onerror = () => { imgEl.src = LOGO_DEFAULT; };

        // Muestra flechas solo si hay más de una imagen
        const mostrarFlechas = imagenes.length > 1;
        if(prevBtn) prevBtn.style.display = mostrarFlechas ? 'flex' : 'none';
        if(nextBtn) nextBtn.style.display = mostrarFlechas ? 'flex' : 'none';
    }

    const prevBtn = document.getElementById('modalImgPrev');
    const nextBtn = document.getElementById('modalImgNext');

    if(prevBtn){
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            indiceImg = (indiceImg - 1 + imagenes.length) % imagenes.length;
            mostrarImagen(indiceImg);
        });
    }

    if(nextBtn){
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            indiceImg = (indiceImg + 1) % imagenes.length;
            mostrarImagen(indiceImg);
        });
    }

    function abrirModal(card){
        // Parsea el JSON de imágenes
        try {
            imagenes = JSON.parse(card.dataset.imgs || '[]');
        } catch(e) {
            console.error('Error parsing images:', e);
            imagenes = [card.dataset.img || LOGO_DEFAULT];
        }

        if(imagenes.length === 0) imagenes = [LOGO_DEFAULT];
        indiceImg = 0;
        mostrarImagen(0);

        // Rellena datos del modal
        const titleEl = document.getElementById('newsModalTitulo');
        const dateEl = document.getElementById('newsModalFecha');
        const catEl = document.getElementById('newsModalCategoria');
        const contentEl = document.getElementById('newsModalContenido');

        if(titleEl) titleEl.textContent = card.dataset.titulo || '';
        if(dateEl) dateEl.textContent = card.dataset.fecha || '';
        if(catEl) catEl.textContent = card.dataset.categoria || '';
        if(contentEl) contentEl.textContent = card.dataset.contenido || '';

        // Badge
        const tipo    = card.dataset.tipo || '';
        const badgeEl = document.getElementById('newsModalBadge');
        if(badgeEl){
            badgeEl.className = 'news-badge-modal';

            const badgeClases = {
                aviso:      'badge-aviso',
                comunicado: 'badge-comunicado',
                alerta:     'badge-alerta'
            };

            if(badgeClases[tipo]){
                badgeEl.classList.add(badgeClases[tipo]);
                badgeEl.textContent = tipo.charAt(0).toUpperCase() + tipo.slice(1);
                badgeEl.style.display = 'inline-block';
            } else {
                badgeEl.style.display = 'none';
            }
        }

        // Scroll modal al inicio
        const modalContent = document.querySelector('.modal-news-content');
        if(modalContent) modalContent.scrollTop = 0;

        if(modalNews){
            modalNews.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    function cerrarModal(){
        if(modalNews){
            modalNews.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    // Delegación de eventos — funciona aunque las cards se regeneren
    document.addEventListener('click', (e) => {
        if(e.target.classList.contains('news-more')){
            e.preventDefault();
            e.stopPropagation();
            abrirModal(e.target.closest('.news-card'));
        }
    });

    if(closeModalNews) closeModalNews.addEventListener('click', cerrarModal);
    if(modalNews) window.addEventListener('click', e => {
        if(e.target === modalNews) cerrarModal();
    });
}

// =========================
//  INICIO
// =========================

document.addEventListener('DOMContentLoaded', () => {
    // Primero setup de filtros (funciona incluso sin datos)
    setupFiltros();
    
    // Luego carga de datos
    cargarNoticias();
});