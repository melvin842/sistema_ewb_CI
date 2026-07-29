(function () {

    const usuarioRaw = sessionStorage.getItem('usuario');
    if (!usuarioRaw) return; // el guard de sesión de cada página ya redirige a login

    let usuario;
    try {
        usuario = JSON.parse(usuarioRaw);
    } catch (e) {
        // compatibilidad con sesiones viejas donde "usuario" era solo un string
        usuario = { nombre: usuarioRaw };
    }

    const userBtn      = document.getElementById('userBtn');
    const userDropdown = document.getElementById('userDropdown');
    const nombreEl     = document.getElementById('userDropdownNombre');
    const rolEl        = document.getElementById('userDropdownRol');
    const linkCrear    = document.getElementById('linkCrearUsuario');

    if (nombreEl) nombreEl.textContent = usuario.nombre_completo || usuario.nombre || 'Usuario';
    if (rolEl)    rolEl.textContent    = usuario.rol || '--';

    // Solo administradores ven "Crear nuevo usuario"
    if (linkCrear) {
        linkCrear.style.display = (usuario.rol === 'administrador') ? 'flex' : 'none';
    }

    if (userBtn && userDropdown) {
        userBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!userDropdown.contains(e.target) && e.target !== userBtn) {
                userDropdown.classList.remove('show');
            }
        });

        // Cierra con la tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') userDropdown.classList.remove('show');
        });
    }

})();