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

        archivos.slice(0, maxImagenes - actuales).forEach(file => {

            const reader = new FileReader();

            reader.onload = (ev) => {

                const item     = document.createElement('div');
                item.className = 'galeria-item';

                // Preview de la imagen
                const img  = document.createElement('img');
                img.src    = ev.target.result;
                img._file  = file; 

                // Botón quitar
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
//  OBTENER ?id= DE LA URL
// =========================

function obtenerIdDeURL(){
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}