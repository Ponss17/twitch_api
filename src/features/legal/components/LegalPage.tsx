import { useCallback, useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { appPath, type LegalSection } from '@/core/config/paths';
import { LEGAL_UPDATED } from '@/features/legal/lib/legalConstants';
import {
    CookiesSectionContent,
    PrivacySectionContent,
    TermsSectionContent
} from '@/features/legal/components/LegalSectionContent';

const SECTIONS: {
    id: LegalSection;
    label: string;
    description: string;
    Content: () => ReactNode;
}[] = [
    {
        id: 'privacidad',
        label: 'Privacidad',
        description: 'Qué datos usamos y por qué.',
        Content: PrivacySectionContent
    },
    {
        id: 'terminos',
        label: 'Términos',
        description: 'Reglas básicas para usar LosPerris Twitch API.',
        Content: TermsSectionContent
    },
    {
        id: 'cookies',
        label: 'Cookies',
        description: 'Qué guarda tu navegador al usar el panel.',
        Content: CookiesSectionContent
    }
];

const DEFAULT_SECTION: LegalSection = 'privacidad';

const prose =
    'text-[0.9375rem] leading-[1.75] text-[#c4c4cc] [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-white [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[#fafafa] [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_li]:text-[#c4c4cc] [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-semibold [&_strong]:text-[#fafafa]';

function parseHash(): LegalSection {
    if (typeof window === 'undefined') return DEFAULT_SECTION;
    const hash = window.location.hash.replace(/^#/, '');
    return SECTIONS.some((s) => s.id === hash) ? (hash as LegalSection) : DEFAULT_SECTION;
}

export function LegalPage() {
    const [active, setActive] = useState<LegalSection>(DEFAULT_SECTION);

    const selectSection = useCallback((id: LegalSection) => {
        setActive(id);
        const next = `#${id}`;
        if (window.location.hash !== next) {
            window.history.replaceState(null, '', next);
        }
    }, []);

    useEffect(() => {
        const sync = () => setActive(parseHash());
        sync();
        window.addEventListener('hashchange', sync);
        return () => window.removeEventListener('hashchange', sync);
    }, []);

    useEffect(() => {
        if (!window.location.hash) {
            window.history.replaceState(null, '', `#${DEFAULT_SECTION}`);
        }
    }, []);

    const handleBack = (e: MouseEvent<HTMLAnchorElement>) => {
        if (document.referrer && document.referrer.includes(window.location.hostname)) {
            e.preventDefault();
            window.history.back();
        }
    };

    const current = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0];
    const Content = current.Content;

    return (
        <div className="flex flex-1 flex-col bg-bg-main">
            <header className="sticky top-0 z-10 border-b border-white/[0.08] bg-bg-main/95 backdrop-blur-md">
                <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-4">
                    <a
                        href={appPath('/')}
                        onClick={handleBack}
                        className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-[#c4c4cc] no-underline transition hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Volver
                    </a>
                    <nav
                        className="flex gap-1 rounded-lg border border-white/[0.08] bg-bg-card p-1"
                        aria-label="Secciones legales"
                    >
                        {SECTIONS.map((section) => (
                            <button
                                key={section.id}
                                type="button"
                                onClick={() => selectSection(section.id)}
                                className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                                    active === section.id
                                        ? 'bg-primary text-white'
                                        : 'text-[#c4c4cc] hover:bg-white/5 hover:text-white'
                                }`}
                                aria-current={active === section.id ? 'page' : undefined}
                            >
                                {section.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </header>

            <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
                <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-white">Legal</h1>
                <p className="mb-1 text-sm text-[#c4c4cc]">{current.description}</p>
                <p className="mb-8 text-xs text-[#71717a]">Última actualización: {LEGAL_UPDATED}</p>

                <article key={active} className={`${prose} animate-fade-soft`}>
                    <Content />
                </article>
            </main>
        </div>
    );
}
