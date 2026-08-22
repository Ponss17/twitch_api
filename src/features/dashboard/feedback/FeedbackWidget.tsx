import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';

export function FeedbackWidget() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-6 right-6 z-50 p-3.5 bg-brand-main text-white rounded-full shadow-lg shadow-brand-main/20 hover:bg-brand-hover hover:scale-105 hover:shadow-brand-main/30 active:scale-95 transition-all duration-200 group"
                aria-label="Enviar Feedback"
            >
                <MessageSquarePlus className="w-6 h-6 group-hover:-rotate-12 transition-transform duration-300" />
            </button>

            <FeedbackModal open={open} onClose={() => setOpen(false)} />
        </>
    );
}
