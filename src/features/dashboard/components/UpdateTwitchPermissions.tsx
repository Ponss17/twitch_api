import { useEffect, useRef, useState } from 'react';
import { reauthorizeTwitchPermissions } from '@/core/api/auth';
import { useTranslation } from '@/core/i18n/I18nContext';
import { useRequiredSession } from '@/core/session/useSession';
import { Modal } from '@/shared/ui/modals/Modal';
import type { AnnouncementPermissionHint } from '@/features/dashboard/announcements/announcements';
import { validateSession } from '@/core/auth/validateSession';
import { getSession, saveSession } from '@/core/auth/sessionStorage';

export type TwitchPermissionHint = AnnouncementPermissionHint;

export const PERMISSION_HINT_SCOPES: Record<TwitchPermissionHint, string> = {
    bits: 'bits:read',
    clips: 'channel:manage:clips',
    followers: 'moderator:read:followers',
    chatters: 'moderator:read:chatters',
    chat: 'chat:read'
};

export function missingPermissionHints(
    scopes: readonly string[] | undefined,
    hints: readonly TwitchPermissionHint[]
): TwitchPermissionHint[] {
    if (!scopes) return [...hints];
    return hints.filter((hint) => !scopes.includes(PERMISSION_HINT_SCOPES[hint]));
}

export function useTwitchScopes(): { scopes: string[] | undefined; ready: boolean } {
    const session = useRequiredSession();
    const sessionRef = useRef(session);
    sessionRef.current = session;
    const [scopes, setScopes] = useState<string[] | undefined>(session.scopes);
    const [ready, setReady] = useState(Array.isArray(session.scopes));

    useEffect(() => {
        const current = sessionRef.current;
        if (!session.userId) {
            setReady(true);
            return;
        }
        if (Array.isArray(session.scopes)) {
            setScopes(session.scopes);
            setReady(true);
            return;
        }

        let cancelled = false;
        void (async () => {
            try {
                const result = await validateSession(current);
                const next = Array.isArray(result.scopes)
                    ? result.scopes.filter((s): s is string => typeof s === 'string')
                    : undefined;
                if (cancelled) return;
                if (next) {
                    const stored = getSession();
                    if (stored) saveSession({ ...stored, scopes: next });
                }
                setScopes(next);
            } catch {
                if (!cancelled) setScopes(undefined);
            } finally {
                if (!cancelled) setReady(true);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [session.userId, session.scopes]);

    return { scopes, ready };
}

interface UpdateTwitchPermissionsSheetProps {
    open: boolean;
    onClose: () => void;
    hints?: readonly TwitchPermissionHint[];
    onConfirmStart?: () => void;
}

export function UpdateTwitchPermissionsSheet({
    open,
    onClose,
    hints,
    onConfirmStart
}: UpdateTwitchPermissionsSheetProps) {
    const { t } = useTranslation();
    const aT = t.announcements;
    const [updating, setUpdating] = useState(false);

    const labels = (hints ?? [])
        .map((key) => aT.permissions[key])
        .filter(Boolean);

    const confirm = async () => {
        setUpdating(true);
        onConfirmStart?.();
        try {
            await reauthorizeTwitchPermissions();
        } catch {
            setUpdating(false);
            onClose();
        }
    };

    return (
        <Modal
            open={open}
            onClose={() => {
                if (updating) return;
                onClose();
            }}
            closeDisabled={updating}
            title={aT.updatePermissionsTitle}
            footer={
                <div className="flex flex-wrap justify-end gap-2">
                    <button
                        type="button"
                        disabled={updating}
                        onClick={onClose}
                        className="rounded-lg px-3 py-2 text-sm font-medium text-text-muted hover:bg-bg-secondary hover:text-text-main disabled:opacity-50"
                    >
                        {aT.updatePermissionsCancel}
                    </button>
                    <button
                        type="button"
                        disabled={updating}
                        onClick={() => void confirm()}
                        className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
                    >
                        {updating ? aT.reloginLoading : aT.updatePermissionsConfirm}
                    </button>
                </div>
            }
        >
            <p className="text-sm leading-relaxed text-text-muted">{aT.updatePermissionsIntro}</p>
            {labels.length > 0 ? (
                <ul className="mt-3 space-y-2 text-sm text-text-main">
                    {labels.map((label) => (
                        <li
                            key={label}
                            className="rounded-lg border border-border-subtle bg-bg-secondary px-3 py-2"
                        >
                            {label}
                        </li>
                    ))}
                </ul>
            ) : null}
        </Modal>
    );
}

interface UpdateTwitchPermissionsCalloutProps {
    hints: readonly TwitchPermissionHint[];
    message: string;
    className?: string;
}

export function UpdateTwitchPermissionsCallout({
    hints,
    message,
    className = ''
}: UpdateTwitchPermissionsCalloutProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const { scopes, ready } = useTwitchScopes();
    const missing = missingPermissionHints(scopes, hints);

    if (!ready || missing.length === 0) return null;

    return (
        <>
            <div
                className={`rounded-xl border border-border-subtle bg-bg-secondary/50 px-3 py-3 ${className}`}
            >
                <p className="text-xs leading-snug text-text-muted">{message}</p>
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="mt-2 text-left text-xs font-semibold text-brand-text transition hover:underline"
                >
                    {t.announcements.reloginCta}
                </button>
            </div>
            <UpdateTwitchPermissionsSheet
                open={open}
                onClose={() => setOpen(false)}
                hints={missing}
            />
        </>
    );
}
