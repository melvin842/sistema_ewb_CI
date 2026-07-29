(function () {

    // ════════════════════════════════════════════════════════════
    //  GUARD DE SESIÓN + ROL
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

    // Solo administradores pueden ver esta página
    if (sesion.rol !== 'administrador') {
        window.location.replace('dashboard.html');
        return;
    }

    window.addEventListener('pageshow', function (event) {
        if (event.persisted && !sessionStorage.getItem('usuario')) {
            window.location.replace('login.html');
        }
    });

    const API = '';

    // ════════════════════════════════════════════════════════════
    //  LOGOUT
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
    //  FORMULARIO
    // ════════════════════════════════════════════════════════════

    const form = document.getElementById('formCrearUsuario');
    const mensaje = document.getElementById('mensajeCrear');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        mensaje.textContent = '';
        mensaje.className = 'mensaje-perfil';

        const payload = {
            nombre: document.getElementById('nuevoNombre').value.trim(),
            nombre_completo: document.getElementById('nuevoNombreCompleto').value.trim(),
            correo: document.getElementById('nuevoCorreo').value.trim(),
            contrasena: document.getElementById('nuevaContrasena').value,
            rol: document.getElementById('nuevoRol').value,
            rol_solicitante: sesion.rol
        };

        try {
            const resp = await fetch(`${API}/usuario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });
            const datos = await resp.json();

            if (!datos.success) {
                mensaje.textContent = datos.mensaje || 'No se pudo crear el usuario.';
                mensaje.classList.add('error');
                return;
            }

            mensaje.textContent = 'Usuario creado correctamente.';
            mensaje.classList.add('exito');
            form.reset();

        } catch (error) {
            console.error(error);
            mensaje.textContent = 'Error al conectar con el servidor.';
            mensaje.classList.add('error');
        }
    });

})();