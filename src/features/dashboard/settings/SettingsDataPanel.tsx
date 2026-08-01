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

function formatDate(isoDate?: string, timezone?: string, locale = 'es-ES') {
    if (!isoDate) return 'Desconocido';
    try {
        const date = new Date(isoDate);
        return new Intl.DateTimeFormat(locale, {
            timeZone: timezone || 'UTC',
            dateStyle: 'long',
            timeStyle: 'short'
        }).format(date);
    } catch {
        return 'Fecha inválida';
    }
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
                        <div className="text-sm font-medium text-white">
                            {formatDate(profile?.dbCreatedAt, profile?.timezone, locale)}
                        </div>
                    }
                />
                
                <SettingsRow
                    title={gT.data?.lastLogin || 'Último Ingreso Previo'}
                    icon={Clock}
                    description={gT.data?.lastLoginDesc || 'Fecha de tu última sesión'}
                    control={
                        <div className="text-sm font-medium text-white">
                            {formatDate(profile?.dbLastActive, profile?.timezone, locale)}
                        </div>
                    }
                />
            </SettingsGroup>

            <SettingsGroup title={gT.export.title} description={gT.export.desc} delay={60}>
                <SettingsExportSection loading={exportLoading} onExport={onExport} />
            </SettingsGroup>
        </>
    );
}
