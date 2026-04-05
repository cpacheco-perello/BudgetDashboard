/**
 * CONFIGURACIÓN CENTRALIZADA DE TEMAS
 * Estructura estándar para todos los temas:
 * - primary: color principal
 * - primaryDark: variante oscura del principal
 * - success: color de éxito
 * - danger: color de error
 * - dangerDark: variante oscura del error
 * - warning: color de advertencia
 * - info: color de información
 * - light: color claro/fondo
 * - bgPrimary: fondo con opacidad del color principal
 * - bgPrimaryDark: fondo con opacidad del color principal oscuro
 * - nombre: nombre visible del tema
 */
const TEMAS = {
    // ===== TEMAS ORIGINALES =====
    
    azul: {
        primary: '#0066cc',
        primaryDark: '#0052a3',
        success: '#00b368',
        danger: '#ff5252',
        dangerDark: '#ff1744',
        warning: '#ffc107',
        info: '#00b0ff',
        light: '#f5f5f5',
        bgPrimary: 'rgba(0, 102, 204, 0.08)',
        bgPrimaryDark: 'rgba(0, 82, 163, 0.12)',
        nombre: 'Azul Profesional'
    },

    verde: {
        primary: '#16a34a',
        primaryDark: '#15803d',
        success: '#22c55e',
        danger: '#ef4444',
        dangerDark: '#dc2626',
        warning: '#eab308',
        info: '#06b6d4',
        light: '#f8fafc',
        bgPrimary: 'rgba(22, 163, 74, 0.08)',
        bgPrimaryDark: 'rgba(21, 128, 61, 0.12)',
        nombre: 'Verde Moderno'
    },

    naranja: {
        primary: '#ea580c',
        primaryDark: '#c2410c',
        success: '#10b981',
        danger: '#f97316',
        dangerDark: '#ea580c',
        warning: '#f59e0b',
        info: '#3b82f6',
        light: '#fafaf9',
        bgPrimary: 'rgba(234, 88, 12, 0.08)',
        bgPrimaryDark: 'rgba(194, 65, 12, 0.12)',
        nombre: 'Naranja Energético'
    },

    turquesa: {
        primary: '#06b6d4',
        primaryDark: '#0891b2',
        success: '#10b981',
        danger: '#ef4444',
        dangerDark: '#dc2626',
        warning: '#f59e0b',
        info: '#3b82f6',
        light: '#f0f9fa',
        bgPrimary: 'rgba(6, 182, 212, 0.08)',
        bgPrimaryDark: 'rgba(8, 145, 178, 0.12)',
        nombre: 'Turquesa Fresco'
    },

    purpura: {
        primary: '#a855f7',
        primaryDark: '#9333ea',
        success: '#10b981',
        danger: '#ef4444',
        dangerDark: '#dc2626',
        warning: '#f59e0b',
        info: '#06b6d4',
        light: '#faf5ff',
        bgPrimary: 'rgba(168, 85, 247, 0.08)',
        bgPrimaryDark: 'rgba(147, 51, 234, 0.12)',
        nombre: 'Púrpura Moderno'
    },

    rojo: {
        primary: '#dc2626',
        primaryDark: '#b91c1c',
        success: '#16a34a',
        danger: '#ef4444',
        dangerDark: '#dc2626',
        warning: '#f59e0b',
        info: '#3b82f6',
        light: '#fef2f2',
        bgPrimary: 'rgba(220, 38, 38, 0.08)',
        bgPrimaryDark: 'rgba(185, 28, 28, 0.12)',
        nombre: 'Rojo Elegante'
    },

    indigo: {
        primary: '#4f46e5',
        primaryDark: '#4338ca',
        success: '#10b981',
        danger: '#ef4444',
        dangerDark: '#dc2626',
        warning: '#f59e0b',
        info: '#06b6d4',
        light: '#f4f3ff',
        bgPrimary: 'rgba(79, 70, 229, 0.08)',
        bgPrimaryDark: 'rgba(67, 56, 202, 0.12)',
        nombre: 'Índigo Suave'
    },

    teal: {
        primary: '#0d9488',
        primaryDark: '#115e59',
        success: '#059669',
        danger: '#ef4444',
        dangerDark: '#dc2626',
        warning: '#f59e0b',
        info: '#3b82f6',
        light: '#f0fdf4',
        bgPrimary: 'rgba(13, 148, 136, 0.08)',
        bgPrimaryDark: 'rgba(17, 94, 89, 0.12)',
        nombre: 'Teal Profesional'
    },

    gris: {
        primary: '#1f2937',
        primaryDark: '#111827',
        success: '#10b981',
        danger: '#ef4444',
        dangerDark: '#dc2626',
        warning: '#f59e0b',
        info: '#3b82f6',
        light: '#f9fafb',
        bgPrimary: 'rgba(31, 41, 55, 0.08)',
        bgPrimaryDark: 'rgba(17, 24, 39, 0.12)',
        nombre: 'Gris Corporativo'
    },

    rosado: {
        primary: '#ec4899',
        primaryDark: '#be185d',
        success: '#10b981',
        danger: '#ef4444',
        dangerDark: '#dc2626',
        warning: '#f59e0b',
        info: '#06b6d4',
        light: '#fdf2f8',
        bgPrimary: 'rgba(236, 72, 153, 0.08)',
        bgPrimaryDark: 'rgba(190, 24, 93, 0.12)',
        nombre: 'Rosado Moderno'
    },

    // ===== TEMAS ADICIONALES =====

    cian: {
        primary: '#0891b2',
        primaryDark: '#0e7490',
        success: '#06b6d4',
        danger: '#f97316',
        dangerDark: '#ea580c',
        warning: '#fbbf24',
        info: '#3b82f6',
        light: '#ecf0f1',
        bgPrimary: 'rgba(8, 145, 178, 0.08)',
        bgPrimaryDark: 'rgba(14, 116, 144, 0.12)',
        nombre: 'Cian Vibrante'
    },

    lima: {
        primary: '#84cc16',
        primaryDark: '#65a30d',
        success: '#22c55e',
        danger: '#ef4444',
        dangerDark: '#dc2626',
        warning: '#f59e0b',
        info: '#06b6d4',
        light: '#f7fee7',
        bgPrimary: 'rgba(132, 204, 22, 0.08)',
        bgPrimaryDark: 'rgba(101, 163, 13, 0.12)',
        nombre: 'Lima Fresco'
    },

    esmeralda: {
        primary: '#059669',
        primaryDark: '#047857',
        success: '#10b981',
        danger: '#f87171',
        dangerDark: '#ef4444',
        warning: '#fbbf24',
        info: '#60a5fa',
        light: '#ecfdf5',
        bgPrimary: 'rgba(5, 150, 105, 0.08)',
        bgPrimaryDark: 'rgba(4, 120, 87, 0.12)',
        nombre: 'Esmeralda Premium'
    },

    ambar: {
        primary: '#d97706',
        primaryDark: '#b45309',
        success: '#10b981',
        danger: '#ef4444',
        dangerDark: '#dc2626',
        warning: '#f59e0b',
        info: '#3b82f6',
        light: '#fffbeb',
        bgPrimary: 'rgba(217, 119, 6, 0.08)',
        bgPrimaryDark: 'rgba(180, 83, 9, 0.12)',
        nombre: 'Ámbar Dorado'
    },

    violeta: {
        primary: '#7c3aed',
        primaryDark: '#6d28d9',
        success: '#10b981',
        danger: '#ef4444',
        dangerDark: '#dc2626',
        warning: '#f59e0b',
        info: '#06b6d4',
        light: '#f5f3ff',
        bgPrimary: 'rgba(124, 58, 237, 0.08)',
        bgPrimaryDark: 'rgba(109, 40, 217, 0.12)',
        nombre: 'Violeta Místico'
    },

    fresa: {
        primary: '#f43f5e',
        primaryDark: '#e11d48',
        success: '#16a34a',
        danger: '#ef4444',
        dangerDark: '#dc2626',
        warning: '#f59e0b',
        info: '#3b82f6',
        light: '#ffe4e6',
        bgPrimary: 'rgba(244, 63, 94, 0.08)',
        bgPrimaryDark: 'rgba(225, 29, 72, 0.12)',
        nombre: 'Fresa Rosa'
    },

    oceano: {
        primary: '#1e40af',
        primaryDark: '#1e3a8a',
        success: '#059669',
        danger: '#dc2626',
        dangerDark: '#b91c1c',
        warning: '#f59e0b',
        info: '#06b6d4',
        light: '#eff6ff',
        bgPrimary: 'rgba(30, 64, 175, 0.08)',
        bgPrimaryDark: 'rgba(30, 58, 138, 0.12)',
        nombre: 'Océano Profundo'
    },

    bosque: {
        primary: '#15803d',
        primaryDark: '#14532d',
        success: '#22c55e',
        danger: '#dc2626',
        dangerDark: '#991b1b',
        warning: '#eab308',
        info: '#06b6d4',
        light: '#f0fdf4',
        bgPrimary: 'rgba(21, 128, 61, 0.08)',
        bgPrimaryDark: 'rgba(20, 83, 45, 0.12)',
        nombre: 'Bosque Verde'
    },

    atardecer: {
        primary: '#ea580c',
        primaryDark: '#b3280e',
        success: '#f59e0b',
        danger: '#dc2626',
        dangerDark: '#991b1b',
        warning: '#f97316',
        info: '#f43f5e',
        light: '#fef2f2',
        bgPrimary: 'rgba(234, 88, 12, 0.08)',
        bgPrimaryDark: 'rgba(179, 40, 14, 0.12)',
        nombre: 'Atardecer'
    },

    medianoche: {
        primary: '#0f172a',
        primaryDark: '#020617',
        success: '#10b981',
        danger: '#ef4444',
        dangerDark: '#dc2626',
        warning: '#f59e0b',
        info: '#3b82f6',
        light: '#f8fafc',
        bgPrimary: 'rgba(15, 23, 42, 0.15)',
        bgPrimaryDark: 'rgba(2, 6, 23, 0.2)',
        nombre: 'Medianoche Oscuro'
    },

    neon: {
        primary: '#ff006e',
        primaryDark: '#d9007a',
        success: '#00f5ff',
        danger: '#ff0080',
        dangerDark: '#ff006e',
        warning: '#ffbe0b',
        info: '#8338ec',
        light: '#0a0e27',
        bgPrimary: 'rgba(255, 0, 110, 0.15)',
        bgPrimaryDark: 'rgba(217, 0, 122, 0.2)',
        nombre: 'Neón Ciberpunk'
    },

    mint: {
        primary: '#14b8a6',
        primaryDark: '#0d9488',
        success: '#10b981',
        danger: '#f87171',
        dangerDark: '#ef4444',
        warning: '#fcd34d',
        info: '#67e8f9',
        light: '#f0fdfa',
        bgPrimary: 'rgba(20, 184, 166, 0.08)',
        bgPrimaryDark: 'rgba(13, 148, 136, 0.12)',
        nombre: 'Mint Suave'
    },

    coral: {
        primary: '#ff6b6b',
        primaryDark: '#d63031',
        success: '#2ecc71',
        danger: '#e74c3c',
        dangerDark: '#c0392b',
        warning: '#f39c12',
        info: '#3498db',
        light: '#ffe0dc',
        bgPrimary: 'rgba(255, 107, 107, 0.08)',
        bgPrimaryDark: 'rgba(214, 48, 49, 0.12)',
        nombre: 'Coral Tropical'
    },

    lavanda: {
        primary: '#c084fc',
        primaryDark: '#a855f7',
        success: '#10b981',
        danger: '#ef4444',
        dangerDark: '#dc2626',
        warning: '#f59e0b',
        info: '#06b6d4',
        light: '#faf5ff',
        bgPrimary: 'rgba(192, 132, 252, 0.08)',
        bgPrimaryDark: 'rgba(168, 85, 247, 0.12)',
        nombre: 'Lavanda Elegante'
    },

    grisminimal: {
        primary: '#6b7280',
        primaryDark: '#374151',
        success: '#10b981',
        danger: '#ef4444',
        dangerDark: '#dc2626',
        warning: '#f59e0b',
        info: '#3b82f6',
        light: '#f3f4f6',
        bgPrimary: 'rgba(107, 114, 128, 0.08)',
        bgPrimaryDark: 'rgba(55, 65, 81, 0.12)',
        nombre: 'Gris Minimalista'
    },

    bronce: {
        primary: '#92400e',
        primaryDark: '#78350f',
        success: '#059669',
        danger: '#ef4444',
        dangerDark: '#dc2626',
        warning: '#f59e0b',
        info: '#3b82f6',
        light: '#fefce8',
        bgPrimary: 'rgba(146, 64, 14, 0.08)',
        bgPrimaryDark: 'rgba(120, 53, 15, 0.12)',
        nombre: 'Bronce Vintage'
    },

    cielo: {
        primary: '#3b82f6',
        primaryDark: '#1d4ed8',
        success: '#10b981',
        danger: '#ef4444',
        dangerDark: '#dc2626',
        warning: '#f59e0b',
        info: '#06b6d4',
        light: '#eff6ff',
        bgPrimary: 'rgba(59, 130, 246, 0.08)',
        bgPrimaryDark: 'rgba(29, 78, 216, 0.12)',
        nombre: 'Cielo Claro'
    }
};

/**
 * Gestor centralizado de temas
 * Maneja la aplicación, cambio y persistencia de temas
 */
class GestorTemas {
    // Constantes
    static STORAGE_KEY = 'tema';
    static DEFAULT_THEME = 'verde';
    static CSS_PROPERTIES = [
        'primary',
        'primary-dark',
        'success',
        'danger',
        'danger-dark',
        'warning',
        'info',
        'light',
        'bg-primary',
        'bg-primary-dark'
    ];

    constructor() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.inicializar());
        } else {
            this.inicializar();
        }
    }

    /**
     * Inicializa el gestor de temas
     */
    inicializar() {
        // Aplicar el tema guardado siempre, independientemente de si el select existe
        this.temaActual = localStorage.getItem(GestorTemas.STORAGE_KEY) || GestorTemas.DEFAULT_THEME;
        this.aplicarTema(this.temaActual);

        // El select vive en la pestaña ajustes (carga diferida) — se vincula en initAjustes()
        this.themeSelect = document.getElementById('themeSelect');
        if (!this.themeSelect) return;

        this.themeSelect.value = this.temaActual;
        this.themeSelect.addEventListener('change', (e) => this.cambiarTema(e.target.value));
        console.log('✅ GestorTemas inicializado correctamente');
    }

    /**
     * Aplica un tema a la aplicación
     * @param {string} nombreTema - Identificador del tema
     */
    aplicarTema(nombreTema) {
        const tema = TEMAS[nombreTema];
        
        if (!tema) {
            console.error(`❌ Tema "${nombreTema}" no encontrado`);
            return;
        }

        const root = document.documentElement;

        // Aplicar todas las propiedades CSS del tema
        this._aplicarPropiedadesCss(root, tema);
        
        // Actualizar fondo del body
        document.body.style.background = `linear-gradient(135deg, ${tema.bgPrimary} 0%, ${tema.bgPrimaryDark} 100%)`;

        console.log(`🎨 Tema "${tema.nombre}" aplicado exitosamente`);
    }

    /**
     * Aplica las propiedades CSS del tema al elemento root
     * @private
     */
    _aplicarPropiedadesCss(root, tema) {
        const propiedades = {
            'primary': tema.primary,
            'primary-dark': tema.primaryDark,
            'success': tema.success,
            'danger': tema.danger,
            'danger-dark': tema.dangerDark,
            'warning': tema.warning,
            'info': tema.info,
            'light': tema.light,
            'bg-primary': tema.bgPrimary,
            'bg-primary-dark': tema.bgPrimaryDark
        };

        Object.entries(propiedades).forEach(([propiedad, valor]) => {
            root.style.setProperty(`--${propiedad}`, valor);
        });

        // Variables RGB derivadas para efectos con rgba(var(--...)).
        const primaryRgb = this._hexToRgbString(tema.primary, '22, 163, 74');
        const primaryDarkRgb = this._hexToRgbString(tema.primaryDark, '21, 128, 61');
        root.style.setProperty('--bg-primary-rgb', primaryRgb);
        root.style.setProperty('--bg-primary-dark-rgb', primaryDarkRgb);

        // Aplicar gradientes derivados del tema
        root.style.setProperty('--gradient-primary', `linear-gradient(135deg, ${tema.primary} 0%, ${tema.primaryDark} 100%)`);
        root.style.setProperty('--gradient-success', `linear-gradient(135deg, ${tema.success} 0%, rgba(34, 197, 94, 0.8) 100%)`);
        root.style.setProperty('--gradient-danger', `linear-gradient(135deg, ${tema.danger} 0%, rgba(239, 68, 68, 0.8) 100%)`);
        root.style.setProperty('--gradient-warning', `linear-gradient(135deg, ${tema.warning} 0%, rgba(245, 158, 11, 0.8) 100%)`);
        root.style.setProperty('--gradient-info', `linear-gradient(135deg, ${tema.info} 0%, #0891b2 100%)`);
        root.style.setProperty('--gradient-hucha', `linear-gradient(135deg, ${tema.info} 0%, #0369a1 100%)`);
        root.style.setProperty('--gradient-bruto', `linear-gradient(135deg, ${tema.warning} 0%, ${tema.info} 100%)`);
    }

    /**
     * Convierte un color hex a formato "r, g, b" para usar con rgba(var(--x), a)
     * @private
     */
    _hexToRgbString(hexColor, fallback) {
        if (typeof hexColor !== 'string') return fallback;

        const raw = hexColor.trim().replace('#', '');
        const normalized = raw.length === 3
            ? raw.split('').map((char) => `${char}${char}`).join('')
            : raw;

        if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
            return fallback;
        }

        const r = parseInt(normalized.slice(0, 2), 16);
        const g = parseInt(normalized.slice(2, 4), 16);
        const b = parseInt(normalized.slice(4, 6), 16);
        return `${r}, ${g}, ${b}`;
    }

    /**
     * Cambia el tema actual y guarda en localStorage
     * @param {string} nombreTema - Identificador del tema
     */
    cambiarTema(nombreTema) {
        this.aplicarTema(nombreTema);
        this.temaActual = nombreTema;
        localStorage.setItem(GestorTemas.STORAGE_KEY, nombreTema);

        this._mostrarNotificacion(`Tema cambiado a ${TEMAS[nombreTema].nombre}`);
        document.dispatchEvent(new CustomEvent('temaActualizado', { 
            detail: { tema: nombreTema } 
        }));
    }

    /**
     * Muestra una notificación temporal
     * @private
     */
    _mostrarNotificacion(mensaje) {
        const notif = document.createElement('div');
        notif.className = 'notif-tema';
        notif.textContent = mensaje;
        notif.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            animation: slideIn 0.3s ease;
            z-index: 9999;
            font-weight: 600;
            font-size: 0.9rem;
        `;

        document.body.appendChild(notif);
        setTimeout(() => {
            notif.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => notif.remove(), 300);
        }, 2000);
    }

    /**
     * Obtiene la lista de temas disponibles
     * @returns {Array} Array con id y nombre de cada tema
     */
    obtenerTemas() {
        return Object.entries(TEMAS).map(([id, tema]) => ({
            id,
            nombre: tema.nombre
        }));
    }

    /**
     * Obtiene el tema actualmente aplicado
     * @returns {string} Identificador del tema actual
     */
    obtenerTemaActual() {
        return this.temaActual;
    }

    /**
     * Valida que un tema exista
     * @param {string} nombreTema - Identificador del tema
     * @returns {boolean} True si el tema existe
     */
    existeTema(nombreTema) {
        return nombreTema in TEMAS;
    }
}


// ==================== INICIALIZACIÓN ====================
// Instancia global del gestor de temas
const gestorTemas = new GestorTemas();