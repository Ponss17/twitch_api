import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
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
                className="fixed right-5 bottom-20 z-50 flex size-12 items-center justify-center rounded-full bg-primary-btn text-white shadow-lg transition hover:bg-primary-hover hover:scale-105 active:scale-95 lg:bottom-16"
                aria-label={t.feedback.widgetAria}
            >
                <MessageSquarePlus className="size-5" aria-hidden />
            </button>

            <FeedbackModal open={open} onClose={() => setOpen(false)} />
        </>
    );
}
