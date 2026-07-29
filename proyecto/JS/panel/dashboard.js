(function () {

// ════════════════════════════════════════════════════════════
//  GUARD DE SESIÓN — debe ir primero, antes de pintar nada
// ════════════════════════════════════════════════════════════

function verificarAcceso(){
    if(!sessionStorage.getItem('usuario')){
        window.location.replace('login.html');
        return false;
    }
    return true;
}

if(!verificarAcceso()){
    return; // detiene la ejecución del resto del script
}

// también revisa si la página vuelve del bfcache (botón atrás/adelante)
window.addEventListener('pageshow', function(event){
    if(event.persisted && !sessionStorage.getItem('usuario')){
        window.location.replace('login.html');
    }
});

console.log("Panel administrativo cargado correctamente");

const API = '';

const btnLogout = document.getElementById('btnLogout');

if(btnLogout){
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
            if(confirma){
                sessionStorage.removeItem('usuario');
                window.location.href = 'login.html';
            }
        });
    });
}


// ════════════════════════════════════════════════════════════
//  MOTOR GENÉRICO DE TARJETAS — fetch + caché de 7 días
// ════════════════════════════════════════════════════════════

const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

function textoActualizado(timestamp){
    const dias = Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000));
    return dias <= 0 ? 'Actualizado hoy' : `Actualizado hace ${dias} día${dias === 1 ? '' : 's'}`;
}

/**
 * Carga datos de una tarjeta usando caché de sessionStorage (7 días).
 * @param {string}   cacheKey   Llave única en sessionStorage
 * @param {string}   url        Endpoint de la API
 * @param {Function} calcularFn (datosCrudos) => objeto de stats
 * @param {Function} pintarFn   (stats, timestamp) => pinta en el DOM
 */
async function cargarTarjetaConCache(cacheKey, url, calcularFn, pintarFn){
    const cacheRaw = sessionStorage.getItem(cacheKey);

    if(cacheRaw){
        try {
            const cache = JSON.parse(cacheRaw);
            if((Date.now() - cache.timestamp) < SIETE_DIAS_MS){
                pintarFn(cache.stats, cache.timestamp);
                return;
            }
        } catch(e){
            console.warn(`Caché "${cacheKey}" corrupto, se ignora.`, e);
        }
    }

    try {
        const respuesta = await fetch(url, {
            credentials: 'include'
        });
        if(!respuesta.ok) throw new Error(`Error al obtener datos de ${url}`);
        const datos = await respuesta.json();

        const stats     = calcularFn(datos);
        const timestamp = Date.now();

        sessionStorage.setItem(cacheKey, JSON.stringify({ stats, timestamp }));
        pintarFn(stats, timestamp);

    } catch(error){
        console.error(`Error cargando tarjeta (${cacheKey}):`, error);
        if(cacheRaw){
            try {
                const cache = JSON.parse(cacheRaw);
                pintarFn(cache.stats, cache.timestamp);
            } catch(e){ /* sin respaldo disponible */ }
        }
    }
}


// ════════════════════════════════════════════════════════════
//  TARJETA — PRODUCTOS
// ════════════════════════════════════════════════════════════

function calcularStatsProductos(productos){
    return {
        total:     productos.length,
        activos:   productos.filter(p => p.estado === 'activo').length,
        inactivos: productos.filter(p => p.estado === 'inactivo').length
    };
}

function pintarStatsProductos(stats, timestamp){
    const el = document.getElementById('prodTotal');
    if(!el) return;
    el.childNodes[0].nodeValue = `${stats.total} `;
    document.getElementById('prodActivos').textContent    = stats.activos;
    document.getElementById('prodInactivos').textContent  = stats.inactivos;
    document.getElementById('prodActualizado').textContent = textoActualizado(timestamp);
}

if(document.getElementById('prodTotal')){
    cargarTarjetaConCache(
        'dashboardProductosCache',
        `${API}/productos`,
        calcularStatsProductos,
        pintarStatsProductos
    );
}


// ════════════════════════════════════════════════════════════
//  TARJETA — VACANTES (Recursos Humanos)
// ════════════════════════════════════════════════════════════

function calcularStatsVacantes(vacantes){
    return {
        total:    vacantes.length,
        abiertas: vacantes.filter(v => v.estado === 'disponible').length,
        proximas: vacantes.filter(v => v.estado === 'proxima').length,
        cerradas: vacantes.filter(v => v.estado === 'cerrada').length
    };
}

function pintarStatsVacantes(stats, timestamp){
    const el = document.getElementById('vacTotal');
    if(!el) return;
    el.childNodes[0].nodeValue = `${stats.total} `;
    document.getElementById('vacAbiertas').textContent  = stats.abiertas;
    document.getElementById('vacProximas').textContent  = stats.proximas;
    document.getElementById('vacCerradas').textContent  = stats.cerradas;
    document.getElementById('vacActualizado').textContent = textoActualizado(timestamp);
}

if(document.getElementById('vacTotal')){
    cargarTarjetaConCache(
        'dashboardVacantesCache',
        `${API}/recursos-humanos`,
        calcularStatsVacantes,
        pintarStatsVacantes
    );
}


// ════════════════════════════════════════════════════════════
//  TARJETA — NOTICIAS
// ════════════════════════════════════════════════════════════

function calcularStatsNoticias(noticias){
    return {
        total:      noticias.length,
        publicadas: noticias.filter(n => n.estado === 'activo').length,
        ocultas:    noticias.filter(n => n.estado === 'oculta' || n.estado === 'inactivo').length,
        alertas:    noticias.filter(n => n.tipo === 'alerta' && n.estado === 'activo').length
    };
}

function pintarStatsNoticias(stats, timestamp){
    const el = document.getElementById('newsTotal');
    if(!el) return;
    el.childNodes[0].nodeValue = `${stats.total} `;
    document.getElementById('newsPublicadas').textContent = stats.publicadas;
    document.getElementById('newsOcultas').textContent    = stats.ocultas;
    document.getElementById('newsAlertas').textContent    = stats.alertas;
    document.getElementById('newsActualizado').textContent = textoActualizado(timestamp);
}

if(document.getElementById('newsTotal')){
    cargarTarjetaConCache(
        'dashboardNoticiasCache',
        `${API}/noticias`,
        calcularStatsNoticias,
        pintarStatsNoticias
    );
}


// ════════════════════════════════════════════════════════════
//  TARJETA — SUGERENCIAS
// ════════════════════════════════════════════════════════════

function calcularStatsSugerencias(sugerencias){
    return {
        total:      sugerencias.length,
        revisadas:  sugerencias.filter(s => s.estado === 'revisada').length,
        pendientes: sugerencias.filter(s => s.estado === 'pendiente').length
    };
}

function pintarStatsSugerencias(stats, timestamp){
    const el = document.getElementById('sugTotal');
    if(!el) return;
    el.childNodes[0].nodeValue = `${stats.total} `;
    document.getElementById('sugPendientes').textContent = stats.pendientes;
    document.getElementById('sugRevisadas').textContent  = stats.revisadas;
    document.getElementById('sugActualizado').textContent = textoActualizado(timestamp);
}

if(document.getElementById('sugTotal')){
    cargarTarjetaConCache(
        'dashboardSugerenciasCache',
        `${API}/sugerencias`,
        calcularStatsSugerencias,
        pintarStatsSugerencias
    );
}

})();