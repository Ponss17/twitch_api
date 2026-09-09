import { useState } from 'react';
import { BookOpen, Bot, Sparkles, X } from 'lucide-react';
import type { DashboardTab } from '@/core/config/config';
import { appPath, saveDocsReturnPath } from '@/core/config/paths';
import { readScopedPref, writeScopedPref } from '@/core/session/localPrefs';
import { useRequiredSession } from '@/core/session/useSession';
import { useTranslation } from '@/core/i18n/I18nContext';
import { btnSecondary, hoverSubtleIconBtn } from '@/core/utils/tw';

export const HOME_ONBOARDING_DISMISS_PREF = 'home_onboarding_dismissed';

interface HomeEmptyOnboardingProps {
    onNavigate?: (tab: DashboardTab) => void;
}

export function HomeEmptyOnboarding({ onNavigate }: HomeEmptyOnboardingProps) {
    const session = useRequiredSession();
    const { t } = useTranslation();
    const oT = t.home.onboarding;
    const [dismissed, setDismissed] = useState(
        () => readScopedPref(HOME_ONBOARDING_DISMISS_PREF, session.userId) === '1'
    );

    if (dismissed) return null;

    const dismiss = () => {
        writeScopedPref(HOME_ONBOARDING_DISMISS_PREF, session.userId, '1');
        setDismissed(true);
    };

    return (
        <div className="mb-5 rounded-xl border border-border-subtle bg-bg-secondary/40 px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 shrink-0 text-brand-text" aria-hidden />
                        <h3 className="text-[0.95rem] font-semibold text-text-main">{oT.title}</h3>
                    </div>
                    <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-text-muted">{oT.desc}</p>
                </div>
                <button
                    type="button"
                    onClick={dismiss}
                    title={oT.dismiss}
                    aria-label={oT.dismiss}
                    className={`inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-border-subtle text-text-muted ${hoverSubtleIconBtn}`}
                >
                    <X className="h-3.5 w-3.5" aria-hidden />
                </button>
            </div>

            <div className="mt-3.5 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => onNavigate?.('followage')}
                    className={`${btnSecondary} inline-flex items-center gap-1.5`}
                >
                    <Bot className="h-3.5 w-3.5" aria-hidden />
                    {oT.ctaFollowage}
                </button>
                <a
                    href={appPath('/docs')}
                    onClick={saveDocsReturnPath}
                    className={`${btnSecondary} inline-flex items-center gap-1.5 no-underline`}
                >
                    <BookOpen className="h-3.5 w-3.5" aria-hidden />
                    {oT.ctaDocs}
                </a>
                <button
                    type="button"
                    onClick={dismiss}
                    className="px-2.5 py-1.5 text-[0.75rem] font-medium text-text-muted transition hover:text-text-main"
                >
                    {oT.dismiss}
                </button>
            </div>
        </div>
    );
}
