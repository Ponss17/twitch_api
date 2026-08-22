import { useState } from 'react';
import { useTranslation } from '@/core/i18n/I18nContext';
import { FeedbackModal } from './FeedbackModal';

/** Botón de feedback para el header del panel (abre el modal). */
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
                className={`inline-flex h-9 items-center justify-center rounded-xl border px-3 text-[0.8125rem] font-medium transition-colors ${
                    open
                        ? 'border-primary/30 bg-primary/[0.08] text-text-main'
                        : 'border-border-subtle bg-bg-secondary text-text-muted hover:border-border-strong hover:bg-white/[0.02] hover:text-text-main'
                }`}
                aria-label={t.feedback.widgetAria}
            >
                {t.sidebar.items.feedback}
            </button>

            <FeedbackModal open={open} onClose={() => setOpen(false)} />
        </>
    );
}
