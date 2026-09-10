import { Clock, CalendarDays, RotateCcw } from 'lucide-react';
import type { DashboardProfile } from '@/features/dashboard/lib/data/dashboardSummary';
import { SettingsGroup, SettingsRow } from '@/features/dashboard/settings/components/SettingsGroup';
import {
    SettingsExportSection,
    type SettingsExportOptions
} from '@/features/dashboard/settings/sections/SettingsExportSection';
import { useTranslation, getBcp47 } from '@/core/i18n/I18nContext';

interface SettingsDataPanelProps {
    profile: DashboardProfile | null;
    exportLoading: 'html' | 'csv' | null;
    onExport: (format: 'html' | 'csv', options?: SettingsExportOptions) => void | Promise<void>;
    onClearData: () => void;
}

function formatDateTimeSplit(isoDate?: string, timezone?: string, locale = 'es-ES') {
    if (!isoDate) return null;
    try {
        const dateObj = new Date(isoDate);
        const date = new Intl.DateTimeFormat(locale, {
            timeZone: timezone || 'UTC',
            dateStyle: 'medium'
        }).format(dateObj);

        const time = new Intl.DateTimeFormat(locale, {
            timeZone: timezone || 'UTC',
            timeStyle: 'short'
        }).format(dateObj);

        return { date, time };
    } catch {
        return null;
    }
}

function DateTimeBadge({
    isoDate,
    timezone,
    locale,
    fallback
}: {
    isoDate?: string;
    timezone?: string;
    locale: string;
    fallback: string;
}) {
    const split = formatDateTimeSplit(isoDate, timezone, locale);

    if (!split) {
        return <span className="text-sm font-medium text-text-muted">{fallback}</span>;
    }

    return (
        <div className="flex items-center gap-4 text-[0.85rem]">
            <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-text-muted" />
                <span className="font-medium text-text-main">{split.date}</span>
            </div>
            <div className="h-4 w-px bg-border-strong" aria-hidden="true" />
            <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand-text" />
                <span className="font-medium text-text-main">{split.time}</span>
            </div>
        </div>
    );
}

const resetBtn =
    'inline-flex w-full min-w-[7.5rem] items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-[0.8125rem] font-semibold text-amber-500 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto';

export function SettingsDataPanel({
    profile,
    exportLoading,
    onExport,
    onClearData
}: SettingsDataPanelProps) {
    const { t, locale } = useTranslation();
    const gT = t.settings.groups;
    const pT = t.settings.panels;
    const bcp47 = getBcp47(locale);
    const unknown = t.home.activityInspector.unknownDate;

    return (
        <>
            <SettingsGroup title={gT.data.title} description={gT.data.desc} delay={40}>
                <SettingsRow
                    title={gT.data.firstLogin}
                    icon={CalendarDays}
                    description={gT.data.firstLoginDesc}
                    control={
                        <DateTimeBadge
                            isoDate={profile?.dbCreatedAt}
                            timezone={profile?.timezone}
                            locale={bcp47}
                            fallback={unknown}
                        />
                    }
                />

                <SettingsRow
                    title={gT.data.lastLogin}
                    icon={Clock}
                    description={gT.data.lastLoginDesc}
                    control={
                        <DateTimeBadge
                            isoDate={profile?.dbLastActive}
                            timezone={profile?.timezone}
                            locale={bcp47}
                            fallback={unknown}
                        />
                    }
                />
            </SettingsGroup>

            <SettingsGroup title={gT.manageData.title} description={gT.manageData.desc} delay={50}>
                <SettingsRow
                    icon={RotateCcw}
                    title={pT.resetStats}
                    description={pT.resetStatsDesc}
                    control={
                        <button type="button" onClick={onClearData} className={resetBtn}>
                            {pT.resetStatsAction}
                        </button>
                    }
                />
            </SettingsGroup>

            <SettingsGroup title={gT.export.title} description={gT.export.desc} delay={60}>
                <SettingsExportSection loading={exportLoading} onExport={onExport} />
            </SettingsGroup>
        </>
    );
}
