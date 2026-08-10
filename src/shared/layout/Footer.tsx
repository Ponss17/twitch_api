import { Fragment } from 'react';
import { legalPath } from '@/core/config/paths';
import { APP_BOTTOM_BAR } from '@/core/utils/tw';

const LEGAL_LINKS = [
    { href: legalPath('terminos'), label: 'Términos' },
    { href: legalPath('privacidad'), label: 'Privacidad' },
    { href: '/docs', label: 'API Docs' }
] as const;

interface FooterProps {
    isDashboard?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export function Footer({ isDashboard = false }: FooterProps) {
    const year = new Date().getFullYear();

    return (
        <footer
            className={`app-footer mt-auto flex w-full items-center bg-bg-main ${
                isDashboard
                    ? `${APP_BOTTOM_BAR} max-lg:h-auto max-lg:py-4 lg:pl-[240px]`
                    : 'shrink-0 border-t border-border-subtle py-6'
            }`}
        >
            <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-2 px-6 text-[0.75rem] leading-none text-text-muted md:flex-row md:items-center md:justify-between md:gap-6">
                <p className="flex min-w-0 flex-1 items-center justify-center gap-1.5 font-medium text-text-main md:justify-start">
                    <span>
                        &copy; {year}{' '}
                        <span className="font-bold text-[color:var(--brand-text)]">LosPerrisAPI</span>
                    </span>
                </p>

                <p className="min-w-0 flex-1 text-center">
                    Creado para la comunidad. No afiliado con Twitch o Amazon.
                </p>

                <nav
                    className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-x-3 gap-y-1 md:justify-end"
                    aria-label="Enlaces legales"
                >
                    {LEGAL_LINKS.map((link, i) => (
                        <Fragment key={link.href}>
                            {i > 0 ? (
                                <span className="select-none opacity-50" aria-hidden="true">
                                    ·
                                </span>
                            ) : null}
                            <a
                                href={link.href}
                                className="font-medium text-text-muted transition-colors hover:text-brand-text"
                            >
                                {link.label}
                            </a>
                        </Fragment>
                    ))}
                </nav>
            </div>
        </footer>
    );
}
