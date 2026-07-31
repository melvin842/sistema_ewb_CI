// =========================
//  VALIDACIÓN DE IMÁGENES 
// =========================

const TIPOS_IMAGEN_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANO_IMAGEN_MAXIMO    = 5 * 1024 * 1024; // 5 MB

function validarImagen(file){
    if(!file) return 'Selecciona una imagen.';
    if(!TIPOS_IMAGEN_PERMITIDOS.includes(file.type)){
        return 'Solo se permiten imágenes JPG, PNG o WEBP.';
    }
    if(file.size > TAMANO_IMAGEN_MAXIMO){
        return 'La imagen no debe superar los 5 MB.';
    }
    return '';
}

function mostrarErrorImagen(msg){
    if(typeof UIAlert !== 'undefined'){
        UIAlert.toast(msg, 'error');
    } else {
        alert(msg);
    }
}

// =========================
//  MANEJO DE IMAGEN PRINCIPAL
// =========================

function initImagenPrincipal(boxId, inputId, onChange){

    const box   = document.getElementById(boxId);
    const input = document.getElementById(inputId);

    box.addEventListener('click', () => input.click());

    input.addEventListener('change', (e) => {

        const file = e.target.files[0];
        if(!file) return;

        const errorImg = validarImagen(file);
        if(errorImg){
            mostrarErrorImagen(errorImg);
            input.value = '';
            return;
        }

        const reader = new FileReader();

        reader.onload = (ev) => {

            let img = box.querySelector('img');
            const placeholder = box.querySelector('.placeholder');

            if(!img){
                img = document.createElement('img');
                box.appendChild(img);
            }

            img.src   = ev.target.result;
            img._file = file; 

            if(placeholder) placeholder.style.display = 'none';

            if(typeof onChange === 'function') onChange(ev.target.result);
        };

        reader.readAsDataURL(file);
    });
}

// =========================
//  MANEJO DE GALERIA DE MINIATURAS
// =========================

function initGaleriaExtra(galeriaId, inputId, maxImagenes = 5){

    const galeria = document.getElementById(galeriaId);
    const input   = document.getElementById(inputId);
    const trigger = galeria.querySelector('.agregar-imagenes');

    trigger.addEventListener('click', () => input.click());

    input.addEventListener('change', (e) => {

        const archivos = Array.from(e.target.files);
        const actuales = galeria.querySelectorAll('.galeria-item').length;

        if(archivos.length > (maxImagenes - actuales)){
            mostrarErrorImagen(`Solo puedes agregar hasta ${maxImagenes} imágenes en total.`);
        }

        archivos.slice(0, maxImagenes - actuales).forEach(file => {

            const errorImg = validarImagen(file);
            if(errorImg){
                mostrarErrorImagen(`${file.name}: ${errorImg}`);
                return;
            }

            const reader = new FileReader();

            reader.onload = (ev) => {

                const item     = document.createElement('div');
                item.className = 'galeria-item';


                const img  = document.createElement('img');
                img.src    = ev.target.result;
                img._file  = file; 

                const btnRemove     = document.createElement('button');
                btnRemove.type      = 'button';
                btnRemove.className = 'remove-img';
                btnRemove.innerHTML = '&times;';
                btnRemove.addEventListener('click', () => item.remove());

               
                const desc         = document.createElement('input');
                desc.type          = 'text';
                desc.className     = 'galeria-desc';
                desc.placeholder   = 'Ej. Presentación 1 litro';
                desc.maxLength     = 80;

                item.appendChild(img);
                item.appendChild(btnRemove);
                item.appendChild(desc);

                galeria.insertBefore(item, trigger);
            };

            reader.readAsDataURL(file);
        });

        input.value = ''; 
    });
}

// =========================
//  OBTENER id= DE LA URL
// =========================

function obtenerIdDeURL(){
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}