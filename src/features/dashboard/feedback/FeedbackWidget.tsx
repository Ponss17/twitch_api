import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useTranslation } from '@/core/i18n/I18nContext';
import { FeedbackModal } from './FeedbackModal';

export function FeedbackWidget() {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="fixed right-5 bottom-20 z-50 flex size-11 items-center justify-center rounded-xl border border-primary/50 bg-bg-panel/55 text-primary shadow-lg backdrop-blur-md transition hover:border-primary hover:bg-primary/10 active:scale-95 lg:bottom-16"
                aria-label={t.feedback.widgetAria}
            >
                <MessageSquare className="size-5" strokeWidth={1.75} aria-hidden />
            </button>

            <FeedbackModal open={open} onClose={() => setOpen(false)} />
        </>
    );
}
