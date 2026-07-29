const UIAlert = (() => {

    // ─── INYECTAR ESTILOS ─────────────────────────────────────
    const style = document.createElement('style');
    style.textContent = `

    /* ── TOAST ── */

    #ui-toast-container {
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 99999;
        display: flex;
        flex-direction: column-reverse;
        align-items: center;
        gap: 10px;
        pointer-events: none;
    }

    .ui-toast {
        display: flex;
        align-items: center;
        gap: 12px;

        background: white;
        border-radius: 14px;
        padding: 14px 22px;
        min-width: 280px;
        max-width: 420px;

        box-shadow: 0 8px 28px rgba(0,0,0,0.15);
        pointer-events: auto;

        font-size: 15px;
        font-weight: 600;
        color: #222;

        border-left: 5px solid #026432;

        animation: toastIn .35s cubic-bezier(.22,1,.36,1) forwards;
    }

    .ui-toast.hide {
        animation: toastOut .3s ease forwards;
    }

    .ui-toast .ui-toast-icon {
        font-size: 24px;
        flex-shrink: 0;
    }

    .ui-toast.success { border-color: #026432; }
    .ui-toast.success .ui-toast-icon { color: #026432; }

    .ui-toast.error   { border-color: #e53935; }
    .ui-toast.error   .ui-toast-icon { color: #e53935; }

    .ui-toast.warning { border-color: #f9a825; }
    .ui-toast.warning .ui-toast-icon { color: #f9a825; }

    .ui-toast.info    { border-color: #1a56db; }
    .ui-toast.info    .ui-toast-icon { color: #1a56db; }

    @keyframes toastIn {
        from { opacity: 0; transform: translateY(30px) scale(.95); }
        to   { opacity: 1; transform: translateY(0)    scale(1);   }
    }

    @keyframes toastOut {
        from { opacity: 1; transform: translateY(0)    scale(1);   }
        to   { opacity: 0; transform: translateY(30px) scale(.95); }
    }

    /* ── MODAL ── */

    .ui-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.55);
        z-index: 99998;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        padding-bottom: 40px;
        opacity: 0;
        animation: overlayIn .25s ease forwards;
    }

    .ui-modal-overlay.closing {
        animation: overlayOut .25s ease forwards;
    }

    @keyframes overlayIn  { to   { opacity: 1; } }
    @keyframes overlayOut { from { opacity: 1; } to { opacity: 0; } }

    .ui-modal {
        background: white;
        border-radius: 22px 22px 0 0;
        padding: 36px 32px 32px;
        width: 100%;
        max-width: 440px;
        text-align: center;
        box-shadow: 0 -8px 40px rgba(0,0,0,0.18);

        transform: translateY(100%);
        animation: modalSlideIn .35s cubic-bezier(.22,1,.36,1) forwards;
    }

    .ui-modal-overlay.closing .ui-modal {
        animation: modalSlideOut .28s ease forwards;
    }

    @keyframes modalSlideIn {
        from { transform: translateY(100%); }
        to   { transform: translateY(0);    }
    }

    @keyframes modalSlideOut {
        from { transform: translateY(0);    }
        to   { transform: translateY(100%); }
    }

    /* Línea decorativa superior */
    .ui-modal::before {
        content: "";
        display: block;
        width: 48px;
        height: 5px;
        background: #e0e0e0;
        border-radius: 10px;
        margin: 0 auto 28px;
    }

    .ui-modal-icon-wrap {
        width: 68px;
        height: 68px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 18px;
        font-size: 34px;
    }

    .ui-modal-icon-wrap.success { background: #E6F4EA; color: #026432; }
    .ui-modal-icon-wrap.error   { background: #FCE8E6; color: #e53935; }
    .ui-modal-icon-wrap.warning { background: #FFF6E0; color: #f9a825; }
    .ui-modal-icon-wrap.info    { background: #E8F0FE; color: #1a56db; }
    .ui-modal-icon-wrap.danger  { background: #FCE8E6; color: #e53935; }
    .ui-modal-icon-wrap.default { background: #E1F0E8; color: #026432; }

    .ui-modal h2 {
        font-size: 20px;
        color: #111;
        margin-bottom: 10px;
        line-height: 1.4;
    }

    .ui-modal p {
        font-size: 14px;
        color: #777;
        margin-bottom: 28px;
        line-height: 1.6;
    }

    .ui-modal-buttons {
        display: flex;
        gap: 12px;
        justify-content: center;
    }

    .ui-btn {
        flex: 1;
        padding: 13px 20px;
        border: none;
        border-radius: 12px;
        font-size: 15px;
        font-weight: bold;
        cursor: pointer;
        transition: .3s;
        max-width: 180px;
    }

    .ui-btn-cancel {
        background: #f0f0f0;
        color: #000000;
    }
    .ui-btn-cancel:hover { background: #e0e0e0; }

    .ui-btn-ok {
        background: #026432;
        color: white;
    }
    .ui-btn-ok:hover { background: #014d27; }

    .ui-btn-ok.danger {
        background: #e53935;
    }
    .ui-btn-ok.danger:hover { background: #b71c1c; }

    `;
    document.head.appendChild(style);

    // ─── TOAST CONTAINER ─────────────────────────────────────
    const toastContainer = document.createElement('div');
    toastContainer.id = 'ui-toast-container';
    document.body.appendChild(toastContainer);

    // ─── ICONOS POR TIPO ─────────────────────────────────────
    const ICONS = {
        success: 'check_circle',
        error:   'error',
        warning: 'warning',
        info:    'info',
        danger:  'delete',
        default: 'notifications'
    };

    // ─── TEXTOS PARA ENTIDADES ────────────────────────────────
    const TEXTOS_ENTIDADES = {
        producto: {
            agregar: {
                titulo: 'Producto agregado',
                mensaje: 'El producto fue publicado correctamente.'
            },
            editar: {
                titulo: 'Producto actualizado',
                mensaje: 'Los cambios se guardaron correctamente.'
            }
        },
        vacante: {
            agregar: {
                titulo: 'Vacante agregada',
                mensaje: 'La vacante fue publicada correctamente.'
            },
            editar: {
                titulo: 'Vacante actualizada',
                mensaje: 'Los cambios se guardaron correctamente.'
            }
        },
        noticia: {
            agregar: {
                titulo: 'Noticia agregada',
                mensaje: 'La noticia fue publicada correctamente.'
            },
            editar: {
                titulo: 'Noticia actualizada',
                mensaje: 'Los cambios se guardaron correctamente.'
            }
        }
    };

    // ─── TOAST ───────────────────────────────────────────────
    function toast(message, type = 'success', duration = 3500){

        const icon = ICONS[type] || ICONS.default;

        const el = document.createElement('div');
        el.className = `ui-toast ${type}`;
        el.innerHTML = `
            <span class="material-symbols-outlined ui-toast-icon">${icon}</span>
            <span>${message}</span>
        `;

        toastContainer.appendChild(el);

        setTimeout(() => {
            el.classList.add('hide');
            el.addEventListener('animationend', () => el.remove());
        }, duration);
    }

    // ─── MODAL BASE ──────────────────────────────────────────
    function createModal({ icon, iconType = 'default', title, message, btnOk = 'Aceptar', btnCancel = null, danger = false }){

        const overlay = document.createElement('div');
        overlay.className = 'ui-modal-overlay';

        const colorClass = danger ? 'danger' : iconType;

        overlay.innerHTML = `
            <div class="ui-modal">
                <div class="ui-modal-icon-wrap ${colorClass}">
                    <span class="material-symbols-outlined">${icon || 'notifications'}</span>
                </div>
                <h2>${title}</h2>
                ${message ? `<p>${message}</p>` : ''}
                <div class="ui-modal-buttons">
                    ${btnCancel ? `<button class="ui-btn ui-btn-cancel">${btnCancel}</button>` : ''}
                    <button class="ui-btn ui-btn-ok ${danger ? 'danger' : ''}">${btnOk}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // ✅ Función para cerrar con animación
        function close(){
            overlay.classList.add('closing');
            
            return new Promise(resolve => {
                let resolved = false;
                
                const handleAnimationEnd = () => {
                    if(resolved) return;
                    resolved = true;
                    overlay.removeEventListener('animationend', handleAnimationEnd);
                    clearTimeout(timeoutId);
                    if(overlay.parentElement) overlay.remove();
                    resolve();
                };
                
                overlay.addEventListener('animationend', handleAnimationEnd, { once: true });
                
                // Fallback: si la animación no se dispara, resolver después de 300ms
                const timeoutId = setTimeout(() => {
                    if(resolved) return;
                    resolved = true;
                    overlay.removeEventListener('animationend', handleAnimationEnd);
                    if(overlay.parentElement) overlay.remove();
                    resolve();
                }, 300);
            });
        }

        return { overlay, close };
    }

    // ─── ALERT (solo OK) ─────────────────────────────────────
    function alert({ icon, iconType, title, message, btnOk = 'Aceptar' }){
        return new Promise(resolve => {
            const { overlay, close } = createModal({ icon, iconType, title, message, btnOk });
            
            // ✅ IMPORTANTE: Buscar después de que el elemento esté en el DOM
            setTimeout(() => {
                const btnOkEl = overlay.querySelector('.ui-btn-ok');
                
                if(!btnOkEl){
                    console.error('❌ No se encontró el botón OK');
                    resolve();
                    return;
                }
                
                const handleClick = async () => {
                    btnOkEl.removeEventListener('click', handleClick);
                    document.removeEventListener('keydown', handleKeydown);
                    await close();
                    resolve();
                };
                
                const handleKeydown = (e) => {
                    if(e.key === 'Enter'){
                        e.preventDefault();
                        handleClick();
                    }
                };
                
                btnOkEl.addEventListener('click', handleClick, { once: false });
                document.addEventListener('keydown', handleKeydown);
                
                // Auto-focus en el botón para que Enter funcione
                btnOkEl.focus();
                
            }, 0);
        });
    }

    // ─── CONFIRM (Cancel + OK) ────────────────────────────────
    function confirm({ icon, iconType, title, message, btnOk = 'Confirmar', btnCancel = 'Cancelar', danger = false }){
        return new Promise(resolve => {
            const { overlay, close } = createModal({ icon, iconType, title, message, btnOk, btnCancel, danger });
            
            // ✅ IMPORTANTE: Buscar después de que el elemento esté en el DOM
            setTimeout(() => {
                const btnOkEl = overlay.querySelector('.ui-btn-ok');
                const btnCancelEl = overlay.querySelector('.ui-btn-cancel');

                if(!btnOkEl || !btnCancelEl){
                    console.error('❌ No se encontraron los botones');
                    resolve(false);
                    return;
                }

                let handled = false;

                const handleOk = async () => {
                    if(handled) return;
                    handled = true;
                    btnOkEl.removeEventListener('click', handleOk);
                    btnCancelEl.removeEventListener('click', handleCancel);
                    document.removeEventListener('keydown', handleKeydown);
                    await close();
                    resolve(true);
                };

                const handleCancel = async () => {
                    if(handled) return;
                    handled = true;
                    btnCancelEl.removeEventListener('click', handleCancel);
                    btnOkEl.removeEventListener('click', handleOk);
                    document.removeEventListener('keydown', handleKeydown);
                    await close();
                    resolve(false);
                };
                
                const handleKeydown = (e) => {
                    if(e.key === 'Enter') {
                        e.preventDefault();
                        handleOk();
                    }
                    if(e.key === 'Escape') {
                        e.preventDefault();
                        handleCancel();
                    }
                };

                btnOkEl.addEventListener('click', handleOk);
                btnCancelEl.addEventListener('click', handleCancel);
                document.addEventListener('keydown', handleKeydown);
                
                // Auto-focus en el botón OK
                btnOkEl.focus();
                
            }, 0);
        });
    }

    // ─── DELETE (Modal de eliminación estándar) ────────────────
    /**
     * Modal para confirmar eliminación de entidades
     * @param {string} tipo - 'producto', 'vacante', 'noticia' o 'postulación'
     * @param {string} nombre - Nombre/identificador de lo que se va a eliminar
     * @returns {Promise<boolean>} true si confirma, false si cancela
     */
    function deleteItem(tipo, nombre){
        return confirm({
            icon: 'delete',
            iconType: 'danger',
            title: `¿Eliminar "${nombre}"?`,
            message: 'Esta acción no se puede deshacer.',
            btnOk: 'Eliminar',
            btnCancel: 'Cancelar',
            danger: true
        });
    }

    // ─── SUCCESS (Alerta genérica para crear/actualizar entidades) ────
    /**
     * Muestra una alerta de éxito personalizada para crear o actualizar entidades
     * @param {string} tipo - 'producto', 'vacante' o 'noticia'
     * @param {boolean} esEdicion - true si es actualización, false si es creación
     * @returns {Promise}
     */
    function success(tipo, esEdicion = false){
        const config = TEXTOS_ENTIDADES[tipo];
        
        if(!config){
            console.warn(`⚠️ Tipo de entidad no reconocido: ${tipo}`);
            return alert({
                icon: 'check_circle',
                iconType: 'success',
                title: 'Operación exitosa',
                message: 'Los datos se guardaron correctamente.',
                btnOk: 'Aceptar'
            });
        }

        const modo = esEdicion ? 'editar' : 'agregar';
        const { titulo, mensaje } = config[modo];

        return alert({
            icon: 'check_circle',
            iconType: 'success',
            title: titulo,
            message: mensaje,
            btnOk: 'Aceptar'
        });
    }

    // ─── POSTULATION SUCCESS ────────────────────────────────────
    /**
     * Muestra modal de éxito de postulación
     * @returns {Promise}
     * 
     * Uso:
     * await UIAlert.postulationSuccess();
     */
    function postulationSuccess(){
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = 'ui-modal-overlay';

            overlay.innerHTML = `
                <div class="ui-modal">
                    <div class="ui-modal-icon-wrap success">
                        <span class="material-symbols-outlined">mail</span>
                    </div>
                    <h2>¡Postulación enviada!</h2>
                    <p>Tu información fue recibida correctamente. Nos pondremos en contacto contigo si tu perfil es seleccionado.</p>
                    <p style="font-size:13px; color:#666; font-weight:600; margin-top:20px;">¡Gracias por tu interés en formar parte de nuestro equipo!</p>
                    <div class="ui-modal-buttons" style="margin-top:28px;">
                        <button class="ui-btn ui-btn-ok" style="max-width:100%;">Aceptar</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // ✅ Función para cerrar con animación
            function close(){
                overlay.classList.add('closing');
                
                return new Promise(res => {
                    let resolved = false;
                    
                    const handleAnimationEnd = () => {
                        if(resolved) return;
                        resolved = true;
                        overlay.removeEventListener('animationend', handleAnimationEnd);
                        clearTimeout(timeoutId);
                        if(overlay.parentElement) overlay.remove();
                        res();
                    };
                    
                    overlay.addEventListener('animationend', handleAnimationEnd, { once: true });
                    
                    const timeoutId = setTimeout(() => {
                        if(resolved) return;
                        resolved = true;
                        overlay.removeEventListener('animationend', handleAnimationEnd);
                        if(overlay.parentElement) overlay.remove();
                        res();
                    }, 300);
                });
            }

            // ✅ Buscar botón después de renderizar
            setTimeout(() => {
                const btnOk = overlay.querySelector('.ui-btn-ok');
                
                if(!btnOk){
                    console.error('❌ No se encontró el botón de postulación');
                    resolve();
                    return;
                }

                const handleClick = async () => {
                    btnOk.removeEventListener('click', handleClick);
                    document.removeEventListener('keydown', handleKeydown);
                    await close();
                    resolve();
                };

                const handleKeydown = (e) => {
                    if(e.key === 'Enter'){
                        e.preventDefault();
                        handleClick();
                    }
                };

                btnOk.addEventListener('click', handleClick);
                document.addEventListener('keydown', handleKeydown);
                btnOk.focus();
                
            }, 0);
        });
    }

    return { toast, alert, confirm, success, delete: deleteItem, postulationSuccess };

})();