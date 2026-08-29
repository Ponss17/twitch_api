import { Unlink, Check, Link2 } from 'lucide-react';
import { SettingsRow } from '@/features/dashboard/settings/components/SettingsGroup';
import { DiscordIcon } from '@/shared/ui/icons/BrandIcons';
import { useTranslation } from '@/core/i18n/I18nContext';

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
    const { t } = useTranslation();
    const pT = t.settings.panels;
    const linked = Boolean(discordId);

    if (linked) {
        return (
            <SettingsRow
                title={pT.discordTitle}
                iconNode={discordTitleIcon}
                iconAccent="discord"
                description={t.settings.groups.discord.desc}
                control={
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2.5">
                            <div className="relative shrink-0">
                                {discordAvatar ? (
                                    <img
                                        src={discordAvatar.replace('size=128', 'size=64')}
                                        alt=""
                                        className="h-8 w-8 rounded-full border-2 border-[#5865F2]/40 object-cover"
                                    />
                                ) : (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5865F2]/15 text-[0.8rem] font-bold text-[#5865F2]">
                                        {(discordUsername || '?').slice(0, 1).toUpperCase()}
                                    </div>
                                )}
                                <span
                                    className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-bg-card bg-success"
                                    aria-hidden
                                />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-[0.8125rem] font-semibold leading-tight text-text-main">
                                    @{discordUsername || 'Discord'}
                                </p>
                                <span className="inline-flex items-center gap-1 text-[0.7rem] font-medium text-success">
                                    <Check className="h-2.5 w-2.5" />
                                    {pT.discordStatus(true)}
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={onUnlinkClick}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border-subtle bg-text-main/5 px-3 py-1.5 text-[0.78rem] font-medium text-text-muted transition hover:border-error/40 hover:bg-error/5 hover:text-error disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Unlink className="h-3.5 w-3.5" />
                            {pT.unlinkDiscord}
                        </button>
                    </div>
                }
            />
        );
    }

    return (
        <SettingsRow
            title={pT.discordTitle}
            iconNode={discordTitleIcon}
            iconAccent="discord"
            description={t.settings.groups.discord.desc}
            control={
                <button
                    type="button"
                    disabled={busy}
                    onClick={onLinkClick}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#5865F2] px-4 py-2 text-[0.8rem] font-semibold text-white shadow-sm transition hover:bg-[#4752c4] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                    <Link2 className="h-3.5 w-3.5" />
                    {pT.linkDiscord}
                </button>
            }
        />
    );
}

