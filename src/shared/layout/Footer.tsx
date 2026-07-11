import { legalPath } from '@/core/config/paths';

const SITE_LABEL = 'www.losperris.dev';
const SITE_URL = 'https://www.losperris.dev';

const LEGAL_LINKS = [
    { href: legalPath('privacidad'), label: 'Privacidad' },
    { href: legalPath('terminos'), label: 'Términos' },
    { href: legalPath('almacenamiento'), label: 'Almacenamiento' }
] as const;

interface FooterProps {
    isDashboard?: boolean;
}

export function Footer({ isDashboard = false }: FooterProps) {
    const year = new Date().getFullYear();

    return (
        <footer className={`app-footer mt-auto w-full shrink-0 border-t border-white/[0.08] bg-[#09090b] py-8 ${isDashboard ? 'lg:pl-[280px]' : ''}`}>
            <div className="footer-content mx-auto flex w-full max-w-[1200px] flex-col items-center px-5 text-center text-[0.9rem] text-[#a1a1aa]">
                <div className="mb-3 flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[0.8rem]">
                    {LEGAL_LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="text-[#a1a1aa] underline underline-offset-2 transition hover:text-white"
                        >
                            {link.label}
                        </a>
                    ))}
                </div>
                <p className="w-full text-center text-[#a1a1aa]">
                    &copy; {year}{' '}
                    <a
                        href={SITE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#a78bfa] underline underline-offset-2 transition hover:text-[#9146ff]"
                    >
                        {SITE_LABEL}
                    </a>
                    . Creado para la comunidad. No afiliado con Twitch o Amazon.
                </p>
            </div>
        </footer>
    );
}
