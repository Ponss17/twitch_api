import { Unlink, Check } from 'lucide-react';
import { SettingsRow } from '@/features/dashboard/settings/SettingsGroup';
import { DiscordIcon } from '@/shared/ui/icons/BrandIcons';

const discordTitleIcon = <DiscordIcon className="h-4 w-4" aria-hidden="true" />;

interface SettingsDiscordSectionProps {
    discordId?: string | null;
    discordUsername?: string | null;
    discordAvatar?: string | null;
    busy?: boolean;
    onLinkClick: () => void;
    onUnlinkClick: () => void;
}

export function SettingsDiscordSection({
    discordId,
    discordUsername,
    discordAvatar,
    busy = false,
    onLinkClick,
    onUnlinkClick
}: SettingsDiscordSectionProps) {
    const linked = Boolean(discordId);

    if (linked) {
        return (
            <SettingsRow
                title="Discord"
                iconNode={discordTitleIcon}
                iconAccent="discord"
                description="Tu Discord está vinculado para usar los comandos en el servidor."
                control={
                    <div className="flex items-center gap-3">
                        {discordAvatar ? (
                            <img src={discordAvatar.replace('size=128', 'size=64')} alt="" className="h-9 w-9 rounded-full border border-white/10" />
                        ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5865F2]/20 text-sm font-bold text-[#5865F2]">
                                {(discordUsername || '?').slice(0, 1).toUpperCase()}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">@{discordUsername || 'Discord'}</p>
                            <span className="inline-flex items-center gap-1 text-[0.7rem] font-bold text-emerald-400">
                                <Check className="w-3 h-3" /> Vinculado
                            </span>
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
                }
            />
        );
    }

    return (
        <SettingsRow
            title="Discord"
            iconNode={discordTitleIcon}
            iconAccent="discord"
            description="Vincula tu cuenta para usar los comandos en el servidor de Discord."
            control={
                <button
                    type="button"
                    disabled={busy}
                    onClick={onLinkClick}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#5865F2] px-4 py-2 text-[0.8rem] font-semibold text-white transition hover:brightness-110 disabled:opacity-50 sm:w-auto"
                >
                    <DiscordIcon className="h-4 w-4" />
                    Vincular Discord
                </button>
            }
        />
    );
}
