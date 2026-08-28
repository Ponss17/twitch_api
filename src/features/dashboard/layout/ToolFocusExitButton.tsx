import { Minimize2 } from 'lucide-react';
import { useToolFocus } from '@/features/dashboard/lib/ui/ToolFocusContext';
import { useTranslation } from '@/core/i18n/I18nContext';
import { hoverSubtleIconBtn } from '@/core/utils/tw';

export function ToolFocusExitButton() {
    const { focusMode, exitFocusMode } = useToolFocus();
    const { t } = useTranslation();

    if (!focusMode) return null;

    return (
        <button
            type="button"
            onClick={exitFocusMode}
            className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-text-muted ${hoverSubtleIconBtn}`}
            aria-label={t.header.exitFocusMode}
            title={t.header.exitFocusMode}
        >
            <Minimize2 className="size-4" aria-hidden />
        </button>
    );
}
