import { legalPath } from '@/core/config/paths';

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
        <footer className={`app-footer mt-auto w-full shrink-0 border-t border-border-subtle bg-bg-main py-6 ${isDashboard ? 'lg:pl-[240px]' : ''}`}>
            <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-6 px-6 text-[0.75rem] md:flex-row md:gap-4">
                <div className="flex-1">
                    <p className="flex items-center justify-center gap-1.5 font-medium text-text-main md:justify-start">
                        &copy; {year} <span className="font-bold text-[color:var(--brand-text)]">LosPerrisAPI</span>
                    </p>
                </div>

                <div className="flex-1 text-center text-[0.7rem] text-text-muted">
                    Creado para la comunidad. No afiliado con Twitch o Amazon.
                </div>
                
                <div className="flex flex-1 flex-wrap items-center justify-center gap-3 text-text-muted md:justify-end">
                    {LEGAL_LINKS.map((link, i) => (
                        <span key={link.href} className="flex items-center gap-3">
                            <a
                                href={link.href}
                                className="font-medium text-text-muted transition-colors hover:text-brand-text"
                            >
                                {link.label}
                            </a>
                            {i < LEGAL_LINKS.length - 1 && <span>•</span>}
                        </span>
                    ))}
                </div>
            </div>
        </footer>
    );
}
