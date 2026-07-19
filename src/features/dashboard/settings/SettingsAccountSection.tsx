import { Copy, Gauge, Clock, Crown, Hash } from 'lucide-react';
import { SettingsRow } from '@/features/dashboard/settings/SettingsGroup';

interface SettingsAccountSectionProps {
    userId?: string;
    rateLimit: number;
    heavyLimit?: number;
    cacheTtl: number;
    roleLabel: string;
    hasCustomRateLimit?: boolean;
    hasCustomCacheTtl?: boolean;
    onCopyId: () => void;
}

export function SettingsAccountSection({
    userId,
    rateLimit,
    heavyLimit,
    cacheTtl,
    roleLabel,
    hasCustomRateLimit,
    hasCustomCacheTtl,
    onCopyId
}: SettingsAccountSectionProps) {
    return (
        <>
            <SettingsRow
                title="User ID"
                icon={Hash}
                description="Identificador de tu cuenta de Twitch vinculado a LosPerris."
                control={
                    <button
                        type="button"
                        onClick={onCopyId}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 font-[Consolas,monospace] text-[0.8rem] font-semibold text-zinc-300 transition hover:border-primary/40 hover:text-primary"
                    >
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        {userId ?? '---'}
                    </button>
                }
            />

            <SettingsRow
                title="Plan y cuota"
                icon={Crown}
                description="Límites de tu API Key según el rol de la cuenta."
            >
                <div className="flex flex-wrap items-center gap-1.5">
                    <span
                        className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[0.7rem] font-semibold text-primary"
                        title="Tu plan de API: más alto = más cuota y datos más frescos"
                    >
                        <Crown className="w-3 h-3 opacity-80" /> {roleLabel}
                    </span>
                    <span
                        className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-0.5 text-[0.7rem] font-semibold text-zinc-400"
                        title="Peticiones por minuto con tu API Key (comandos e integraciones)"
                    >
                        <Gauge className="w-3 h-3 text-primary/70" /> {rateLimit} req/min
                        {hasCustomRateLimit ? ' *' : ''}
                    </span>
                    {typeof heavyLimit === 'number' && (
                        <span
                            className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-0.5 text-[0.7rem] font-semibold text-zinc-400"
                            title="Cuota de endpoints pesados (clips / chatters) con API Key"
                        >
                            <Gauge className="w-3 h-3 text-amber-400/80" /> {heavyLimit} heavy/min
                        </span>
                    )}
                    <span
                        className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-0.5 text-[0.7rem] font-semibold text-zinc-400"
                        title="Retención de caché de comandos de bot (followage, etc.)"
                    >
                        <Clock className="w-3 h-3 text-primary/70" /> {cacheTtl}s caché
                        {hasCustomCacheTtl ? ' *' : ''}
                    </span>
                </div>
            </SettingsRow>
        </>
    );
}
