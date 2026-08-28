import { SettingsGroup } from '@/features/dashboard/settings/components/SettingsGroup';
import { SettingsDiscordSection } from '@/features/dashboard/settings/sections/SettingsDiscordSection';
import { useTranslation } from '@/core/i18n/I18nContext';

interface SettingsConnectionsPanelProps {
    discordId?: string | null;
    discordUsername?: string | null;
    discordAvatar?: string | null;
    busy: boolean;
    onLinkClick: () => void;
    onUnlinkClick: () => void;
}

export function SettingsConnectionsPanel({
    discordId,
    discordUsername,
    discordAvatar,
    busy,
    onLinkClick,
    onUnlinkClick
}: SettingsConnectionsPanelProps) {
    const { t } = useTranslation();
    const gT = t.settings.groups;

    return (
        <SettingsGroup
            title={gT.discord.title}
            description={gT.discord.desc}
            delay={40}
        >
            <SettingsDiscordSection
                discordId={discordId}
                discordUsername={discordUsername}
                discordAvatar={discordAvatar}
                busy={busy}
                onLinkClick={onLinkClick}
                onUnlinkClick={onUnlinkClick}
            />
        </SettingsGroup>
    );
}
