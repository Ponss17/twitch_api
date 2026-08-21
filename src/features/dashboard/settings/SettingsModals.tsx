import { DangerConfirmModal, RegenKeyModal } from '@/shared/ui/Modal';
import {
    DiscordLinkConfirmModal,
    DiscordUnlinkConfirmModal,
    DiscordResultModal,
    type DiscordResultKind
} from '@/features/dashboard/settings/DiscordLinkModals';
import type { SettingsDangerModal } from '@/features/dashboard/settings/settingsTypes';
import { useTranslation } from '@/core/i18n/I18nContext';

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

function ClearScopeOptions({
    scopes,
    onChange
}: {
    scopes: NonNullable<SettingsDangerModal['clearScopes']>;
    onChange: NonNullable<SettingsDangerModal['onClearScopesChange']>;
}) {
    const { t } = useTranslation();
    const m = t.settings.dangerModals;

    const row = (
        id: 'stats' | 'questions',
        checked: boolean,
        title: string,
        hint: string
    ) => (
        <label
            htmlFor={`clear-scope-${id}`}
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-border-subtle bg-bg-main/40 px-3 py-2.5"
        >
            <input
                id={`clear-scope-${id}`}
                type="checkbox"
                className="mt-0.5 size-4 shrink-0 accent-primary"
                checked={checked}
                onChange={(e) => onChange({ ...scopes, [id]: e.target.checked })}
            />
            <span className="min-w-0">
                <span className="block text-[0.85rem] font-medium text-text-main">{title}</span>
                <span className="mt-0.5 block text-[0.75rem] leading-snug text-text-muted">{hint}</span>
            </span>
        </label>
    );

    return (
        <fieldset className="mt-3 mb-1 space-y-2 border-0 p-0">
            <legend className="mb-1.5 text-[0.75rem] font-semibold uppercase tracking-wide text-text-muted">
                {m.resetScopesLabel}
            </legend>
            {row('stats', scopes.stats, m.resetScopeStats, m.resetScopeStatsHint)}
            {row('questions', scopes.questions, m.resetScopeQuestions, m.resetScopeQuestionsHint)}
            {!scopes.stats && !scopes.questions ? (
                <p className="text-[0.75rem] text-error">{m.resetScopesRequired}</p>
            ) : null}
        </fieldset>
    );
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
    const scopes = dangerModal?.clearScopes;
    const canConfirm = scopes ? scopes.stats || scopes.questions : true;

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

            {dangerModal ? (
                <DangerConfirmModal
                    open
                    onClose={onCloseDanger}
                    title={dangerModal.title}
                    description={dangerModal.desc}
                    confirmWord={dangerModal.word}
                    confirmLabel={dangerModal.confirmLabel}
                    canConfirm={canConfirm}
                    onConfirm={dangerModal.action}
                >
                    {scopes && dangerModal.onClearScopesChange ? (
                        <ClearScopeOptions scopes={scopes} onChange={dangerModal.onClearScopesChange} />
                    ) : null}
                </DangerConfirmModal>
            ) : null}
        </>
    );
}
