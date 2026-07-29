function obtenerIdDeURL(){
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    return id ? Number(id) : null;
}

// ════════════════════════════════════════════════════════════
//  BLOQUE 1 — LISTADO (productos.html)
// ════════════════════════════════════════════════════════════

if(document.getElementById('tablaProductos')){

    let productos = [];

    // ✅ Formatea fecha de BD 
    function formatearFecha(valor){
        if(!valor) return '---';
        const fecha = new Date(valor);
        // Corrige desfase de zona horaria (DATE viene como medianoche UTC)
        const fechaLocal = new Date(fecha.getTime() + fecha.getTimezoneOffset() * 60000);
        return fechaLocal.toLocaleDateString('es-MX', {
            day:   '2-digit',
            month: 'short',
            year:  'numeric'
        });
    }

    async function cargarProductos(){
        try {
            const respuesta = await fetch('/productos', { cache: 'no-store' });
            if(!respuesta.ok) throw new Error('Error al obtener productos');
            const data = await respuesta.json();
            productos = data.map(p => ({
                id:       p.id_producto,
                nombre:   p.nombre,
                tipo:     p.tipo,
                estado:   p.estado,
                img:      `/img/productos/${p.imagen}`,
                // ✅ La columna en BD se llama "fecha" (antes motivo_baja)
                registro: formatearFecha(p.fecha)
            }));
            renderTabla();
        } catch(error){
            console.error('Error cargando productos:', error);
            UIAlert.toast('Error al cargar productos.', 'error');
        }
    }

    const FILAS_POR_PAGINA = 5;
    let busqueda = "", filtroTipo = "todos", filtroEstado = "todos";
    let paginaActual = 1;

    const tabla        = document.getElementById('tablaProductos');
    const emptyState   = document.getElementById('emptyState');
    const paginacion   = document.getElementById('paginacion');
    const inputBuscar  = document.getElementById('buscarProducto');
    const selectTipo   = document.getElementById('filtroTipo');
    const selectEstado = document.getElementById('filtroEstado');

    function actualizarStats(){
        document.getElementById('statTotal').textContent     = productos.length;
        document.getElementById('statActivos').textContent   = productos.filter(p => p.estado === 'activo').length;
        document.getElementById('statInactivos').textContent = productos.filter(p => p.estado === 'inactivo').length;
    }

    function obtenerFiltrados(){
        return productos.filter(p => {
            const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
            const coincideTipo     = filtroTipo   === 'todos' || p.tipo.toLowerCase()   === filtroTipo;
            const coincideEstado   = filtroEstado === 'todos' || p.estado.toLowerCase() === filtroEstado;
            return coincideBusqueda && coincideTipo && coincideEstado;
        });
    }

    function renderTabla(){
        const datos = obtenerFiltrados();
        const totalPaginas = Math.max(1, Math.ceil(datos.length / FILAS_POR_PAGINA));
        if(paginaActual > totalPaginas) paginaActual = totalPaginas;
        const inicio   = (paginaActual - 1) * FILAS_POR_PAGINA;
        const visibles = datos.slice(inicio, inicio + FILAS_POR_PAGINA);

        tabla.innerHTML = '';
        emptyState.style.display = visibles.length === 0 ? 'block' : 'none';

        visibles.forEach(p => {
            const badgeClase = p.estado === 'activo' ? 'badge-activo' : 'badge-inactivo';
            const badgeTexto = p.estado === 'activo' ? 'Activo' : 'Inactivo';
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${p.id}</td>
                <td>${p.nombre}</td>
                <td class="cell-img">
                    <img src="${p.img}" alt="${p.nombre}" onerror="this.src='../../img/logo_ci.png'">
                </td>
                <td>${p.tipo}</td>
                <td><span class="badge-estado ${badgeClase}">${badgeTexto}</span></td>
                <td>${p.registro}</td>
                <td class="acciones">
                    <a href="actualizar-productos.html?id=${p.id}" class="editar" title="Editar">
                        <span class="material-symbols-outlined">edit</span>
                    </a>
                    <button class="eliminar" title="Eliminar" data-id="${p.id}">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </td>
            `;
            tabla.appendChild(fila);
        });

        renderPaginacion(totalPaginas);
        actualizarStats();

        tabla.querySelectorAll('.eliminar').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = Number(btn.dataset.id);
                const producto = productos.find(p => p.id === id);

                const ok = await UIAlert.confirm({
                    icon:      'delete',
                    title:     `¿Eliminar "${producto?.nombre || 'este producto'}"?`,
                    message:   'Esta acción no se puede deshacer.',
                    btnOk:     'Eliminar',
                    btnCancel: 'Cancelar',
                    danger:    true
                });

                if(!ok) return;

                try {
                    const respuesta = await fetch(`/productos/${id}`, { method: 'DELETE' });
                    if(!respuesta.ok) throw new Error('Error al eliminar');
                    productos = productos.filter(p => p.id !== id);
                    renderTabla();
                    UIAlert.toast('Producto eliminado correctamente.', 'success');
                } catch(error){
                    console.error(error);
                    UIAlert.toast('Error al eliminar el producto.', 'error');
                }
            });
        });
    }

    function renderPaginacion(totalPaginas){
        paginacion.innerHTML = '';
        if(totalPaginas <= 1) return;
        const crearBtn = (texto, pagina, activo = false, deshabilitado = false) => {
            const btn = document.createElement('button');
            btn.textContent = texto;
            if(activo) btn.classList.add('active');
            if(deshabilitado) btn.disabled = true;
            btn.addEventListener('click', () => {
                paginaActual = pagina;
                renderTabla();
                tabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            return btn;
        };
        paginacion.appendChild(crearBtn('‹', paginaActual - 1, false, paginaActual === 1));
        let inicio = Math.max(1, paginaActual - 2);
        let fin    = Math.min(totalPaginas, inicio + 4);
        inicio     = Math.max(1, fin - 4);
        for(let i = inicio; i <= fin; i++) paginacion.appendChild(crearBtn(i, i, i === paginaActual));
        paginacion.appendChild(crearBtn('›', paginaActual + 1, false, paginaActual === totalPaginas));
    }

    inputBuscar.addEventListener('input',  () => { busqueda = inputBuscar.value; paginaActual = 1; renderTabla(); });
    selectTipo.addEventListener('change',  () => { filtroTipo = selectTipo.value; paginaActual = 1; renderTabla(); });
    selectEstado.addEventListener('change',() => { filtroEstado = selectEstado.value; paginaActual = 1; renderTabla(); });

    cargarProductos();
}


// ════════════════════════════════════════════════════════════
//  BLOQUE 2 — FORMULARIO AGREGAR / EDITAR
// ════════════════════════════════════════════════════════════

if(document.getElementById('formProducto')){

    const idProducto       = obtenerIdDeURL();
    const modoEditar       = idProducto !== null;
    const tituloFormulario = document.getElementById('tituloFormulario');
    const btnGuardar       = document.getElementById('btnGuardar');
    const formProducto     = document.getElementById('formProducto');

    initImagenPrincipal('imagenPrincipal', 'inputImagenPrincipal');
    initGaleriaExtra('galeriaExtra', 'inputGaleria', 5);

    if(modoEditar){
        tituloFormulario.textContent = 'Editar Producto';
        btnGuardar.innerHTML = `<span class="material-symbols-outlined">save</span> Actualizar`;
        btnGuardar.disabled = true;
        btnGuardar.style.opacity = '0.6';

        fetch(`/productos/${idProducto}`, { cache: 'no-store' })
            .then(res => {
                if(!res.ok) throw new Error('Producto no encontrado');
                return res.json();
            })
            .then(p => {
                cargarDatosProducto(p);
                btnGuardar.disabled = false;
                btnGuardar.style.opacity = '1';
            })
            .catch(err => {
                console.error(err);
                UIAlert.toast('No se pudo cargar el producto.', 'error');
            });
    } else {
        tituloFormulario.textContent = 'Agregar Nuevo Producto';
    }

    function cargarDatosProducto(p){
        document.getElementById('nombre').value           = p.nombre           || '';
        document.getElementById('tipo').value             = p.tipo             || '';
        document.getElementById('descripcion').value      = p.descripcion      || '';
        document.getElementById('descripcionCorta').value = p.descripcion_corta || '';

        const radioEstado = document.querySelector(`input[name="estado"][value="${p.estado}"]`);
        if(radioEstado) radioEstado.checked = true;

        if(p.imagen){
            const box         = document.getElementById('imagenPrincipal');
            const placeholder = box.querySelector('.placeholder');
            let img           = box.querySelector('img');
            if(!img){ img = document.createElement('img'); box.appendChild(img); }
            img.src     = `/img/productos/${p.imagen}`;
            img.onerror = () => { img.src = '../../img/logo_ci.png'; };
            if(placeholder) placeholder.style.display = 'none';
        }

        if(Array.isArray(p.galeria) && p.galeria.length > 0){
            const galeria = document.getElementById('galeriaExtra');
            const trigger = galeria.querySelector('.agregar-imagenes');
            p.galeria.forEach(item => {
                const div      = document.createElement('div');
                div.className  = 'galeria-item';
                div.dataset.idImagen = item.id; // 👈 necesario para editar/eliminar en el servidor

                const img      = document.createElement('img');
                img.src        = `/img/productos/${item.imagen}`;
                img.onerror    = () => { img.src = '../../img/logo_ci.png'; };

                const btnRemove     = document.createElement('button');
                btnRemove.type      = 'button';
                btnRemove.className = 'remove-img';
                btnRemove.innerHTML = '&times;';
                btnRemove.addEventListener('click', async () => {
                    const ok = await UIAlert.confirm({
                        icon: 'delete',
                        iconType: 'danger',
                        title: '¿Eliminar esta imagen?',
                        message: 'Esta acción no se puede deshacer.',
                        btnOk: 'Eliminar',
                        btnCancel: 'Cancelar',
                        danger: true
                    });
                    if(!ok) return;

                    try {
                        const res = await fetch(`/productos/galeria/${div.dataset.idImagen}`, {
                        method: 'DELETE',
                        credentials: 'include'
                        });
                        if(!res.ok) throw new Error('Error al eliminar');
                        div.remove();
                        UIAlert.toast('Imagen eliminada correctamente.', 'success');
                    } catch(err){
                        console.error(err);
                        UIAlert.toast('No se pudo eliminar la imagen.', 'error');
                    }
                });

                const desc       = document.createElement('input');
                desc.type        = 'text';
                desc.className   = 'galeria-desc';
                desc.placeholder = 'Ej. Presentación 1 litro';
                desc.maxLength   = 80;
                desc.value       = item.descripcion || '';

                div.appendChild(img);
                div.appendChild(btnRemove);
                div.appendChild(desc);
                galeria.insertBefore(div, trigger);
            });
        }
    }

    formProducto.addEventListener('submit', async (e) => {
        e.preventDefault();

        const datos = {
            nombre:           document.getElementById('nombre').value.trim(),
            tipo:             document.getElementById('tipo').value,
            descripcion:      document.getElementById('descripcion').value.trim(),
            descripcionCorta: document.getElementById('descripcionCorta').value.trim(),
            estado:           document.querySelector('input[name="estado"]:checked').value
        };

        if(!datos.nombre || !datos.tipo || !datos.descripcion){
            UIAlert.toast('Completa todos los campos obligatorios.', 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('nombre',            datos.nombre);
        formData.append('descripcion',       datos.descripcion);
        formData.append('descripcion_corta', datos.descripcionCorta);
        formData.append('tipo',              datos.tipo);
        formData.append('estado',            datos.estado);

        if(!modoEditar){
            const hoy = new Date().toISOString().split('T')[0];
            formData.append('fecha', hoy);
        }

        const inputImgPrincipal = document.getElementById('inputImagenPrincipal');
        if(inputImgPrincipal.files[0]) formData.append('imagen', inputImgPrincipal.files[0]);

        // ── Separamos: imágenes NUEVAS (con archivo) vs EXISTENTES (solo su descripción puede cambiar)
        const galeriaItems = document.querySelectorAll('#galeriaExtra .galeria-item');
        const actualizacionesExistentes = [];
        let indiceArchivoNuevo = 0; // 👈 contador independiente, solo cuenta archivos reales

        galeriaItems.forEach(item => {
            const img      = item.querySelector('img');
            const desc     = item.querySelector('.galeria-desc');
            const idImagen = item.dataset.idImagen;

            if(img && img._file){
                // Imagen nueva → se sube junto con el resto del formulario
                formData.append('galeria', img._file);
                formData.append(`galeria_desc_${indiceArchivoNuevo}`, desc ? desc.value.trim() : '');
                indiceArchivoNuevo++;
            } else if(idImagen){
                // Imagen que ya existía → solo actualizamos su descripción, aparte
                actualizacionesExistentes.push({ idImagen, descripcion: desc ? desc.value.trim() : '' });
            }
        });

        const url    = modoEditar ? `/productos/${idProducto}` : '/productos';
        const metodo = modoEditar ? 'PUT' : 'POST';

        try {
            const respuesta = await fetch(url, { 
    method: metodo, 
    credentials: 'include',
    body: formData 
});
            if(!respuesta.ok) throw new Error('Error al guardar');

            // Guardamos las descripciones editadas de imágenes que ya existían
            await Promise.all(
    actualizacionesExistentes.map(({ idImagen, descripcion }) =>
        fetch(`/productos/galeria/${idImagen}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ descripcion })
        })
    )
);

            await UIAlert.alert({
                icon:    'check_circle',
                iconType:'success',
                title:   modoEditar ? 'Producto actualizado' : 'Producto agregado',
                message: modoEditar
                    ? 'Los cambios se guardaron correctamente.'
                    : 'El producto fue registrado en el catálogo.',
                btnOk:   'Aceptar'
            });

            window.location.href = 'productos.html';

        } catch(error){
            console.error(error);
            UIAlert.toast('Ocurrió un error al guardar el producto.', 'error');
        }
    });
}