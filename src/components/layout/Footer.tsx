import { useEffect, useState } from 'react';
import { appPath } from '@/lib/paths';

const LEGAL_LINKS = [
    { href: '/privacidad', label: 'Privacidad' },
    { href: '/terminos', label: 'Términos' },
    { href: '/cookies', label: 'Cookies' }
] as const;

interface FooterProps {
    isDashboard?: boolean;
}

export function Footer({ isDashboard = false }: FooterProps) {
    const year = new Date().getFullYear();
    const [site, setSite] = useState({ hostname: 'www.losperris.dev', origin: 'https://www.losperris.dev' });

    useEffect(() => {
        setSite({
            hostname: window.location.hostname,
            origin: window.location.origin
        });
    }, []);

    return (
        <footer className={`app-footer mt-auto w-full shrink-0 border-t border-white/[0.08] bg-[#09090b] py-8 ${isDashboard ? 'lg:pl-[280px]' : ''}`}>
            <div className="footer-content mx-auto flex w-full max-w-[1200px] flex-col items-center px-5 text-center text-[0.9rem] text-[#a1a1aa]">
                <div className="mb-3 flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[0.8rem]">
                    {LEGAL_LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={appPath(link.href)}
                            className="text-[#a1a1aa] underline underline-offset-2 transition hover:text-white"
                        >
                            {link.label}
                        </a>
                    ))}
                </div>
                <p className="w-full text-center text-[#a1a1aa]">
                    &copy; {year}{' '}
                    <a
                        href={site.origin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#a78bfa] underline underline-offset-2 transition hover:text-[#9146ff]"
                    >
                        {site.hostname}
                    </a>
                    . Creado para la comunidad. No afiliado con Twitch o Amazon.
                </p>
            </div>
        </footer>
    );
}
