import { Clock, CalendarDays } from 'lucide-react';
import type { DashboardProfile } from '@/features/dashboard/lib/dashboardSummary';
import { SettingsGroup, SettingsRow } from '@/features/dashboard/settings/SettingsGroup';
import { SettingsExportSection } from '@/features/dashboard/settings/SettingsExportSection';
import { useTranslation } from '@/core/i18n/I18nContext';

interface SettingsDataPanelProps {
    profile: DashboardProfile | null;
    exportLoading: boolean;
    onExport: () => void | Promise<void>;
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

function DateTimeBadge({ isoDate, timezone, locale, fallback }: { isoDate?: string, timezone?: string, locale: string, fallback: string }) {
    const split = formatDateTimeSplit(isoDate, timezone, locale);
    
    if (!split) {
        return <span className="text-sm font-medium text-zinc-500">{fallback}</span>;
    }

    return (
        <div className="flex items-center gap-4 text-[0.85rem]">
            <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-zinc-500" />
                <span className="font-medium text-zinc-300">{split.date}</span>
            </div>
            <div className="h-4 w-px bg-white/[0.08]" aria-hidden="true" />
            <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary/70" />
                <span className="font-medium text-white">{split.time}</span>
            </div>
        </div>
    );
}

export function SettingsDataPanel({
    profile,
    exportLoading,
    onExport
}: SettingsDataPanelProps) {
    const { t, locale } = useTranslation();
    const gT = t.settings.groups;

    return (
        <>
            <SettingsGroup title={gT.data?.title || 'Datos'} description={gT.data?.desc || 'Información de tu cuenta y exportación de datos'} delay={40}>
                <SettingsRow
                    title={gT.data?.firstLogin || 'Primer Ingreso'}
                    icon={CalendarDays}
                    description={gT.data?.firstLoginDesc || 'Fecha de tu primer inicio de sesión'}
                    control={
                        <DateTimeBadge
                            isoDate={profile?.dbCreatedAt}
                            timezone={profile?.timezone}
                            locale={locale}
                            fallback="Desconocido"
                        />
                    }
                />
                
                <SettingsRow
                    title={gT.data?.lastLogin || 'Último Ingreso Previo'}
                    icon={Clock}
                    description={gT.data?.lastLoginDesc || 'Fecha de tu última sesión'}
                    control={
                        <DateTimeBadge
                            isoDate={profile?.dbLastActive}
                            timezone={profile?.timezone}
                            locale={locale}
                            fallback="Desconocido"
                        />
                    }
                />
            </SettingsGroup>

            <SettingsGroup title={gT.export.title} description={gT.export.desc} delay={60}>
                <SettingsExportSection loading={exportLoading} onExport={onExport} />
            </SettingsGroup>
        </>
    );
}
