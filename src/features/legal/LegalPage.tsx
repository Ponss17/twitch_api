import { useCallback, useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { ArrowLeft, Cookie, FileText, Scale, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { appPath, type LegalSection } from '@/core/config/paths';
import {
    LEGAL_CONTACT_DISCORD,
    LEGAL_DISCORD_URL,
    LEGAL_OPERATOR,
    LEGAL_UPDATED
} from '@/features/legal/legalConstants';
import {
    CookiesSectionContent,
    PrivacySectionContent,
    TermsSectionContent
} from '@/features/legal/LegalSectionContent';

const SECTIONS: {
    id: LegalSection;
    label: string;
    title: string;
    description: string;
    icon: LucideIcon;
    Content: () => ReactNode;
}[] = [
    {
        id: 'privacidad',
        label: 'Privacidad',
        title: 'Política de privacidad',
        description: 'Información sobre el tratamiento de datos personales.',
        icon: Shield,
        Content: PrivacySectionContent
    },
    {
        id: 'terminos',
        label: 'Términos',
        title: 'Términos de uso',
        description: 'Condiciones de acceso y uso del servicio.',
        icon: Scale,
        Content: TermsSectionContent
    },
    {
        id: 'cookies',
        label: 'Cookies',
        title: 'Política de cookies',
        description: 'Uso de almacenamiento local y tecnologías similares.',
        icon: Cookie,
        Content: CookiesSectionContent
    }
];

const DEFAULT_SECTION: LegalSection = 'privacidad';

const prose =
    'text-[0.9375rem] leading-[1.8] text-[#c4c4cc] [&_h2]:mt-9 [&_h2]:mb-3 [&_h2]:border-b [&_h2]:border-white/[0.06] [&_h2]:pb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-white [&_h2:first-of-type]:mt-0 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-2.5 [&_ul]:pl-5 [&_li]:text-[#c4c4cc] [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-semibold [&_strong]:text-[#fafafa]';

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
    const SectionIcon = current.icon;

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
                <div className="mb-8 rounded-2xl border border-white/[0.08] bg-bg-card/60 p-6">
                    <div className="mb-4 flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                            <SectionIcon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                            <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#71717a]">
                                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                                Documentación legal
                            </p>
                            <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                                {current.title}
                            </h1>
                            <p className="text-sm leading-relaxed text-[#c4c4cc]">{current.description}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/[0.06] pt-4 text-xs text-[#71717a]">
                        <span>
                            Servicio: <strong className="font-medium text-[#a1a1aa]">{LEGAL_OPERATOR}</strong>
                        </span>
                        <span>Última actualización: {LEGAL_UPDATED}</span>
                    </div>
                </div>

                <article key={active} className={`${prose} animate-fade-soft`}>
                    <Content />
                </article>

                <aside className="mt-10 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
                    <h2 className="mb-2 text-sm font-bold text-white">Contacto</h2>
                    <p className="mb-0 text-sm leading-relaxed text-[#c4c4cc]">
                        Para consultas legales, privacidad o incidencias de seguridad, escribe en Discord a{' '}
                        <a
                            href={LEGAL_DISCORD_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary underline underline-offset-2"
                        >
                            @{LEGAL_CONTACT_DISCORD}
                        </a>{' '}
                        en el servidor LosPerris.
                    </p>
                </aside>
            </main>
        </div>
    );
}
