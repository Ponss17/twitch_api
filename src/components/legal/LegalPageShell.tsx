import type { ReactNode, MouseEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import { appPath } from '@/lib/paths';

const LEGAL_LINKS = [
    { href: '/privacidad', label: 'Privacidad' },
    { href: '/terminos', label: 'Términos' },
    { href: '/cookies', label: 'Cookies' }
] as const;

const prose =
    'text-[0.9375rem] leading-[1.75] text-[#c4c4cc] [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-white [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[#fafafa] [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_li]:text-[#c4c4cc] [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-semibold [&_strong]:text-[#fafafa]';

interface LegalPageShellProps {
    title: string;
    description: string;
    current: (typeof LEGAL_LINKS)[number]['href'];
    updated: string;
    children: ReactNode;
}

export function LegalPageShell({ title, description, current, updated, children }: LegalPageShellProps) {
    const handleBack = (e: MouseEvent<HTMLAnchorElement>) => {
        if (document.referrer && document.referrer.includes(window.location.hostname)) {
            e.preventDefault();
            window.history.back();
        }
    };

    return (
        <div className="flex flex-1 flex-col bg-bg-main">
            <header className="border-b border-white/[0.08] bg-bg-secondary/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
                    <a
                        href={appPath('/')}
                        onClick={handleBack}
                        className="inline-flex items-center gap-2 text-sm font-medium text-[#c4c4cc] no-underline transition hover:text-white"
                    >
                        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                        Volver
                    </a>
                    <nav className="flex gap-1 rounded-lg border border-white/[0.08] bg-black/20 p-1">
                        {LEGAL_LINKS.map((link) => (
                            <a
                                key={link.href}
                                href={appPath(link.href)}
                                className={`rounded-md px-3 py-1.5 text-xs font-semibold no-underline transition ${
                                    current === link.href
                                        ? 'bg-primary text-white'
                                        : 'text-[#c4c4cc] hover:bg-white/5 hover:text-white'
                                }`}
                                aria-current={current === link.href ? 'page' : undefined}
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>
                </div>
            </header>

            <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
                <p className="mb-2 text-xs font-semibold tracking-[0.12em] text-primary uppercase">Legal</p>
                <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-white">{title}</h1>
                <p className="mb-1 text-sm text-[#71717a]">{description}</p>
                <p className="mb-8 text-xs text-[#71717a]">Última actualización: {updated}</p>
                <article className={prose}>{children}</article>
            </main>
        </div>
    );
}
