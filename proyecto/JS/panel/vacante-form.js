// ════════════════════════════════════════════════════════════
//  vacante-form
// ════════════════════════════════════════════════════════════

const API = '';

const params     = new URLSearchParams(window.location.search);
const idVacante  = params.get('id') ? Number(params.get('id')) : null;
const modoEditar = idVacante !== null;

const formVacante      = document.getElementById('formVacante');
const tituloForm       = document.getElementById('tituloFormulario');
const btnGuardar       = document.getElementById('btnGuardar');
const inputFechaCierre = document.getElementById('fechaCierre');


initImagenPrincipal('imagenPrincipal', 'inputImagenPrincipal', (src) => {
    const previewImg = document.getElementById('previewImg');
    if(previewImg){
        previewImg.src           = src;
        previewImg.style.display = 'block';
    }
});

// ════════════════════════════════════════════════════════════
//  FECHA MÍNIMA (HOY) — evita seleccionar fechas pasadas
// ════════════════════════════════════════════════════════════

(function establecerFechaMinima(){
    const hoy = new Date();
    const y   = hoy.getFullYear();
    const m   = String(hoy.getMonth() + 1).padStart(2, '0');
    const d   = String(hoy.getDate()).padStart(2, '0');

        inputFechaCierre.min = `${y}-${m}-${d}`;
})();

// ════════════════════════════════════════════════════════════
//  ESTADO AUTOMÁTICO POR FECHA
// ════════════════════════════════════════════════════════════

function calcularEstadoPorFecha(fechaValor){
    if(!fechaValor) return null;

    const cierre = new Date(fechaValor);
    const hoy    = new Date();
    hoy.setHours(0,0,0,0);
    cierre.setHours(0,0,0,0);

    const dias = Math.floor((cierre - hoy) / 86400000);

    if(dias < 0)  return { estado: 'inactivo', dias, tipo: 'error' };
    if(dias <= 7) return { estado: 'proximo',  dias, tipo: 'info'  };
    return              { estado: 'activo',   dias, tipo: null    };
}

function aplicarEstadoAutomatico(){
    const val = inputFechaCierre.value;
    document.getElementById('msgFecha')?.remove();

    const resultado = calcularEstadoPorFecha(val);
    if(!resultado) return;


    const radio = document.querySelector(`input[name="estado"][value="${resultado.estado}"]`);
    if(radio) radio.checked = true;


    if(resultado.tipo){
        const el       = document.createElement('div');
        el.id          = 'msgFecha';
        el.style.cssText = `
            margin-top:10px; padding:10px 12px; border-radius:8px;
            font-size:13px; font-weight:600;
            ${resultado.tipo === 'error'
                ? 'background:#FCE8E6; color:#d32f2f; border-left:4px solid #d32f2f;'
                : 'background:#E3F2FD; color:#1976d2; border-left:4px solid #1976d2;'}
        `;
        el.textContent = resultado.tipo === 'error'
            ? 'Esta fecha ya pasó. La vacante se marcará como Cerrada.'
            : `Faltan ${resultado.dias} día(s). Se marcará como "Próxima a Cerrar".`;
        inputFechaCierre.parentElement.appendChild(el);
    }
}

inputFechaCierre.addEventListener('change', aplicarEstadoAutomatico);

// ════════════════════════════════════════════════════════════
//  MODO EDITAR — carga los datos
// ════════════════════════════════════════════════════════════

if(modoEditar){

    tituloForm.textContent = 'Editar Vacante';
    btnGuardar.innerHTML   = `<span class="material-symbols-outlined">save</span> Actualizar`;

    fetch(`${API}/recursos-humanos/${idVacante}`, {
    credentials: 'include'
})
    .then(res => {
        if(!res.ok) throw new Error('Vacante no encontrada');
        return res.json();
    })
    .then(v => cargarDatos(v))
    .catch(err => {
        console.error(err);
        UIAlert.toast('No se pudo cargar la vacante.', 'error');
    });

} else {
    tituloForm.textContent = 'Agregar Vacante';
}

// ════════════════════════════════════════════════════════════
//  CARGAR DATOS EN EL FORMULARIO
// ════════════════════════════════════════════════════════════

function cargarDatos(v){

    document.getElementById('puesto').value      = v.titulo      || '';
    document.getElementById('descripcion').value = v.descripcion || '';
    document.getElementById('requisitos').value  = v.requisitos  || '';
    document.getElementById('ofrecemos').value   = v.ofrecemos   || '';
    document.getElementById('horario').value     = v.horario     || '';
    document.getElementById('salario').value     = v.salario     || '';


    if(v.fecha_cierre){
        inputFechaCierre.value = new Date(v.fecha_cierre).toISOString().split('T')[0];
        aplicarEstadoAutomatico();
    }


    const mapaEstado = { disponible:'activo', cerrada:'inactivo', proxima:'proximo' };
    const estadoForm = mapaEstado[v.estado] || 'activo';
    const radio = document.querySelector(`input[name="estado"][value="${estadoForm}"]`);
    if(radio) radio.checked = true;

    const selIcono = document.getElementById('icono');
    if(selIcono && v.icono){
        selIcono.value = v.icono;
        if(selIcono.value !== v.icono){
            const opt = document.createElement('option');
            opt.value = v.icono;
            opt.textContent = v.icono;
            selIcono.appendChild(opt);
            selIcono.value = v.icono;
        }
        selIcono.dispatchEvent(new Event('change'));
    }

    if(v.imagen){
    const box = document.getElementById('imagenPrincipal');
    const ph  = box.querySelector('.placeholder');
    let   img = box.querySelector('img');
    if(!img){ img = document.createElement('img'); box.appendChild(img); }
    img.src     = v.imagen;                         // ya es la URL completa
    img.onerror = () => { img.src = '../../img/logo_ci.png'; };
    if(ph) ph.style.display = 'none';

        const previewImg = document.getElementById('previewImg');
        if(previewImg){
            previewImg.src           = img.src;
            previewImg.style.display = 'block';
        }
    }

    actualizarPreview();
}

// ════════════════════════════════════════════════════════════
//  VISTA PREVIA EN TIEMPO REAL
// ════════════════════════════════════════════════════════════

function actualizarPreview(){
    const puesto      = document.getElementById('puesto')?.value      || '';
    const descripcion = document.getElementById('descripcion')?.value || '';
    const icono       = document.getElementById('icono')?.value       || 'work';

    const previewPuesto = document.getElementById('previewPuesto');
    const previewDesc   = document.getElementById('previewDesc');
    const previewIcono  = document.getElementById('previewIcono');

    if(previewPuesto) previewPuesto.textContent = puesto || 'Nombre del puesto';
    if(previewIcono)  previewIcono.textContent  = icono;
    if(previewDesc){
        const txt = descripcion.trim();
        previewDesc.textContent = txt
            ? (txt.length > 100 ? txt.substring(0, 100) + '...' : txt)
            : 'Descripción del puesto...';
    }
}

['puesto', 'descripcion'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', actualizarPreview);
});
document.getElementById('icono')?.addEventListener('change', actualizarPreview);
actualizarPreview();

// ════════════════════════════════════════════════════════════
//  ENVÍO DEL FORMULARIO
// ════════════════════════════════════════════════════════════

formVacante.addEventListener('submit', async (e) => {
    e.preventDefault();

    const titulo      = document.getElementById('puesto').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const requisitos  = document.getElementById('requisitos').value.trim();
    const horario     = document.getElementById('horario').value.trim();

    // ─── VALIDACIONES DE CAMPOS ──────────────────────────
    if(!titulo || titulo.length < 3){
        UIAlert.toast('El puesto debe tener al menos 3 caracteres.', 'warning');
        return;
    }

    if(!descripcion || descripcion.length < 20){
        UIAlert.toast('La descripción debe tener al menos 20 caracteres.', 'warning');
        return;
    }

    if(!requisitos){
        UIAlert.toast('Ingresa los requisitos de la vacante.', 'warning');
        return;
    }

    if(!horario){
        UIAlert.toast('Ingresa el horario de la vacante.', 'warning');
        return;
    }

    if(!inputFechaCierre.value){
        UIAlert.toast('Selecciona una fecha de cierre.', 'warning');
        return;
    }

    const fechaSeleccionada = new Date(inputFechaCierre.value);
const hoy = new Date();
hoy.setHours(0,0,0,0);
fechaSeleccionada.setHours(0,0,0,0);

if(fechaSeleccionada < hoy){
    UIAlert.toast('La fecha de cierre no puede ser anterior al día de hoy.', 'warning');
    return;
}

    const imgFileValidar = document.getElementById('inputImagenPrincipal').files[0];
    if(!modoEditar && !imgFileValidar){
        UIAlert.toast('Selecciona una imagen para la vacante.', 'warning');
        return;
    }

    const estadoForm   = document.querySelector('input[name="estado"]:checked')?.value || 'activo';
    const mapaEstadoBD = { activo:'disponible', inactivo:'cerrada', proximo:'proxima' };

    const formData = new FormData();
    formData.append('titulo',       titulo);
    formData.append('descripcion',  descripcion);
    formData.append('requisitos',   document.getElementById('requisitos').value.trim());
    formData.append('ofrecemos',    document.getElementById('ofrecemos').value.trim());
    formData.append('horario',      document.getElementById('horario').value.trim());
    formData.append('salario',      document.getElementById('salario').value.trim());
    formData.append('fecha_cierre', inputFechaCierre.value || '');
    formData.append('estado',       mapaEstadoBD[estadoForm]);
    formData.append('icono',        document.getElementById('icono')?.value || 'work');


    const imgFile = document.getElementById('inputImagenPrincipal').files[0];
    if(imgFile) formData.append('imagen', imgFile);

    const url    = modoEditar ? `${API}/recursos-humanos/${idVacante}` : `${API}/recursos-humanos`;
    const metodo = modoEditar ? 'PUT' : 'POST';

    btnGuardar.disabled      = true;
    btnGuardar.style.opacity = '0.6';

    try {
        const res = await fetch(url, { 
            method: metodo, 
            credentials: 'include',
            body: formData 
        });
        const data = await res.json();

        if(!res.ok){
            console.error('Error servidor:', data);
            throw new Error(data.mensaje || `Error ${res.status}`);
        }

        
        await UIAlert.success('vacante', modoEditar);

        window.location.href = 'recursos-humanos.html';

    } catch(error){
        console.error('Error al guardar:', error);
        UIAlert.toast(`Error: ${error.message || 'Intenta de nuevo.'}`, 'error');
        btnGuardar.disabled      = false;
        btnGuardar.style.opacity = '1';
    }
});