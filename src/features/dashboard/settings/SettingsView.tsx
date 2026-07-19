import { fadeIn } from '@/core/utils/tw';
import { SettingsTabs, SettingsTabPanel } from '@/features/dashboard/settings/SettingsTabs';
import { SettingsGeneralPanel } from '@/features/dashboard/settings/SettingsGeneralPanel';
import { SettingsSecurityPanel } from '@/features/dashboard/settings/SettingsSecurityPanel';
import { SettingsConnectionsPanel } from '@/features/dashboard/settings/SettingsConnectionsPanel';
import { SettingsModals } from '@/features/dashboard/settings/SettingsModals';
import { useSettingsController } from '@/features/dashboard/settings/useSettingsController';
import { SettingsHeroSkeleton } from '@/shared/ui/Skeleton';

export function SettingsView({ active = true }: { active?: boolean }) {
    const s = useSettingsController(active);

    if (s.loading && !s.profile) {
        return (
            <div className={fadeIn}>
                <SettingsHeroSkeleton />
            </div>
        );
    }

    return (
        <div className={fadeIn}>
            <SettingsTabs active={s.settingsTab} onChange={s.changeSettingsTab} />

            <SettingsTabPanel id="general" active={s.settingsTab}>
                <SettingsGeneralPanel
                    userId={s.session.userId}
                    profile={s.profile}
                    exportLoading={s.exportLoading}
                    onCopyId={() => void s.copyId()}
                    onExport={() => void s.exportData()}
                    onPreferencesChanged={s.onPreferencesChanged}
                />
            </SettingsTabPanel>

            <SettingsTabPanel id="seguridad" active={s.settingsTab}>
                <SettingsSecurityPanel
                    apiKey={s.apiKeyDisplay}
                    keyVisible={s.keyVisible}
                    onToggleKey={s.toggleKeyVisibility}
                    onCopyKey={() => void s.copyKey()}
                    onRegenKey={() => s.setRegenOpen(true)}
                    onFocusDanger={s.focusDangerZone}
                    dangerZoneRef={s.dangerZoneRef}
                    onClearData={s.openClearDataModal}
                    onDeleteAccount={s.openDeleteAccountModal}
                />
            </SettingsTabPanel>

            <SettingsTabPanel id="conexiones" active={s.settingsTab}>
                <SettingsConnectionsPanel
                    discordId={s.profile?.discordId}
                    discordUsername={s.profile?.discordUsername}
                    discordAvatar={s.profile?.discordAvatar}
                    busy={s.discordBusy}
                    onLinkClick={() => s.setDiscordLinkOpen(true)}
                    onUnlinkClick={() => s.setDiscordUnlinkOpen(true)}
                />
            </SettingsTabPanel>

            <SettingsModals
                regenOpen={s.regenOpen}
                onCloseRegen={() => s.setRegenOpen(false)}
                onConfirmRegen={s.regenerateKey}
                discordLinkOpen={s.discordLinkOpen}
                onCloseDiscordLink={() => s.setDiscordLinkOpen(false)}
                onConfirmDiscordLink={s.startDiscordLink}
                discordUnlinkOpen={s.discordUnlinkOpen}
                discordBusy={s.discordBusy}
                discordUsername={s.profile?.discordUsername}
                onCloseDiscordUnlink={() => s.setDiscordUnlinkOpen(false)}
                onConfirmDiscordUnlink={s.unlinkDiscord}
                discordResult={s.discordResult}
                onCloseDiscordResult={() => s.setDiscordResult(null)}
                dangerModal={s.dangerModal}
                onCloseDanger={() => s.setDangerModal(null)}
            />
        </div>
    );
}
