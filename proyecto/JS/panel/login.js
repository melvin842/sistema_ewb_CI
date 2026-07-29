// login.js

const paginaInicioPorRol = {
    administrador: 'dashboard.html',
    rh: 'recursos-humanos.html',
    editor: 'productos.html'
};

function obtenerPaginaInicio(){
    const usuarioRaw = sessionStorage.getItem("usuario");
    if(!usuarioRaw) return null;

    try {
        const usuario = JSON.parse(usuarioRaw);
        return paginaInicioPorRol[usuario.rol] || 'dashboard.html';
    } catch(e){
        // sesión vieja guardada como texto plano, no como JSON
        return 'dashboard.html';
    }
}

async function verificarSesion(){
    try {
        const respuesta = await fetch("/sesion", {
            credentials: "include"
        });
        if(respuesta.ok){
            const destino = obtenerPaginaInicio();
            if(destino) window.location.replace(destino);
        } else {
            sessionStorage.removeItem("usuario"); // limpia sesión vieja inválida
        }
    } catch(e){
        // servidor no disponible, no redirigir
    }
}

verificarSesion();

window.addEventListener("pageshow", function(event){
    if(event.persisted){
        verificarSesion();
    }
});

document.getElementById("loginForm").addEventListener("submit", async function(e){
    e.preventDefault();
    const correo = document.getElementById("correo").value;
    const contrasena = document.getElementById("contrasena").value;

    // Deshabilitar el botón mientras se procesa, para evitar doble envío
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    const textoOriginal = btnSubmit.textContent;
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'INICIANDO SESIÓN...';

    try{
        const respuesta = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ correo, contrasena })
        });

        const datos = await respuesta.json();

        if(datos.success){

            sessionStorage.setItem("usuario", JSON.stringify(datos.usuario));

            UIAlert.toast('Sesión iniciada correctamente', 'success');

            const destino = paginaInicioPorRol[datos.usuario.rol] || 'dashboard.html';

            setTimeout(() => {
                window.location.replace(destino);
            }, 900);

        }else{

            // Correo o contraseña incorrectos (u otro error de validación del servidor)
            await UIAlert.alert({
                icon: 'error',
                iconType: 'error',
                title: 'No se pudo iniciar sesión',
                message: datos.mensaje || 'Correo o contraseña incorrectos.',
                btnOk: 'Aceptar'
            });

            btnSubmit.disabled = false;
            btnSubmit.textContent = textoOriginal;
        }

    }catch(error){

        console.error(error);

        // Error de red / servidor no disponible
        await UIAlert.alert({
            icon: 'wifi_off',
            iconType: 'error',
            title: 'Error al conectar con el servidor',
            message: 'No se pudo establecer conexión. Verifica tu internet e inténtalo de nuevo.',
            btnOk: 'Aceptar'
        });

        btnSubmit.disabled = false;
        btnSubmit.textContent = textoOriginal;
    }
});