import { dashboardStore, Toast, ToastActions } from '../../core/dashboardStore.js';

/**
 * Componente Toast conectado al dashboardStore.
 * Se suscribe automáticamente a cambios en el estado 'toasts'
 * y renderiza/actualiza el DOM en consecuencia.
 */
export const ToastComponent = {
    container: null as HTMLElement | null,
    unsubscribe: null as (() => void) | null,
    renderedToasts: new Set<string>(),

    /**
     * Inicializa el componente Toast y comienza a escuchar cambios en el store
     */
    init(): void {
        // Crear contenedor si no existe
        if (!this.container) {
            this.container = document.querySelector('.toast-container');
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.className = 'toast-container';
                document.body.appendChild(this.container);
            }
        }

        // Suscribirse a cambios en el estado 'toasts'
        this.unsubscribe = dashboardStore.on('toasts', (state) => {
            this.render(state.toasts);
        });

        // Render inicial
        this.render(dashboardStore.getState().toasts);
    },

    /**
     * Limpia suscripciones y referencias al destruir el componente
     */
    destroy(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.renderedToasts.clear();
    },

    /**
     * Renderiza los toasts en el DOM basado en el estado actual
     */
    render(toasts: Toast[]): void {
        if (!this.container) return;

        // Obtener IDs de toasts actuales
        const currentIds = new Set(toasts.map((t) => t.id));

        // Remover toasts que ya no están en el estado
        this.renderedToasts.forEach((id) => {
            if (!currentIds.has(id)) {
                const toastEl = document.getElementById(id);
                if (toastEl && toastEl.parentElement === this.container) {
                    toastEl.remove();
                }
                this.renderedToasts.delete(id);
            }
        });

        // Agregar nuevos toasts
        toasts.forEach((toast) => {
            if (!this.renderedToasts.has(toast.id)) {
                this.createToastElement(toast);
                this.renderedToasts.add(toast.id);
            }
        });
    },

    /**
     * Crea un elemento DOM para un toast específico
     */
    createToastElement(toast: Toast): void {
        if (!this.container) return;

        const toastEl = document.createElement('div');
        toastEl.id = toast.id;
        toastEl.className = `toast ${toast.type}`;
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', 'polite');

        // Icono por defecto según el tipo
        const defaultIcon = this.getIconForType(toast.type);
        const icon = toast.icon || defaultIcon;

        // Usar DOM API en lugar de innerHTML para mayor seguridad
        const iconEl = document.createElement('i');
        iconEl.className = `fa-solid ${icon}`;
        iconEl.setAttribute('aria-hidden', 'true');

        const textSpan = document.createElement('span');
        textSpan.textContent = toast.message;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.setAttribute('aria-label', 'Cerrar notificación');
        const closeIcon = document.createElement('i');
        closeIcon.className = 'fa-solid fa-xmark';
        closeBtn.appendChild(closeIcon);
        closeBtn.onclick = () => {
            this.dismiss(toast.id);
        };

        toastEl.appendChild(iconEl);
        toastEl.appendChild(textSpan);
        toastEl.appendChild(closeBtn);

        // Botón de cerrar al hacer click en el toast
        toastEl.addEventListener('click', (e) => {
            if (e.target === toastEl || (e.target as HTMLElement).closest('span')) {
                this.dismiss(toast.id);
            }
        });

        this.container.appendChild(toastEl);
    },

    /**
     * Obtiene el icono FontAwesome según el tipo de toast
     */
    getIconForType(type: Toast['type']): string {
        switch (type) {
            case 'success':
                return 'fa-check-circle';
            case 'error':
                return 'fa-circle-xmark';
            case 'warning':
                return 'fa-triangle-exclamation';
            case 'info':
                return 'fa-circle-info';
            default:
                return 'fa-circle-info';
        }
    },

    /**
     * Cierra un toast manualmente
     */
    dismiss(id: string): void {
        ToastActions.remove(id);
    }
};

// Inicializar automáticamente cuando el DOM esté listo
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ToastComponent.init());
    } else {
        ToastComponent.init();
    }
}
