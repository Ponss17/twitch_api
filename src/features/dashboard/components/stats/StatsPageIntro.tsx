import { BarChart3 } from 'lucide-react';
import { fadeIn } from '@/core/ui/tw';

interface StatsPageIntroProps {
    syncing?: boolean;
    syncLabel?: string;
}

export function StatsPageIntro({ syncing = false, syncLabel = '90s' }: StatsPageIntroProps) {
    return (
        <div className={`${fadeIn} mb-4 opacity-0 [animation-delay:0ms]`}>
            <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <BarChart3 className="size-4" aria-hidden />
                </div>
                <div>
                    <h2 className="text-[1.05rem] font-bold text-white">Uso de recursos hoy</h2>
                    <p className="mt-0.5 max-w-[640px] text-[0.82rem] leading-relaxed text-[#c4c4cc]">
                        Desglose de comandos, herramientas y minijuegos. Solo datos de uso — el resumen
                        operativo (éxito, latencia y actividad en vivo) está en Inicio.
                        <span className="ml-1 opacity-70">
                            ·{' '}
                            <span
                                className={syncing ? 'animate-blink-soft font-medium text-primary opacity-100' : ''}
                            >
                                {syncing ? 'Sincronizando...' : syncLabel}
                            </span>
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}
