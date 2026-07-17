import { Link2, Unlink, Check } from 'lucide-react';
import { card, fadeIn } from '@/core/utils/tw';

interface SettingsDiscordSectionProps {
    discordId?: string | null;
    discordUsername?: string | null;
    discordAvatar?: string | null;
    busy?: boolean;
    onLinkClick: () => void;
    onUnlinkClick: () => void;
}

const cardShell = `${card} ${fadeIn} mb-3 opacity-0`;

export function SettingsDiscordSection({
    discordId,
    discordUsername,
    discordAvatar,
    busy = false,
    onLinkClick,
    onUnlinkClick
}: SettingsDiscordSectionProps) {
    const linked = Boolean(discordId);

    return (
        <div className={`${cardShell} [animation-delay:90ms]`}>
            <div className="mb-3 flex items-center justify-between gap-3 border-b border-white/[0.08] pb-2">
                <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#5865F2]/30 bg-[#5865F2]/15 text-[#5865F2]">
                        <Link2 className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="mb-0.5 text-[0.95rem] font-bold">Cuentas vinculadas</h3>
                        <p className="text-[0.8rem] text-[#c4c4cc]">
                            Conecta Discord para el bot y avisos personales
                        </p>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-black/40 p-3 px-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.12em] text-[#5865F2] opacity-90">
                        Discord
                    </p>
                    {linked ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/[0.06] px-2 py-0.5 text-[0.7rem] font-bold text-emerald-400">
                            <Check className="w-3 h-3" /> Vinculado
                        </span>
                    ) : null}
                </div>

                {linked ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                            {discordAvatar ? (
                                <img
                                    src={discordAvatar}
                                    alt=""
                                    className="h-10 w-10 rounded-full border border-white/10"
                                />
                            ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5865F2]/20 text-sm font-bold text-[#5865F2]">
                                    {(discordUsername || '?').slice(0, 1).toUpperCase()}
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white">
                                    @{discordUsername || 'Discord'}
                                </p>
                                <p className="truncate text-[0.72rem] text-zinc-500">ID {discordId}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={onUnlinkClick}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[0.8rem] font-semibold text-zinc-300 transition hover:border-error/40 hover:text-error disabled:opacity-50"
                        >
                            <Unlink className="w-3.5 h-3.5" />
                            Desvincular
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="max-w-md text-[0.82rem] leading-relaxed text-zinc-400">
                            Vincula tu Discord para usar comandos del bot con tu cuenta de LosPerris
                            (por ejemplo <span className="text-zinc-300">/cuenta</span>).
                        </p>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={onLinkClick}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#5865F2] px-3 py-1.5 text-[0.8rem] font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                        >
                            Vincular Discord
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
