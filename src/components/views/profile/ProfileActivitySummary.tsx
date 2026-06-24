import { TrendingUp, Terminal, Wrench, Gamepad2 } from 'lucide-react';

import { card, fadeIn } from '@/lib/tw';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

const CATEGORIES = [
    { id: 'cat-commands', label: 'Comandos', icon: Terminal, keys: ['clips', 'followage', 'so', 'message'] },
    { id: 'cat-tools', label: 'Herramientas', icon: Wrench, keys: ['stalker', 'trends', 'roulette'] },
    { id: 'cat-minigames', label: 'Minijuegos', icon: Gamepad2, keys: ['russian', 'magic8', 'duel'] }
] as const;

interface ProfileActivitySummaryProps {
    analytics: Record<string, number> | null;
    loading: boolean;
    syncing?: boolean;
    syncLabel?: string;
}

const cardShell = `${card} ${fadeIn} mb-3 opacity-0`;

export function ProfileActivitySummary({
    analytics,
    loading,
    syncing = false,
    syncLabel = '30s'
}: ProfileActivitySummaryProps) {
    return (
        <div className={`${cardShell} [animation-delay:120ms]`}>
            <div className="mb-2 flex items-center gap-3 border-b border-white/[0.08] pb-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-[0.9rem] text-primary">
                    <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                    <h3 className="mb-0.5 text-[0.95rem] font-bold">Resumen de Actividad</h3>
                    <p className="text-[0.8rem] text-[#a1a1aa]">
                        Frecuencia de uso de tus recursos en tiempo real (
                        <span
                            className={`text-[0.85em] font-medium opacity-60 transition-all duration-300 ${syncing ? 'animate-blink-soft text-primary opacity-100' : ''}`}
                        >
                            {syncing ? 'Sincronizando...' : syncLabel}
                        </span>
                        )
                    </p>
                </div>
            </div>

            <div className="mt-2.5 grid grid-cols-1 gap-4 text-[#fafafa] min-[1024px]:grid-cols-3">
                {loading || !analytics ? (
                    <div className="col-span-full grid gap-4 min-[1024px]:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-[100px] animate-pulse rounded-xl border border-white/[0.08] bg-bg-tertiary"
                                aria-hidden
                            />
                        ))}
                    </div>
                ) : (
                    CATEGORIES.map((cat) => {
                        const total = cat.keys.reduce((sum, key) => sum + (analytics[key] ?? 0), 0);
                        return (
                            <div
                                key={cat.id}
                                className="relative flex items-center gap-5 overflow-hidden rounded-xl border border-white/[0.08] bg-bg-secondary p-5 transition hover:-translate-y-0.5 hover:shadow-[0_5px_15px_rgba(0,0,0,0.2)] before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-primary before:opacity-50"
                            >
                                <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[15px] bg-primary/10 text-2xl text-primary">
                                    <cat.icon className="w-6 h-6" aria-hidden="true" />
                                </div>
                                <div>
                                    <h3 className="mb-1 text-[1.8rem] font-bold leading-tight text-[#fafafa]">
                                        <AnimatedNumber value={total} />
                                    </h3>
                                    <span className="text-[0.9rem] font-medium text-[#71717a]">{cat.label}</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
