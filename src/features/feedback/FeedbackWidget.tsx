import { useState } from 'react';
import { useTranslation } from '@/core/i18n/I18nContext';
import { FeedbackModal } from './FeedbackModal';
import { hoverSubtleControl } from '@/core/utils/tw';

export function FeedbackWidget() {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-expanded={open}
                aria-haspopup="dialog"
                className={`inline-flex h-9 items-center justify-center rounded-lg border border-border-subtle bg-bg-secondary px-3 text-[0.8125rem] font-medium text-text-muted ${hoverSubtleControl} hover:text-text-main ${
                    open ? 'border-border-strong bg-white/[0.03] text-text-main' : ''
                }`}
                aria-label={t.feedback.widgetAria}
            >
                {t.sidebar.items.feedback}
            </button>

            <FeedbackModal open={open} onClose={() => setOpen(false)} />
        </>
    );
}
