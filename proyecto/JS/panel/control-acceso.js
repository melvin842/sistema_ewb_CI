(function () {

    const usuarioRaw = sessionStorage.getItem('usuario');
    if (!usuarioRaw) return; // el guard de sesión de la página ya redirige a login

    let usuario;
    try {
        usuario = JSON.parse(usuarioRaw);
    } catch (e) {
        return; // sesión corrupta, deja que el guard de la página lo maneje
    }

    // ════════════════════════════════════════════════════════════
    //  ADMINISTRADOR — sin ninguna restricción
    //  Ve y accede a TODAS las pantallas del panel, sin excepción.
    //  No se toca la sidebar ni se bloquea ninguna página.
    // ════════════════════════════════════════════════════════════

    if (usuario.rol === 'administrador') {
        return;
    }

    // ════════════════════════════════════════════════════════════
    //  PANTALLAS PERMITIDAS POR ROL (solo aplica a roles limitados)
    // ════════════════════════════════════════════════════════════

    const permisosPorRol = {
        rh: [
            'recursos-humanos.html', 'postulaciones.html', 'perfil.html',
            'agregar-vacante.html','editar vacante.html'
        ],
        editor: [
            'productos.html','agregar-productos.html','actualizar-productos.html',
            'noticias.html','agregar-noticias.html','editar noticia.html', 'perfil.html'
        ]
    };

    // A dónde mandamos a cada rol cuando no tiene acceso a algo
    const paginaInicioPorRol = {
        rh: 'recursos-humanos.html',
        editor: 'productos.html'
    };

    const permitidas = permisosPorRol[usuario.rol] || [];
    // decodeURIComponent es necesario porque nombres con espacios
    // (ej. "editar vacante.html") llegan como "editar%20vacante.html"
    const paginaActual = decodeURIComponent(window.location.pathname.split('/').pop());

    // ════════════════════════════════════════════════════════════
    //  BLOQUEO DE PANTALLA NO PERMITIDA
    // ════════════════════════════════════════════════════════════

    if (paginaActual && !permitidas.includes(paginaActual)) {
        mostrarAccesoDenegado(() => {
            window.location.replace(paginaInicioPorRol[usuario.rol] || 'login.html');
        });
        return;
    }

    // ════════════════════════════════════════════════════════════
    //  OCULTAR EN LA SIDEBAR LO QUE EL ROL NO PUEDE VER
    // ════════════════════════════════════════════════════════════

    document.querySelectorAll('.sidebar nav a').forEach(link => {
        const href = link.getAttribute('href') || '';
        const archivo = decodeURIComponent(href.split('/').pop());
        if (archivo && !permitidas.includes(archivo)) {
            link.style.display = 'none';
        }
    });

    // ════════════════════════════════════════════════════════════
    //  MODAL DE ACCESO DENEGADO
    // ════════════════════════════════════════════════════════════

    function mostrarAccesoDenegado(callback) {
        document.documentElement.style.visibility = 'hidden';

        const overlay = document.createElement('div');
        overlay.id = 'accesoDenegadoOverlay';
        overlay.style.cssText = `
            position:fixed; inset:0; background:rgba(0,0,0,.75);
            display:flex; align-items:center; justify-content:center;
            z-index:99999; font-family:Arial, Helvetica, sans-serif;
        `;
        overlay.innerHTML = `
            <div style="background:white; padding:35px 30px; border-radius:15px;
                        text-align:center; max-width:340px;
                        box-shadow:0 10px 30px rgba(0,0,0,.3);">
                <div style="font-size:50px; color:#e53935; margin-bottom:10px;">&#9888;</div>
                <h2 style="color:#222; margin-bottom:10px; font-size:20px;">Acceso denegado</h2>
                <p style="color:#666; font-size:14px; margin:0;">
                    No tienes permisos para ver esta pantalla. Serás redirigido en un momento...
                </p>
            </div>
        `;

        document.documentElement.style.visibility = 'visible';
        document.body.innerHTML = '';
        document.body.appendChild(overlay);

        setTimeout(callback, 2000);
    }

})();