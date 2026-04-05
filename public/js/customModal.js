/**
 * Sistema de modales personalizados
 * Reemplaza alert() y confirm() nativos sin perder foco
 */

// Referencias al modal
const modal = document.getElementById('customModal');
const modalTitle = document.getElementById('customModalTitle');
const modalMessage = document.getElementById('customModalMessage');
const modalConfirm = document.getElementById('customModalConfirm');
const modalCancel = document.getElementById('customModalCancel');

let modalResolve = null;
let toastContainer = null;

function ensureToastContainer() {
    if (toastContainer && document.body.contains(toastContainer)) return toastContainer;

    toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        toastContainer.setAttribute('role', 'status');
        toastContainer.setAttribute('aria-live', 'polite');
        toastContainer.setAttribute('aria-atomic', 'false');
        document.body.appendChild(toastContainer);
    }
    return toastContainer;
}

window.showToast = function(message, type = 'info', duration = 2600) {
    if (!message) return;

    const container = ensureToastContainer();
    const toast = document.createElement('div');
    const safeType = ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info';
    toast.className = `toast toast-${safeType}`;
    toast.setAttribute('role', safeType === 'error' ? 'alert' : 'status');
    toast.setAttribute('aria-live', safeType === 'error' ? 'assertive' : 'polite');

    const iconMap = {
        success: 'fa-circle-check',
        error: 'fa-circle-xmark',
        warning: 'fa-triangle-exclamation',
        info: 'fa-circle-info'
    };

    toast.innerHTML = `
        <i class="fas ${iconMap[safeType]}" aria-hidden="true"></i>
        <span>${String(message)}</span>
        <button type="button" class="toast-close" aria-label="Cerrar">
            <i class="fas fa-xmark" aria-hidden="true"></i>
        </button>
    `;

    const closeToast = () => {
        toast.classList.add('is-leaving');
        setTimeout(() => {
            toast.remove();
        }, 180);
    };

    toast.querySelector('.toast-close')?.addEventListener('click', closeToast);

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    setTimeout(closeToast, Math.max(1200, Number(duration) || 2600));
};

window.notifySuccess = function(message) {
    window.showToast(message, 'success');
};

window.notifyError = function(message) {
    window.showToast(message, 'error', 3200);
};

window.notifyInfo = function(message) {
    window.showToast(message, 'info');
};

if (modal) {
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'customModalTitle');
    modal.setAttribute('aria-describedby', 'customModalMessage');
}

/**
 * Función para mostrar alertas personalizadas
 * @param {string} message - Mensaje a mostrar
 * @param {string} title - Título del modal (opcional)
 * @returns {Promise<void>}
 */
window.showAlert = function(message, title = 'Información') {
    return new Promise((resolve) => {
        modalResolve = resolve;
        
        // Traducir título si es posible
        if (typeof gestorIdiomas !== 'undefined') {
            if (title === 'Información') {
                title = gestorIdiomas.obtenerTexto('modal.informacion') || 'Información';
            } else if (title === 'Error') {
                title = gestorIdiomas.obtenerTexto('modal.error') || 'Error';
            } else if (title === 'Advertencia') {
                title = gestorIdiomas.obtenerTexto('modal.advertencia') || 'Advertencia';
            }
        }
        
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalConfirm.textContent = typeof gestorIdiomas !== 'undefined' 
            ? gestorIdiomas.obtenerTexto('formularios.aceptar') || 'Aceptar'
            : 'Aceptar';
        modalCancel.style.display = 'none';
        
        modal.classList.add('show');
        modalConfirm.focus();
    });
};

/**
 * Función para mostrar confirmaciones personalizadas
 * @param {string} message - Mensaje a mostrar
 * @param {string} title - Título del modal (opcional)
 * @returns {Promise<boolean>} true si acepta, false si cancela
 */
window.showConfirm = function(message, title = 'Confirmar') {
    return new Promise((resolve) => {
        modalResolve = resolve;
        
        // Traducir título si es posible
        if (typeof gestorIdiomas !== 'undefined') {
            if (title === 'Confirmar') {
                title = gestorIdiomas.obtenerTexto('modal.confirmar') || 'Confirmar';
            }
        }
        
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalConfirm.textContent = typeof gestorIdiomas !== 'undefined'
            ? gestorIdiomas.obtenerTexto('formularios.si') || 'Sí'
            : 'Sí';
        modalCancel.textContent = typeof gestorIdiomas !== 'undefined'
            ? gestorIdiomas.obtenerTexto('formularios.no') || 'No'
            : 'No';
        modalCancel.style.display = 'inline-block';
        
        modal.classList.add('show');
        modalConfirm.focus();
    });
};

// Cerrar modal
function closeModal() {
    modal.classList.remove('show');
}

// Eventos de botones
modalConfirm.addEventListener('click', () => {
    closeModal();
    if (modalResolve) {
        modalResolve(true);
        modalResolve = null;
    }
});

modalCancel.addEventListener('click', () => {
    closeModal();
    if (modalResolve) {
        modalResolve(false);
        modalResolve = null;
    }
});

// Cerrar al hacer click fuera del modal
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
        if (modalResolve) {
            modalResolve(false);
            modalResolve = null;
        }
    }
});

// Soporte para tecla Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
        closeModal();
        if (modalResolve) {
            modalResolve(false);
            modalResolve = null;
        }
    }
    // Enter para confirmar
    if (e.key === 'Enter' && modal.classList.contains('show')) {
        closeModal();
        if (modalResolve) {
            modalResolve(true);
            modalResolve = null;
        }
    }
});

// Reemplazar alert y confirm nativos (opcional, comentado por defecto)
// Descomenta las siguientes líneas si quieres que alert() y confirm() usen automáticamente los modales
/*
window.alert = async function(message) {
    await showAlert(message);
};

window.confirm = async function(message) {
    return await showConfirm(message);
};
*/

console.log('✅ Sistema de modales personalizados cargado');
