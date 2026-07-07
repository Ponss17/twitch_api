import type { ReactNode } from 'react';
import { Home } from 'lucide-react';
import { appPath } from '@/core/config/paths';

interface ErrorPageProps {
    code: string;
    title: string;
    message: string;
    children?: ReactNode;
}

export function ErrorPage({ code, title, message, children }: ErrorPageProps) {
    return (
        <div className="relative flex min-h-full flex-1 items-center justify-center bg-bg-main p-5 font-[Outfit,sans-serif]">
            <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/[0.08] bg-bg-card p-10 text-center shadow-lg">
                <div className="mb-5 inline-block rounded-full border border-primary/20 bg-primary/10 px-5 py-2 text-sm font-bold uppercase tracking-[2px] text-primary">
                    {code}
                </div>
                <h1 className="text-3xl font-extrabold text-[#fafafa] md:text-4xl">{title}</h1>
                <p className="mt-4 text-[0.95rem] leading-relaxed text-[#c4c4cc]">{message}</p>
                {children}
                {!children && (
                    <a
                        href={appPath('/')}
                        className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-primary px-8 py-3.5 text-[0.95rem] font-bold text-white transition hover:bg-primary-hover"
                    >
                        <Home className="w-5 h-5" /> Volver al Inicio
                    </a>
                )}
            </div>
        </div>
    );
}
