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
        <div className="relative flex min-h-[calc(100vh-220px)] flex-1 items-center justify-center px-6 py-16 text-center">
            <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center">
                <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-text">
                    {code}
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight text-text-main sm:text-4xl md:text-5xl">
                    {title}
                </h1>
                <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-text-muted">
                    {message}
                </p>
                {children}
                {!children && (
                    <a
                        href={appPath('/')}
                        className="mt-8 inline-flex items-center justify-center gap-2.5 rounded-xl bg-primary px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Home className="size-4" /> Volver al Inicio
                    </a>
                )}
            </div>
        </div>
    );
}
