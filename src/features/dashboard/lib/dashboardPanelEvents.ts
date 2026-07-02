/** Señal de que Inicio cargó datos (splash / progreso de sesión). */
export const DASHBOARD_DATA_READY_EVENT = 'dashboard:data-ready';

export function dispatchDashboardDataReady(): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(DASHBOARD_DATA_READY_EVENT));
}
