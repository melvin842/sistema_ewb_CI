// ════════════════════════════════════════════════════════════
//  vacante-form.js
//  Maneja agregar-vacante.html  y  editar-vacante.html
// ════════════════════════════════════════════════════════════

const API = '';

const params     = new URLSearchParams(window.location.search);
const idVacante  = params.get('id') ? Number(params.get('id')) : null;
const modoEditar = idVacante !== null;

const formVacante      = document.getElementById('formVacante');
const tituloForm       = document.getElementById('tituloFormulario');
const btnGuardar       = document.getElementById('btnGuardar');
const inputFechaCierre = document.getElementById('fechaCierre');

// ✅ UNA SOLA llamada a initImagenPrincipal con callback de preview
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
    // En modo agregar bloquea fechas pasadas
    // En modo editar no ponemos mínimo para no bloquear fecha existente
    if(!modoEditar){
        inputFechaCierre.min = `${y}-${m}-${d}`;
    }
})();

// ════════════════════════════════════════════════════════════
//  ESTADO AUTOMÁTICO POR FECHA
//  - Fecha pasada      → Cerrada
//  - ≤ 7 días restantes → Próxima a Cerrar
//  - > 7 días           → Disponible
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

    // Marca el radio correspondiente
    const radio = document.querySelector(`input[name="estado"][value="${resultado.estado}"]`);
    if(radio) radio.checked = true;

    // Muestra mensaje informativo
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

    // Fecha de cierre
    if(v.fecha_cierre){
        inputFechaCierre.value = new Date(v.fecha_cierre).toISOString().split('T')[0];
        // Evalúa el estado actual según la fecha guardada
        aplicarEstadoAutomatico();
    }

    // Estado — si no hay fecha o el admin lo cambió manualmente
    const mapaEstado = { disponible:'activo', cerrada:'inactivo', proxima:'proximo' };
    const estadoForm = mapaEstado[v.estado] || 'activo';
    const radio = document.querySelector(`input[name="estado"][value="${estadoForm}"]`);
    if(radio) radio.checked = true;

    // ✅ Ícono
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

    // ✅ Imagen — muestra la actual en el cuadro y en la preview
    if(v.imagen){
        const box = document.getElementById('imagenPrincipal');
        const ph  = box.querySelector('.placeholder');
        let   img = box.querySelector('img');
        if(!img){ img = document.createElement('img'); box.appendChild(img); }
        img.src     = `${API}/img/rh/${v.imagen}`;
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

    if(!titulo || !descripcion){
        UIAlert.toast('Completa los campos obligatorios.', 'warning');
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

    // ✅ Imagen: solo agrega si el usuario seleccionó un archivo nuevo
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