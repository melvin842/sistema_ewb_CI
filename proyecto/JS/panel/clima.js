// =========================
//  CONFIGURACION DE UBICACION
// =========================

const UBICACION = {
    lat: 18.884653,
    lon: -96.817531,
    nombre: "Comercializadora El Ingenio, Potrero Nuevo, Ver."
};
document.getElementById('ubicacionClima').textContent = UBICACION.nombre;

// =========================
//  CODIGOS WMO
// =========================

const WMO = {
    0:  { desc: "Despejado",            icono: "01d" },
    1:  { desc: "Mayormente despejado", icono: "02d" },
    2:  { desc: "Parcialmente nublado", icono: "03d" },
    3:  { desc: "Nublado",              icono: "04d" },
    45: { desc: "Niebla",               icono: "50d" },
    48: { desc: "Niebla con escarcha",  icono: "50d" },
    51: { desc: "Llovizna ligera",      icono: "09d" },
    53: { desc: "Llovizna moderada",    icono: "09d" },
    55: { desc: "Llovizna intensa",     icono: "09d" },
    61: { desc: "Lluvia ligera",        icono: "10d" },
    63: { desc: "Lluvia moderada",      icono: "10d" },
    65: { desc: "Lluvia intensa",       icono: "10d" },
    71: { desc: "Nieve ligera",         icono: "13d" },
    73: { desc: "Nieve moderada",       icono: "13d" },
    75: { desc: "Nieve intensa",        icono: "13d" },
    80: { desc: "Chubascos ligeros",    icono: "09d" },
    81: { desc: "Chubascos moderados",  icono: "09d" },
    82: { desc: "Chubascos fuertes",    icono: "09d" },
    95: { desc: "Tormenta eléctrica",   icono: "11d" },
    96: { desc: "Tormenta con granizo", icono: "11d" },
    99: { desc: "Tormenta fuerte",      icono: "11d" }
};

const CODIGOS_TORMENTA = [95, 96, 99];
const CODIGOS_LLUVIA   = [51,53,55,61,63,65,80,81,82,95,96,99];
const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

function getIconoUrl(codigo){
    const icono = (WMO[codigo] || { icono: '01d' }).icono;
    return `https://openweathermap.org/img/wn/${icono}@2x.png`;
}

function getDesc(codigo){
    return (WMO[codigo] || { desc: 'Desconocido' }).desc;
}

// ✅ Funciones con nombres únicos, sin conflicto con variables locales
function codigoEsTormenta(c){ return CODIGOS_TORMENTA.includes(Number(c)); }
function codigoEsLluvia(c){   return CODIGOS_LLUVIA.includes(Number(c)); }

// =========================
//  LLAMADA A OPEN-METEO
// =========================

async function obtenerClima(){

    const url = `https://api.open-meteo.com/v1/forecast`
        + `?latitude=${UBICACION.lat}`
        + `&longitude=${UBICACION.lon}`
        + `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation`
        + `&hourly=temperature_2m,weather_code,precipitation_probability`
        + `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum`
        + `&timezone=America%2FMexico_City`
        + `&forecast_days=7`;

    const respuesta = await fetch(url);
    if(!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    return await respuesta.json();
}

// =========================
//  MOSTRAR CLIMA DE HOY
// =========================

function mostrarHoy(datos){

    const cur = datos.current;

    const temp      = Math.round(cur.temperature_2m);
    const sensacion = Math.round(cur.apparent_temperature);
    const humedad   = cur.relative_humidity_2m;
    const viento    = Math.round(cur.wind_speed_10m);
    const lluvia    = cur.precipitation;
    const codigo    = cur.weather_code;

    document.getElementById('climaIconoHoy').src          = getIconoUrl(codigo);
    document.getElementById('climaTempHoy').textContent   = `${temp}°C`;
    document.getElementById('climaDescHoy').textContent   = getDesc(codigo);
    document.getElementById('climaHumedad').textContent   = `${humedad}%`;
    document.getElementById('climaViento').textContent    = `${viento} km/h`;
    document.getElementById('climaSensacion').textContent = `${sensacion}°C`;
    document.getElementById('climaLluvia').textContent    = `${lluvia} mm`;

    const alertaEl = document.getElementById('climaAlerta');
    if(codigoEsTormenta(codigo)){
        document.getElementById('climaAlertaTexto').textContent =
            `${getDesc(codigo)} en curso. Evitar actividades al aire libre y alejarse de estructuras metálicas.`;
        alertaEl.style.display = 'flex';
    } else {
        alertaEl.style.display = 'none';
    }

    document.getElementById('climaLoading').style.display    = 'none';
    document.getElementById('climaHoyContent').style.display = 'block';
}

// =========================
//  GRAFICO DE HORAS — HOY
// =========================

function mostrarGraficoHoras(datos){

    const ahora    = new Date();
    const fechaHoy = ahora.toISOString().slice(0, 10);
    const horaAhora = ahora.getHours();

    const hourly = datos.hourly;

    const horasHoy = hourly.time
        .map((t, i) => ({
            hora:   new Date(t),
            temp:   Math.round(hourly.temperature_2m[i]),
            codigo: hourly.weather_code[i],
            prob:   hourly.precipitation_probability[i]
        }))
        .filter(h => h.hora.toISOString().slice(0, 10) === fechaHoy);

    if(horasHoy.length === 0) return;

    const temps   = horasHoy.map(h => h.temp);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const rango   = maxTemp - minTemp || 1;

    const contenedor = document.getElementById('graficoHoras');
    contenedor.innerHTML = '';

    horasHoy.forEach(h => {

        const horaNum   = h.hora.getHours();
        const esAhora   = horaNum === horaAhora;
        const alturaBar = 30 + Math.round(((h.temp - minTemp) / rango) * 50);

        // ✅ Variables locales con nombre diferente a las funciones globales
        const esTormentaHora = codigoEsTormenta(h.codigo);
        const esLluviaHora   = codigoEsLluvia(h.codigo);

        let colorBar = '#026432';
        if(esTormentaHora)      colorBar = '#e53935';
        else if(esLluviaHora)   colorBar = '#1565c0';

        const col = document.createElement('div');
        col.className = `hora-col${esAhora ? ' ahora' : ''}`;

        col.innerHTML = `
            <span class="hora-temp">${h.temp}°</span>
            <img src="${getIconoUrl(h.codigo)}" title="${getDesc(h.codigo)}" class="hora-icono">
            <div class="hora-barra-wrap">
                <div class="hora-barra" style="height:${alturaBar}px; background:${colorBar};"></div>
            </div>
            ${h.prob > 0
                ? `<span class="hora-prob">${h.prob}%</span>`
                : `<span class="hora-prob" style="opacity:0">0%</span>`
            }
            <span class="hora-label">${horaNum}h</span>
        `;

        contenedor.appendChild(col);
    });

    // Scroll automático a la hora actual
    const colActual = contenedor.querySelector('.ahora');
    if(colActual){
        setTimeout(() => {
            colActual.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }, 400);
    }
}

// =========================
//  PRONOSTICO 7 DIAS
// =========================

function mostrarPronostico(datos){

    const lista  = document.getElementById('pronosticoLista');
    lista.innerHTML = '';

    const daily  = datos.daily;
    const hourly = datos.hourly;
    const hoy    = new Date().toDateString();

    daily.time.forEach((fechaISO, i) => {

        const fecha    = new Date(fechaISO + 'T12:00:00');
        const codigo   = daily.weather_code[i];
        const max      = Math.round(daily.temperature_2m_max[i]);
        const min      = Math.round(daily.temperature_2m_min[i]);
        const esHoy    = fecha.toDateString() === hoy;

        // ✅ Variables locales con nombre diferente a las funciones globales
        const diaEsTormenta = codigoEsTormenta(codigo);
        const diaEsLluvia   = codigoEsLluvia(codigo) && !diaEsTormenta;

        // Horas con lluvia o tormenta ese día
        const horasBad = hourly.time
            .map((t, idx) => ({
                hora:   new Date(t),
                codigo: hourly.weather_code[idx]
            }))
            .filter(h =>
                h.hora.toISOString().slice(0, 10) === fechaISO &&
                codigoEsLluvia(h.codigo)
            );

        // Agrupa horas consecutivas en rangos ej: 14h–17h
        let rangosTexto = '';
        if(horasBad.length > 0){
            const rangos  = [];
            let inicioRng = horasBad[0].hora.getHours();
            let antRng    = inicioRng;

            for(let k = 1; k < horasBad.length; k++){
                const hNum = horasBad[k].hora.getHours();
                if(hNum !== antRng + 1){
                    rangos.push(inicioRng === antRng ? `${inicioRng}h` : `${inicioRng}h–${antRng}h`);
                    inicioRng = hNum;
                }
                antRng = hNum;
            }
            rangos.push(inicioRng === antRng ? `${inicioRng}h` : `${inicioRng}h–${antRng}h`);
            rangosTexto = rangos.join(', ');
        }

        const item = document.createElement('div');
        item.className = [
            'pronostico-item',
            esHoy        ? 'hoy'      : '',
            diaEsTormenta ? 'tormenta' : '',
            diaEsLluvia   ? 'lluvia'   : ''
        ].filter(Boolean).join(' ');

        item.innerHTML = `
            <span class="pronostico-dia">
                ${esHoy ? 'Hoy' : DIAS[fecha.getDay()]}
                ${fecha.getDate()}/${fecha.getMonth() + 1}
            </span>

            <img src="${getIconoUrl(codigo)}" alt="${getDesc(codigo)}" title="${getDesc(codigo)}">

            <div class="pronostico-info">
                <span class="pronostico-desc">
                    ${diaEsTormenta ? `⚡ ${getDesc(codigo)}` : getDesc(codigo)}
                </span>
                ${rangosTexto
                    ? `<span class="pronostico-horas">
                           ${diaEsTormenta ? '⚡' : '🌧'} ${rangosTexto}
                       </span>`
                    : ''
                }
            </div>

            <div class="pronostico-temps">
                <span class="max">${max}°</span>
                <span class="min">${min}°</span>
            </div>
        `;

        lista.appendChild(item);
    });
}

// =========================
//  ALERTA SEMANAL
// =========================

function verificarAlertasSemana(datos){

    const alertaEl  = document.getElementById('climaAlerta');
    const alertaTxt = document.getElementById('climaAlertaTexto');
    const daily     = datos.daily;

    if(alertaEl.style.display === 'flex') return;

    const diasTormenta = [];
    const hoy = new Date().toDateString();

    daily.time.forEach((fechaISO, i) => {
        const fecha = new Date(fechaISO + 'T12:00:00');
        if(fecha.toDateString() === hoy) return;
        if(codigoEsTormenta(daily.weather_code[i])){
            diasTormenta.push(`${DIAS[fecha.getDay()]} ${fecha.getDate()}/${fecha.getMonth()+1}`);
        }
    });

    if(diasTormenta.length > 0){
        alertaTxt.textContent =
            `Se prevén tormentas eléctricas el: ${diasTormenta.join(', ')}. `
            + `Tome precauciones y revise actividades al aire libre.`;
        alertaEl.style.display = 'flex';
    }
}

// =========================
//  CARGAR CLIMA (PRINCIPAL)
// =========================

async function cargarClima(){

    const loadingEl = document.getElementById('climaLoading');
    const errorEl   = document.getElementById('climaError');

    loadingEl.style.display                                  = 'flex';
    errorEl.style.display                                    = 'none';
    document.getElementById('climaHoyContent').style.display = 'none';
    document.getElementById('pronosticoLista').innerHTML     = '';

    try {

        const datos = await obtenerClima();

        mostrarHoy(datos);
        mostrarGraficoHoras(datos);
        mostrarPronostico(datos);
        verificarAlertasSemana(datos);

    } catch(error){

        console.error('Error al cargar clima:', error);
        loadingEl.style.display = 'none';
        errorEl.style.display   = 'flex';
    }
}

// =========================
//  BOTON REINTENTAR
// =========================

document.getElementById('climaReintentar').addEventListener('click', cargarClima);

// =========================
//  INICIO + AUTO-REFRESH 30 min
// =========================

cargarClima();
setInterval(cargarClima, 30 * 60 * 1000);