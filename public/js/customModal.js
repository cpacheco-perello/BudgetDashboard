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
