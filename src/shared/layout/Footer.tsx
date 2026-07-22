import { legalPath } from '@/core/config/paths';

const LEGAL_LINKS = [
    { href: legalPath('terminos'), label: 'Términos' },
    { href: legalPath('privacidad'), label: 'Privacidad' },
    { href: '/docs', label: 'API Docs' }
] as const;

interface FooterProps {
    isDashboard?: boolean;
}

export function Footer({ isDashboard = false }: FooterProps) {
    const year = new Date().getFullYear();

    return (
        <footer className={`app-footer mt-auto w-full shrink-0 border-t border-white/[0.04] bg-[#09090b] py-6 ${isDashboard ? 'lg:pl-[240px]' : ''}`}>
            <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-6 px-6 text-[0.75rem] md:flex-row md:gap-4">
                <div className="flex-1">
                    <p className="flex items-center justify-center gap-1.5 font-medium text-zinc-300 md:justify-start">
                        &copy; {year} <span className="font-bold text-[#9146ff]">LosPerrisAPI</span>
                    </p>
                </div>

                <div className="flex-1 text-center text-[0.7rem] text-zinc-400">
                    Creado para la comunidad. No afiliado con Twitch o Amazon.
                </div>
                
                <div className="flex flex-1 flex-wrap items-center justify-center gap-3 text-zinc-400 md:justify-end">
                    {LEGAL_LINKS.map((link, i) => (
                        <span key={link.href} className="flex items-center gap-3">
                            <a
                                href={link.href}
                                className="font-medium transition-colors hover:text-[#a78bfa]"
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
