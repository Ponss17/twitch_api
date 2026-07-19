import { DangerConfirmModal, RegenKeyModal } from '@/shared/ui/Modal';
import {
    DiscordLinkConfirmModal,
    DiscordUnlinkConfirmModal,
    DiscordResultModal,
    type DiscordResultKind
} from '@/features/dashboard/settings/DiscordLinkModals';
import type { SettingsDangerModal } from '@/features/dashboard/settings/settingsTypes';

interface SettingsModalsProps {
    regenOpen: boolean;
    onCloseRegen: () => void;
    onConfirmRegen: () => void | Promise<void>;
    discordLinkOpen: boolean;
    onCloseDiscordLink: () => void;
    onConfirmDiscordLink: () => void;
    discordUnlinkOpen: boolean;
    discordBusy: boolean;
    discordUsername?: string | null;
    onCloseDiscordUnlink: () => void;
    onConfirmDiscordUnlink: () => void | Promise<void>;
    discordResult: DiscordResultKind | null;
    onCloseDiscordResult: () => void;
    dangerModal: SettingsDangerModal | null;
    onCloseDanger: () => void;
}

export function SettingsModals({
    regenOpen,
    onCloseRegen,
    onConfirmRegen,
    discordLinkOpen,
    onCloseDiscordLink,
    onConfirmDiscordLink,
    discordUnlinkOpen,
    discordBusy,
    discordUsername,
    onCloseDiscordUnlink,
    onConfirmDiscordUnlink,
    discordResult,
    onCloseDiscordResult,
    dangerModal,
    onCloseDanger
}: SettingsModalsProps) {
    return (
        <>
            <RegenKeyModal open={regenOpen} onClose={onCloseRegen} onConfirm={onConfirmRegen} />

            <DiscordLinkConfirmModal
                open={discordLinkOpen}
                onClose={onCloseDiscordLink}
                onConfirm={onConfirmDiscordLink}
            />

            <DiscordUnlinkConfirmModal
                open={discordUnlinkOpen}
                busy={discordBusy}
                username={discordUsername}
                onClose={onCloseDiscordUnlink}
                onConfirm={onConfirmDiscordUnlink}
            />

            <DiscordResultModal
                open={discordResult != null}
                kind={discordResult}
                onClose={onCloseDiscordResult}
            />

            <DangerConfirmModal
                open={!!dangerModal}
                onClose={onCloseDanger}
                title={dangerModal?.title ?? ''}
                description={dangerModal?.desc ?? ''}
                confirmWord={dangerModal?.word ?? ''}
                confirmLabel={dangerModal?.confirmLabel}
                onConfirm={dangerModal?.action ?? (async () => {})}
            />
        </>
    );
}
