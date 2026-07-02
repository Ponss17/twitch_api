import { fadeIn } from '@/core/ui/tw';
import { rankResourceUsage } from '@/features/dashboard/lib/statsUsage';
import { StatsPageIntro } from '@/features/dashboard/components/stats/StatsPageIntro';
import { StatsSectionHeading } from '@/features/dashboard/components/stats/StatsSectionHeading';
import { StatsResourceChart } from '@/features/dashboard/components/stats/StatsResourceChart';
import { StatsCategoryChart } from '@/features/dashboard/components/stats/StatsCategoryChart';
import { StatsUsageTable } from '@/features/dashboard/components/stats/StatsUsageTable';
import { useDashboardPanel } from '@/features/dashboard/providers/DashboardPanelProvider';

export function StatsView({ active: _active = true }: { active?: boolean }) {
    const { stats, hasLiveData, syncing, syncLabel } = useDashboardPanel();

    const ranked = rankResourceUsage(stats);
    const loading = !hasLiveData;

    return (
        <div className={fadeIn}>
            <StatsPageIntro syncing={syncing} syncLabel={syncLabel} />

            <StatsSectionHeading
                title="Gráfica de usos"
                description="Recursos con actividad hoy, de mayor a menor."
            />
            <StatsResourceChart rows={ranked} loading={loading} />

            <StatsSectionHeading
                title="Gráfica por categoría"
                description="Comandos, herramientas y minijuegos."
            />
            <StatsCategoryChart stats={stats} loading={loading} />

            <StatsSectionHeading
                title="Tabla de usos"
                description="Conteo de cada recurso en el día actual."
            />
            <StatsUsageTable stats={stats} loading={loading} />
        </div>
    );
}
