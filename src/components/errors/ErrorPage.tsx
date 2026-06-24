import type { ReactNode } from 'react';
import { Home } from 'lucide-react';
import { appPath } from '@/lib/paths';

interface ErrorPageProps {
    code: string;
    title: string;
    message: string;
    children?: ReactNode;
}

export function ErrorPage({ code, title, message, children }: ErrorPageProps) {
    return (
        <div className="relative flex min-h-full flex-1 items-center justify-center overflow-hidden bg-[#09090b] p-5 font-[Outfit,sans-serif]">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-36 -top-36 h-[500px] w-[500px] animate-pulse rounded-full bg-[#9146ff] opacity-15 blur-[80px]" />
                <div className="absolute -bottom-48 -right-48 h-[600px] w-[600px] animate-pulse rounded-full bg-[#db2777] opacity-15 blur-[80px]" />
            </div>
            <div className="relative z-10 w-full max-w-md rounded-[32px] border border-white/10 bg-[rgba(15,15,17,0.7)] p-10 text-center shadow-2xl backdrop-blur-xl">
                <div className="mb-5 inline-block rounded-full border border-[#9146ff]/20 bg-[#9146ff]/10 px-5 py-2 text-sm font-extrabold uppercase tracking-[4px] text-[#9146ff]">
                    {code}
                </div>
                <h1 className="text-3xl font-extrabold text-[#fafafa] md:text-4xl">{title}</h1>
                <p className="mt-4 text-lg leading-relaxed text-[#a1a1aa]">{message}</p>
                {children}
                {!children && (
                    <a
                        href={appPath('/')}
                        className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-[#9146ff] px-8 py-4 text-lg font-bold text-white shadow-lg shadow-[#9146ff]/40 transition hover:bg-[#a970ff]"
                    >
                        <Home className="w-5 h-5" /> Volver al Inicio
                    </a>
                )}
            </div>
        </div>
    );
}
