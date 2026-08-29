import { useRef, useEffect, useState, type ReactNode } from 'react';
import { isSettingsTabId, type SettingsTabId } from '@/features/dashboard/settings/lib/settingsPaths';
import { useTranslation } from '@/core/i18n/I18nContext';

export type { SettingsTabId };
export { isSettingsTabId };



interface SettingsTabsProps {
    active: SettingsTabId;
    onChange: (tab: SettingsTabId) => void;
}

export function SettingsTabs({ active, onChange }: SettingsTabsProps) {
    const { t } = useTranslation();
    const tabRefs = useRef<Map<SettingsTabId, HTMLButtonElement | null>>(new Map());
    const [indicator, setIndicator] = useState({ left: 0, width: 0 });

    const TABS: { id: SettingsTabId; label: string }[] = [
        { id: 'general', label: t.settings.tabs.general },
        { id: 'datos', label: t.settings.tabs.data || 'Datos' },
        { id: 'seguridad', label: t.settings.tabs.security },
        { id: 'conexiones', label: t.settings.tabs.connections }
    ];

    useEffect(() => {
        const btn = tabRefs.current.get(active);
        if (!btn) return;
        const parent = btn.parentElement;
        if (!parent) return;
        const parentRect = parent.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        setIndicator({
            left: btnRect.left - parentRect.left,
            width: btnRect.width
        });
    }, [active]);

    const handleClick = (tabId: SettingsTabId) => {
        if (tabId === active) return;
        onChange(tabId);
    };

    return (
        <div
            className="relative mb-7 flex gap-0.5 border-b border-border-subtle"
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
                        ref={(el) => { tabRefs.current.set(tab.id, el); }}
                        onClick={() => handleClick(tab.id)}
                        className={`relative -mb-px px-4 py-2.5 text-[0.875rem] font-semibold transition-colors duration-200 ${isActive ? 'text-primary' : 'text-text-muted hover:text-text-main'
                            }`}
                    >
                        {tab.label}
                    </button>
                );
            })}
            <span
                aria-hidden
                className="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-primary transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ left: indicator.left, width: indicator.width }}
            />
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
