(function () {

    // ════════════════════════════════════════════════════════════
    //  GUARD DE SESIÓN
    // ════════════════════════════════════════════════════════════

    const usuarioRaw = sessionStorage.getItem('usuario');
    if (!usuarioRaw) {
        window.location.replace('login.html');
        return;
    }

    let sesion;
    try {
        sesion = JSON.parse(usuarioRaw);
    } catch (e) {
        window.location.replace('login.html');
        return;
    }

    window.addEventListener('pageshow', function (event) {
        if (event.persisted && !sessionStorage.getItem('usuario')) {
            window.location.replace('login.html');
        }
    });

    const API = '';

    // ════════════════════════════════════════════════════════════
    //  LOGOUT (mismo comportamiento que dashboard.js)
    // ════════════════════════════════════════════════════════════

    const btnLogout = document.getElementById('btnLogout');

    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            UIAlert.confirm({
                icon:      'logout',
                iconType:  'warning',
                title:     '¿Desea salir?',
                message:   'Se cerrará la sesión del administrador.',
                btnOk:     'Salir',
                btnCancel: 'Cancelar'
            }).then((confirma) => {
                if (confirma) {
                    sessionStorage.removeItem('usuario');
                    window.location.href = 'login.html';
                }
            });
        });
    }

    // ════════════════════════════════════════════════════════════
    //  ELEMENTOS DEL DOM
    // ════════════════════════════════════════════════════════════

    const fotoPerfil   = document.getElementById('fotoPerfil');
    const btnCambiarFoto = document.getElementById('btnCambiarFoto');
    const inputFoto     = document.getElementById('inputFoto');

    const valNombreCompleto   = document.getElementById('valNombreCompleto');
    const inputNombreCompleto = document.getElementById('inputNombreCompleto');
    const valCorreo    = document.getElementById('valCorreo');
    const inputCorreo  = document.getElementById('inputCorreo');
    const valNombre    = document.getElementById('valNombre');
    const valRol       = document.getElementById('valRol');

    const campoPassword          = document.getElementById('campoPassword');
    const btnCambiarPassword     = document.getElementById('btnCambiarPassword');
    const inputContrasenaActual  = document.getElementById('inputContrasenaActual');
    const inputContrasenaNueva   = document.getElementById('inputContrasenaNueva');

    const formPerfil   = document.getElementById('formPerfil');
    const btnGuardar   = document.getElementById('btnGuardar');
    const mensajePerfil = document.getElementById('mensajePerfil');

    let archivoFotoNuevo = null;
    let camposEditados = { nombreCompleto: false, correo: false };

    // ════════════════════════════════════════════════════════════
    //  MODO (?modo=ver | ?modo=editar)
    // ════════════════════════════════════════════════════════════

    const params = new URLSearchParams(window.location.search);
    const modoInicial = params.get('modo') === 'editar' ? 'editar' : 'ver';

    // ════════════════════════════════════════════════════════════
    //  CARGAR DATOS DEL USUARIO
    // ════════════════════════════════════════════════════════════

    async function cargarPerfil(){
    try {
        const resp = await fetch(`${API}/usuario/${sesion.id_usuario}`, {
            credentials: 'include'
        });
        if(!resp.ok) throw new Error('No se pudo cargar el perfil');
        const u = await resp.json();

            valNombreCompleto.textContent = u.nombre_completo || '--';
            inputNombreCompleto.value     = u.nombre_completo || '';

            valCorreo.textContent = u.correo || '--';
            inputCorreo.value     = u.correo || '';

            valNombre.textContent = u.nombre || '--';
            valRol.textContent    = u.rol || '--';

            fotoPerfil.src = u.foto_perfil
                ? `${API}/img/perfil/${u.foto_perfil}`
                : '../../img/logo_ci.png';

            // refresca la sesión guardada por si cambió algo
            sesion = { ...sesion, ...u };
            sessionStorage.setItem('usuario', JSON.stringify(sesion));

            if(modoInicial === 'editar'){
                activarEdicion('nombreCompleto');
                activarEdicion('correo');
            }
        } catch(error){
            console.error(error);
            mostrarMensaje('No se pudo cargar tu perfil.', 'error');
        }
    }

    cargarPerfil();

    // ════════════════════════════════════════════════════════════
    //  EDITAR CAMPOS (lápiz)
    // ════════════════════════════════════════════════════════════

    function activarEdicion(campo){
        camposEditados[campo] = true;
        if(campo === 'nombreCompleto'){
            valNombreCompleto.hidden = true;
            inputNombreCompleto.hidden = false;
        }
        if(campo === 'correo'){
            valCorreo.hidden = true;
            inputCorreo.hidden = false;
        }
        btnGuardar.hidden = false;
    }

    document.querySelectorAll('.btn-editar-campo').forEach(btn => {
        btn.addEventListener('click', () => activarEdicion(btn.dataset.campo));
    });

    // ════════════════════════════════════════════════════════════
    //  CAMBIAR FOTO (cámara)
    // ════════════════════════════════════════════════════════════

    btnCambiarFoto.addEventListener('click', () => inputFoto.click());

    inputFoto.addEventListener('change', () => {
        const archivo = inputFoto.files[0];
        if(!archivo) return;
        archivoFotoNuevo = archivo;
        fotoPerfil.src = URL.createObjectURL(archivo);
        btnGuardar.hidden = false;
    });

    // ════════════════════════════════════════════════════════════
    //  CAMBIAR CONTRASEÑA (mostrar/ocultar bloque)
    // ════════════════════════════════════════════════════════════

    btnCambiarPassword.addEventListener('click', () => {
        campoPassword.hidden = !campoPassword.hidden;
        if(!campoPassword.hidden){
            btnGuardar.hidden = false;
            inputContrasenaActual.focus();
        }
    });

    // ════════════════════════════════════════════════════════════
    //  GUARDAR CAMBIOS
    // ════════════════════════════════════════════════════════════

    function mostrarMensaje(texto, tipo){
        mensajePerfil.textContent = texto;
        mensajePerfil.className = `mensaje-perfil ${tipo}`;
    }

    formPerfil.addEventListener('submit', async (e) => {
        e.preventDefault();
        mostrarMensaje('', '');

        const nuevaContrasena = inputContrasenaNueva.value.trim();
        if(nuevaContrasena && !inputContrasenaActual.value.trim()){
            mostrarMensaje('Ingresa tu contraseña actual para poder cambiarla.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('nombre_completo', inputNombreCompleto.value.trim() || valNombreCompleto.textContent);
        formData.append('correo', inputCorreo.value.trim() || valCorreo.textContent);

        if(archivoFotoNuevo) formData.append('foto_perfil', archivoFotoNuevo);
        if(nuevaContrasena){
            formData.append('contrasena_actual', inputContrasenaActual.value.trim());
            formData.append('contrasena_nueva', nuevaContrasena);
        }

        try {
        const resp = await fetch(`${API}/usuario/${sesion.id_usuario}`, {
    method: 'PUT',
    credentials: 'include',
    body: formData
});

            const datos = await resp.json();

            if(!datos.success){
                mostrarMensaje(datos.mensaje || 'No se pudo guardar el perfil.', 'error');
                return;
            }

            sesion = { ...sesion, ...datos.usuario };
            sessionStorage.setItem('usuario', JSON.stringify(sesion));

            mostrarMensaje('Perfil actualizado correctamente.', 'exito');

            // vuelve a modo "ver"
            valNombreCompleto.textContent = sesion.nombre_completo;
            valNombreCompleto.hidden = false;
            inputNombreCompleto.hidden = true;

            valCorreo.textContent = sesion.correo;
            valCorreo.hidden = false;
            inputCorreo.hidden = true;

            campoPassword.hidden = true;
            inputContrasenaActual.value = '';
            inputContrasenaNueva.value = '';
            archivoFotoNuevo = null;
            btnGuardar.hidden = true;

        } catch(error){
            console.error(error);
            mostrarMensaje('Error al conectar con el servidor.', 'error');
        }
    });

})();