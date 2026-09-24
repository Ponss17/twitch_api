const SIDEBAR_COLLAPSED_PREF = 'dashboard_sidebar_collapsed';
const SIDEBAR_SECTIONS_PREF = 'dashboard_sidebar_sections';

/** Categorías que el user puede contraer (General queda siempre visible). */
export const COLLAPSIBLE_NAV_CATEGORIES = [
    'commands',
    'tools',
    'alerts',
    'minigames'
] as const;

export type CollapsibleNavCategory = (typeof COLLAPSIBLE_NAV_CATEGORIES)[number];

export type SidebarSectionsPref = Partial<Record<CollapsibleNavCategory, boolean>>;

const DEFAULT_SECTIONS: Record<CollapsibleNavCategory, boolean> = {
    commands: true,
    tools: false,
    alerts: true,
    minigames: false
};

export function isCollapsibleNavCategory(value: string | undefined): value is CollapsibleNavCategory {
    return (
        typeof value === 'string' &&
        (COLLAPSIBLE_NAV_CATEGORIES as readonly string[]).includes(value)
    );
}

export function readSidebarCollapsedPref(): boolean {
    try {
        return localStorage.getItem(SIDEBAR_COLLAPSED_PREF) === '1';
    } catch {
        return false;
    }
}

export function writeSidebarCollapsedPref(collapsed: boolean): void {
    try {
        localStorage.setItem(SIDEBAR_COLLAPSED_PREF, collapsed ? '1' : '0');
    } catch {
        /* ignore quota / private mode */
    }
}

function sectionFlag(value: unknown, fallback: boolean): boolean {
    return typeof value === 'boolean' ? value : fallback;
}

export function readSidebarSectionsPref(): Record<CollapsibleNavCategory, boolean> {
    try {
        const raw = localStorage.getItem(SIDEBAR_SECTIONS_PREF);
        if (!raw) return { ...DEFAULT_SECTIONS };
        const parsed = JSON.parse(raw) as SidebarSectionsPref;
        if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_SECTIONS };
        return {
            commands: sectionFlag(parsed.commands, DEFAULT_SECTIONS.commands),
            tools: sectionFlag(parsed.tools, DEFAULT_SECTIONS.tools),
            alerts: sectionFlag(parsed.alerts, DEFAULT_SECTIONS.alerts),
            minigames: sectionFlag(parsed.minigames, DEFAULT_SECTIONS.minigames)
        };
    } catch {
        return { ...DEFAULT_SECTIONS };
    }
}

export function writeSidebarSectionsPref(sections: Record<CollapsibleNavCategory, boolean>): void {
    try {
        localStorage.setItem(SIDEBAR_SECTIONS_PREF, JSON.stringify(sections));
    } catch {
        /* ignore quota / private mode */
    }
}
