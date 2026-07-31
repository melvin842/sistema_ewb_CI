const mensaje     = document.getElementById('mensaje');
const contador    = document.getElementById('contador');
const formulario  = document.getElementById('formSugerencia');
const correoInput = document.getElementById('correo');
const correoError = document.getElementById('correoError');
const modal       = document.getElementById('modalExito');
const cerrarModal = document.getElementById('cerrarModal');

// =========================
// CONTADOR DE CARACTERES
// =========================

mensaje.addEventListener('input', () => {
    const len = mensaje.value.length;
    contador.textContent = len;
    contador.style.color = len >= 450 ? '#cc0000' : '#aaa';
});

// =========================
// VALIDACIÓN EN TIEMPO REAL
// =========================

function validarCorreo(email){
    const re = new RegExp('^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$');
    return re.test(email);
}

// =========================
// VALIDACIONES DE CAMPOS
// =========================

const LIMITES = {
    nombre:  { min: 2,  max: 80 },
    asunto:  { min: 3,  max: 100 },
    mensaje: { min: 10, max: 500 }
};


function validarCampo(id, valor){
    const v = valor.trim();
    const limite = LIMITES[id];

    if(!v) return 'Este campo es obligatorio.';
    if(limite && v.length < limite.min){
        return `Debe tener al menos ${limite.min} caracteres.`;
    }
    if(limite && v.length > limite.max){
        return `No puede superar los ${limite.max} caracteres.`;
    }
    return '';
}

correoInput.addEventListener('input', () => {
    if(correoInput.value && !validarCorreo(correoInput.value)){
        correoError.textContent = 'Ingresa un correo electrónico válido.';
    } else {
        correoError.textContent = '';
    }
});

document.querySelectorAll('#formSugerencia input, #formSugerencia textarea')
    .forEach(campo => {
        campo.addEventListener('blur', () => {
            campo.style.borderColor = !campo.value.trim() ? '#cc0000' : '#ddd';
        });
        campo.addEventListener('focus', () => {
            campo.style.borderColor = '#026432';
        });
    });

// =========================
// ENVÍO DEL FORMULARIO
// =========================

let enviandoFormulario = false; 

formulario.addEventListener('submit', async (e) => {
    e.preventDefault();


    if(enviandoFormulario) return;
    enviandoFormulario = true;


    correoError.textContent = '';

    const camposAValidar = [
        { id: 'nombre',  el: document.getElementById('nombre') },
        { id: 'asunto',  el: document.getElementById('asunto') },
        { id: 'mensaje', el: mensaje }
    ];

    let primerCampoInvalido = null;

    for(const campo of camposAValidar){
        const error = validarCampo(campo.id, campo.el.value);
        if(error){
            campo.el.style.borderColor = '#cc0000';
            if(!primerCampoInvalido) primerCampoInvalido = { el: campo.el, mensaje: error };
        } else {
            campo.el.style.borderColor = '#ddd';
        }
    }

    if(primerCampoInvalido){
        UIAlert.toast(primerCampoInvalido.mensaje, 'error');
        primerCampoInvalido.el.focus();
        enviandoFormulario = false;
        return;
    }

    if(!validarCorreo(correoInput.value)){
        correoError.textContent = 'Ingresa un correo electrónico válido.';
        correoInput.focus();
        enviandoFormulario = false;
        return;
    }

    const btn = formulario.querySelector('.btn-enviar');
    btn.textContent = 'Enviando...';
    btn.disabled    = true;

    const datos = {
        nombre:  document.getElementById('nombre').value.trim(),
        correo:  correoInput.value.trim(),
        asunto:  document.getElementById('asunto').value.trim(),
        mensaje: mensaje.value.trim()
    };

    try {

        // ════════════════════════════════════════════════
        //   POST SUGERENCIA AL BACKEND
        // ════════════════════════════════════════════════

        const respuesta = await fetch('/sugerencias', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(datos)
        });

        if(!respuesta.ok){
            throw new Error(`Error ${respuesta.status}: ${respuesta.statusText}`);
        }

        const resultado = await respuesta.json();

        if(!resultado.success){
            throw new Error(resultado.mensaje || 'Error desconocido');
        }

        // ════════════════════════════════════════════════
        //   ÉXITO
        // ════════════════════════════════════════════════

        mostrarExito();

    } catch(error) {

        console.error('Error al enviar sugerencia:', error);

        
        UIAlert.toast(
            'Ocurrió un error al enviar tu sugerencia. Inténtalo de nuevo.',
            'error'
        );

    } finally {
        btn.textContent = 'Enviar sugerencia';
        btn.disabled    = false;
        enviandoFormulario = false;
    }
});

// =========================
// MOSTRAR ÉXITO Y LIMPIAR
// =========================

function mostrarExito(){

    UIAlert.alert({
        icon: 'mail',
        iconType: 'success',
        title: 'Sugerencia enviada',
        message: 'Tu sugerencia ha sido recibida correctamente. Gracias por tu aporte.',
        btnOk: 'Aceptar'
    }).then(() => {

        formulario.reset();
        contador.textContent = '0';
        contador.style.color = '#aaa';
        document.querySelectorAll('#formSugerencia input, #formSugerencia textarea')
            .forEach(campo => campo.style.borderColor = '#ddd');
    });
}

// =========================
// CERRAR MODAL 
// =========================

if(cerrarModal){
    cerrarModal.addEventListener('click', () => modal.classList.remove('show'));
}

if(modal){
    modal.addEventListener('click', (e) => {
        if(e.target === modal) modal.classList.remove('show');
    });
}