import { SettingsGroup } from '@/features/dashboard/settings/SettingsGroup';
import { SettingsDiscordSection } from '@/features/dashboard/settings/SettingsDiscordSection';

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
    return (
        <SettingsGroup
            title="Conexiones"
            description="Servicios vinculados a tu cuenta de LosPerris"
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
