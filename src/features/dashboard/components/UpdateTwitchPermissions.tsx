import { useState } from 'react';
import { reauthorizeTwitchPermissions } from '@/core/api/auth';
import { useTranslation } from '@/core/i18n/I18nContext';
import { Sheet } from '@/shared/ui/Sheet';
import type { AnnouncementPermissionHint } from '@/features/dashboard/announcements/announcements';

export type TwitchPermissionHint = AnnouncementPermissionHint;

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
        <Sheet
            open={open}
            onClose={() => {
                if (updating) return;
                onClose();
            }}
            title={aT.updatePermissionsTitle}
            description={aT.updatePermissionsIntro}
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
            {labels.length > 0 ? (
                <ul className="space-y-2 text-sm text-text-main">
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
        </Sheet>
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
                hints={hints}
            />
        </>
    );
}
