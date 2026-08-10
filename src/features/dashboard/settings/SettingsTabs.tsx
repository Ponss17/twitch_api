import type { ReactNode } from 'react';
import { isSettingsTabId, type SettingsTabId } from '@/features/dashboard/settings/settingsPaths';
import { useTranslation } from '@/core/i18n/I18nContext';

export type { SettingsTabId };
export { isSettingsTabId };

interface SettingsTabsProps {
    active: SettingsTabId;
    onChange: (tab: SettingsTabId) => void;
}

export function SettingsTabs({ active, onChange }: SettingsTabsProps) {
    const { t } = useTranslation();
    
    const TABS: { id: SettingsTabId; label: string }[] = [
        { id: 'general', label: t.settings.tabs.general },
        { id: 'datos', label: t.settings.tabs.data || 'Datos' },
        { id: 'seguridad', label: t.settings.tabs.security },
        { id: 'conexiones', label: t.settings.tabs.connections }
    ];

    return (
        <div
            className="mb-6 flex gap-1 border-b border-border-strong"
            aria-label={t.common.aria.settingsSections}
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
                        className={`relative -mb-px px-3.5 py-2.5 text-[0.875rem] font-semibold transition ${isActive
                                ? 'border-b-2 border-primary text-primary'
                                : 'border-b-2 border-transparent text-text-muted hover:bg-bg-hover-neutral hover:text-text-main'
                            }`}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
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
