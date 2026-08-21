import { MessageCircleQuestion } from 'lucide-react';
import type { QuestionsOverlayState } from '@/features/overlay/lib/types';
import { useTranslation } from '@/core/i18n/I18nContext';

export function QuestionsOverlayDisplay({ state }: { state: QuestionsOverlayState }) {
    const { t } = useTranslation();
    const qT = t.tools.questions;
    const oT = t.overlay.questions;
    const current = state.current;
    const waiting = !current && state.isActive;
    const queueLabel = oT.queue.replace('{count}', String(Math.max(0, state.pendingCount)));

    return (
        <div className="flex min-h-screen items-end justify-start overflow-hidden p-4 text-text-main">
            <article className="w-full max-w-[720px] rounded-2xl border border-primary/35 bg-black/55 px-5 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md">
                <header className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                        <MessageCircleQuestion className="size-5 shrink-0 text-primary" aria-hidden />
                        <p className="truncate text-[0.75rem] font-bold tracking-widest text-primary uppercase">
                            {current ? oT.now : waiting ? oT.waitingTitle : qT.title}
                        </p>
                    </div>
                    {state.pendingCount > 0 && (
                        <span className="shrink-0 rounded-full bg-primary/20 px-2 py-0.5 text-[0.7rem] font-semibold text-primary">
                            {queueLabel}
                        </span>
                    )}
                </header>

                {current ? (
                    <>
                        <p className="truncate text-sm font-semibold text-white">{current.displayName}</p>
                        <p className="mt-1 text-[1.15rem] leading-snug font-medium text-white/95 whitespace-pre-wrap break-words">
                            {current.text}
                        </p>
                    </>
                ) : (
                    <p className="text-sm text-white/80">
                        {oT.waitingHint.replace('{keyword}', state.keyword || qT.keywordPlaceholder)}
                    </p>
                )}
            </article>
        </div>
    );
}
