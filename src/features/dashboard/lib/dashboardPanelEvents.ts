/** Señal de que el panel cargó datos (splash / progreso de sesión). */
export const DASHBOARD_DATA_READY_EVENT = 'dashboard:data-ready';

/** @deprecated Usar DASHBOARD_DATA_READY_EVENT */
export const HOME_DATA_READY_EVENT = 'home:data-ready';

export function dispatchDashboardDataReady(): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(DASHBOARD_DATA_READY_EVENT));
    window.dispatchEvent(new CustomEvent(HOME_DATA_READY_EVENT));
}
