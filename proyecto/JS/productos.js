// ════════════════════════════════════════════════════════════
//  productos-publico
// ════════════════════════════════════════════════════════════

const API = '';

const LOGO_DEFAULT = '../img/logo_ci.png';

// =========================
//  ELEMENTOS DEL MODAL
// =========================

const modal        = document.getElementById('productModal');
const modalTitle   = document.getElementById('modalTitle');
const modalDesc    = document.getElementById('modalDescription');
const modalImage   = document.getElementById('modalImage');
const imageCaption = document.getElementById('imageCaption');
const thumbnails   = document.getElementById('thumbnails');
const closeModal   = document.querySelector('.close-modal');
const prevBtn      = document.querySelector('.prev');
const nextBtn      = document.querySelector('.next');

let currentImages   = [];
let currentCaptions = [];
let currentIndex    = 0;
let autoplay;

// =========================
//  CARGAR PRODUCTOS DESDE BACKEND
// =========================

async function cargarProductos(){

    const contenedor = document.getElementById('productContainer');

    contenedor.innerHTML = `
        <div class="cargando">
            <span class="material-symbols-outlined spin">refresh</span>
            <p>Cargando productos...</p>
        </div>
    `;

    try {

        const respuesta = await fetch(`${API}/productos`);

        if(!respuesta.ok) throw new Error('Error al obtener productos');

        const productos = await respuesta.json();

        // Solo muestra los activos en la página pública
        const activos = productos.filter(p => p.estado === 'activo');

       if(activos.length === 0){
            contenedor.innerHTML = `
                <div class="sin-productos">
                    <span class="material-symbols-outlined">inventory_2</span>
                    <h3>Sin productos disponibles</h3>
                    <p>En este momento no contamos con productos activos en el catálogo. Vuelve a consultarnos pronto.</p>
                </div>
            `;
            return;
        }

        contenedor.innerHTML = '';

        for(const p of activos){

            // ════════════════════════════════════════════
            //  Carga la galería de cada producto para
            //  tener las imágenes y descripciones del modal
            // ════════════════════════════════════════════

            let galeria = [];

            try {
                const resDetalle = await fetch(`${API}/productos/${p.id_producto}`);
                if(resDetalle.ok){
                    const detalle = await resDetalle.json();
                    galeria = detalle.galeria || [];
                }
            } catch(e){
                console.warn(`No se pudo cargar galería del producto ${p.id_producto}`);
            }

            const card = crearCard(p, galeria);
            contenedor.appendChild(card);
        }

    } catch(error){

    console.error('Error cargando productos:', error);

    contenedor.innerHTML = `
        <div class="offline-state">
            <div class="offline-icon">
                <span class="material-symbols-outlined">wifi_off</span>
            </div>
            <h3>Sin conexión con el servidor</h3>
            <p>No pudimos cargar el catálogo de productos. Verifica tu conexión e inténtalo de nuevo.</p>
            <button class="offline-retry" onclick="cargarProductos()">
                <span class="material-symbols-outlined">refresh</span>
                Reintentar
            </button>
        </div>
    `;
    }
}

// =========================
//  CREAR CARD DE PRODUCTO
// =========================

function crearCard(p, galeria){

    const imgSrc = p.imagen
        ? p.imagen                                  // ya es la URL completa de Cloudinary
        : LOGO_DEFAULT;

    const todasImgs     = [];
    const todasCaptions = [];

    todasImgs.push(imgSrc);
    todasCaptions.push(p.nombre);

    galeria.forEach(item => {
        todasImgs.push(item.imagen);               
        todasCaptions.push(item.descripcion || 'Imagen del producto');
    });

    galeria.forEach(item => {
        todasImgs.push(`${API}/img/productos/${item.imagen}`);
        todasCaptions.push(item.descripcion || 'Imagen del producto');
    });

    const card = document.createElement('div');
    card.className = 'product-card';

    card.innerHTML = `
        <img src="${imgSrc}"
             alt="${p.nombre}"
             onerror="this.src='${LOGO_DEFAULT}'">

        <div class="product-info">

            <span class="tipo">${p.tipo || ''}</span>

            <h3>${p.nombre}</h3>

           <p>${p.descripcion_corta || p.descripcion || ''}</p>

            <a href="#" class="more-info">Más información</a>

        </div>
    `;


    card.querySelector('.more-info').addEventListener('click', (e) => {
        e.preventDefault();
        abrirModal(p, todasImgs, todasCaptions);
    });

    return card;
}

// =========================
//  ABRIR MODAL
// =========================

function abrirModal(p, imgs, captions){

    modalTitle.textContent = p.nombre;

    modalDesc.innerHTML = p.descripcion
        ? `<p>${p.descripcion}</p>`
        : '';

    currentImages   = imgs;
    currentCaptions = captions;
    currentIndex    = 0;

    actualizarSlider();
    crearMiniaturas();

    modal.classList.add('show');
    document.body.classList.add('modal-open');

    iniciarAutoplay();
}

// =========================
//  SLIDER
// =========================

function actualizarSlider(){

    modalImage.src           = currentImages[currentIndex]   || LOGO_DEFAULT;
    imageCaption.textContent = currentCaptions[currentIndex] || '';

    modalImage.onerror = () => { modalImage.src = LOGO_DEFAULT; };

    actualizarMiniaturas();
}

function crearMiniaturas(){

    thumbnails.innerHTML = '';

    if(currentImages.length <= 1){
        thumbnails.style.display = 'none';
        prevBtn.style.display    = 'none';
        nextBtn.style.display    = 'none';
        return;
    }

    thumbnails.style.display = 'flex';
    prevBtn.style.display    = 'flex';
    nextBtn.style.display    = 'flex';

    currentImages.forEach((img, index) => {

        const thumb = document.createElement('img');
        thumb.src   = img;
        thumb.onerror = () => { thumb.src = LOGO_DEFAULT; };

        if(index === currentIndex) thumb.classList.add('active-thumb');

        thumb.addEventListener('click', () => {
            currentIndex = index;
            actualizarSlider();
        });

        thumbnails.appendChild(thumb);
    });
}

function actualizarMiniaturas(){

    thumbnails.querySelectorAll('img').forEach((thumb, i) => {
        thumb.classList.toggle('active-thumb', i === currentIndex);
    });
}

// =========================
//  FLECHAS
// =========================

nextBtn.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % currentImages.length;
    actualizarSlider();
    reiniciarAutoplay();
});

prevBtn.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
    actualizarSlider();
    reiniciarAutoplay();
});

// =========================
//  AUTOPLAY
// =========================

function iniciarAutoplay(){
    clearInterval(autoplay);
    if(currentImages.length <= 1) return;
    autoplay = setInterval(() => {
        currentIndex = (currentIndex + 1) % currentImages.length;
        actualizarSlider();
    }, 4000);
}

function reiniciarAutoplay(){
    clearInterval(autoplay);
    iniciarAutoplay();
}

// =========================
//  CERRAR MODAL
// =========================

closeModal.addEventListener('click', cerrarModal);

window.addEventListener('click', (e) => {
    if(e.target === modal) cerrarModal();
});

function cerrarModal(){
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
    clearInterval(autoplay);
}

// =========================
//  INICIO
// =========================

cargarProductos();