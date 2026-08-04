import { useCallback, useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { ArrowLeft, FileText, HardDrive, Scale, Shield } from 'lucide-react';
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
import { useTranslation } from '@/core/i18n/I18nContext';

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
        id: 'almacenamiento',
        label: 'Almacenamiento',
        title: 'Política de almacenamiento',
        description: 'Uso de cookies, almacenamiento local y tecnologías similares.',
        icon: HardDrive,
        Content: CookiesSectionContent
    }
];

const DEFAULT_SECTION: LegalSection = 'privacidad';

const prose =
    'text-[0.9375rem] leading-[1.8] text-text-muted [&_h2]:mt-9 [&_h2]:mb-3 [&_h2]:border-b [&_h2]:border-border-subtle [&_h2]:pb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-text-main [&_h2:first-of-type]:mt-0 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-2.5 [&_ul]:pl-5 [&_li]:text-text-muted [&_a]:text-brand-text [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-semibold [&_strong]:text-text-main';

function parseHash(): LegalSection {
    if (typeof window === 'undefined') return DEFAULT_SECTION;
    const raw = window.location.hash.replace(/^#/, '');
    const hash = raw === 'cookies' ? 'almacenamiento' : raw;
    return SECTIONS.some((s) => s.id === hash) ? (hash as LegalSection) : DEFAULT_SECTION;
}

export function LegalPage() {
    const [active, setActive] = useState<LegalSection>(DEFAULT_SECTION);
    const { t } = useTranslation();

    const selectSection = useCallback((id: LegalSection) => {
        setActive(id);
        const next = `#${id}`;
        if (window.location.hash !== next) {
            window.history.replaceState(null, '', next);
        }
    }, []);

    useEffect(() => {
        const sync = () => {
            if (window.location.hash === '#cookies') {
                window.history.replaceState(null, '', '#almacenamiento');
            }
            setActive(parseHash());
        };
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
            <header className="sticky top-0 z-10 border-b border-border-strong bg-bg-main/95 backdrop-blur-md">
                <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-4">
                    <a
                        href={appPath('/')}
                        onClick={handleBack}
                        className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-text-muted no-underline transition hover:text-text-main"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Volver
                    </a>
                    <nav
                        className="flex gap-1 rounded-lg border border-border-strong bg-bg-card p-1"
                        aria-label={t.common.aria.legalSections}
                    >
                        {SECTIONS.map((section) => (
                            <button
                                key={section.id}
                                type="button"
                                onClick={() => selectSection(section.id)}
                                className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                                    active === section.id
                                        ? 'bg-primary text-white'
                                        : 'text-text-muted hover:bg-text-main/5 hover:text-text-main'
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
                <div
                    key={active}
                    className="animate-fade-soft rounded-2xl border border-border-strong bg-bg-card/60 p-6 sm:p-8"
                >
                    <div className="mb-6 flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                                Documentación legal
                            </p>
                            <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-text-main sm:text-3xl">
                                {current.title}
                            </h1>
                            <p className="text-sm leading-relaxed text-text-muted">{current.description}</p>
                        </div>
                        <div
                            className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 text-primary"
                            aria-hidden="true"
                        >
                            <SectionIcon className="h-5 w-5" />
                        </div>
                    </div>

                    <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border-subtle pb-6 text-xs text-text-muted">
                        <span>
                            Servicio: <strong className="font-medium text-text-muted">{LEGAL_OPERATOR}</strong>
                        </span>
                        <span>Última actualización: {LEGAL_UPDATED}</span>
                    </div>

                    <article className={prose}>
                        <Content />
                    </article>

                    <footer id="contacto" className="mt-8 border-t border-border-subtle pt-6">
                        <h2 className="mb-2 text-sm font-bold text-text-main">Contacto</h2>
                        <p className="mb-0 text-sm leading-relaxed text-text-muted">
                            Si tienes dudas sobre privacidad, términos o seguridad, escríbenos en Discord:{' '}
                            <a
                                href={LEGAL_DISCORD_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-brand-text underline underline-offset-2"
                            >
                                @{LEGAL_CONTACT_DISCORD}
                            </a>
                            .
                        </p>
                    </footer>
                </div>
            </main>
        </div>
    );
}
