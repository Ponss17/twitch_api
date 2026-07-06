import { Book, Menu } from 'lucide-react';
import { IconMd } from '@/shared/ui/Icon';

interface DocsHeaderProps {
    onMenuToggle: () => void;
}

export function DocsHeader({ onMenuToggle }: DocsHeaderProps) {
    return (
        <header className="sticky top-0 z-[100] w-full border-b border-white/[0.08] bg-bg-main/95 backdrop-blur-md">
            <div className="mx-auto flex h-20 max-w-[1600px] items-center gap-4 px-4 md:px-6">
                <button
                    type="button"
                    onClick={onMenuToggle}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-[#c4c4cc] transition hover:bg-white/5 hover:text-[#fafafa] lg:hidden"
                    aria-label="Abrir menú de documentación"
                >
                    <Menu className="h-5 w-5" />
                </button>

                <h1 className="flex flex-1 items-center gap-3 text-xl font-bold tracking-tight text-[#fafafa] md:text-[1.8rem]">
                    <IconMd icon={Book} className="text-primary" />
                    Documentación
                </h1>
            </div>
        </header>
    );
}
