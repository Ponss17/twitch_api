import type { ReactNode } from 'react';
import { isSettingsTabId, type SettingsTabId } from '@/features/dashboard/settings/settingsPaths';

export type { SettingsTabId };
export { isSettingsTabId };

const TABS: { id: SettingsTabId; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'seguridad', label: 'Seguridad' },
    { id: 'conexiones', label: 'Conexiones' }
];

interface SettingsTabsProps {
    active: SettingsTabId;
    onChange: (tab: SettingsTabId) => void;
}

export function SettingsTabs({ active, onChange }: SettingsTabsProps) {
    return (
        <nav
            className="mb-6 flex gap-1 border-b border-white/[0.08]"
            aria-label="Secciones de ajustes"
            role="tablist"
        >
            {TABS.map((tab) => {
                const isActive = tab.id === active;
                return (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        id={`settings-tab-${tab.id}`}
                        aria-selected={isActive}
                        aria-controls={`settings-panel-${tab.id}`}
                        onClick={() => onChange(tab.id)}
                        className={`relative -mb-px px-3.5 py-2.5 text-[0.875rem] font-semibold transition ${
                            isActive
                                ? 'border-b-2 border-primary text-white'
                                : 'border-b-2 border-transparent text-[#8b8b93] hover:text-[#d4d4d8]'
                        }`}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </nav>
    );
}

export function SettingsTabPanel({
    id,
    active,
    children
}: {
    id: SettingsTabId;
    active: SettingsTabId;
    children: ReactNode;
}) {
    if (id !== active) return null;
    return (
        <div
            role="tabpanel"
            id={`settings-panel-${id}`}
            aria-labelledby={`settings-tab-${id}`}
            className="animate-tab-in"
        >
            {children}
        </div>
    );
}
