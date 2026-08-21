import { useOverlayMirror } from '@/features/overlay/hooks/useOverlayMirror';
import { useQuestionsOverlayVisible } from '@/features/overlay/hooks/useOverlayVisibilityClock';
import { QuestionsOverlayDisplay } from '@/features/tools/questions/QuestionsOverlayDisplay';
import { OverlayConnectionBanners } from '@/features/overlay/components/OverlayConnectionBanners';
import { OverlaySessionGate } from '@/features/overlay/components/OverlaySessionGate';
import { OverlaySessionProvider } from '@/features/overlay/components/OverlaySessionProvider';
import { OverlayAppearanceRoot } from '@/features/overlay/components/OverlayAppearanceRoot';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import type { QuestionsOverlayState } from '@/features/overlay/lib/types';
import type { Session } from '@/core/config/config';
import { I18nProvider, useTranslation } from '@/core/i18n/I18nContext';

function OverlayQuestionsContent({ session }: { session: Session }) {
    const { state, connected, stale } = useOverlayMirror('questions', session);
    const questionsState = state as QuestionsOverlayState;
    const visible = useQuestionsOverlayVisible(questionsState);

    if (!visible) {
        return <div className="min-h-screen" aria-hidden />;
    }

    return (
        <OverlayAppearanceRoot>
            <OverlayConnectionBanners connected={connected} stale={stale} />
            <QuestionsOverlayDisplay state={questionsState} />
        </OverlayAppearanceRoot>
    );
}

function OverlayQuestionsApp() {
    return (
        <OverlaySessionGate>
            {(session) => <OverlayQuestionsContent session={session} />}
        </OverlaySessionGate>
    );
}

function OverlayQuestionsBoundary() {
    const { t } = useTranslation();
    return (
        <ErrorBoundary title={t.overlay.apps.questionsErrorTitle}>
            <OverlayQuestionsApp />
        </ErrorBoundary>
    );
}

/** Raíz única para Astro (un solo client:only — SessionProvider envuelve el árbol). */
export function OverlayQuestionsRoot() {
    return (
        <I18nProvider>
            <OverlaySessionProvider requireAuth>
                <OverlayQuestionsBoundary />
            </OverlaySessionProvider>
        </I18nProvider>
    );
}
