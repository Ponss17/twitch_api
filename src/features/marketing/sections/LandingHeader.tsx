import { AppLogo } from '@/shared/ui/AppLogo';
import { DiscordIcon } from '@/shared/ui/icons/BrandIcons';
import { appPath, saveDocsReturnPath } from '@/core/config/paths';
import { DISCORD_COMMUNITY_URL } from '../lib/landingContent';
import { LandingAuthCta } from '../sections/LandingAuthCta';

const navLink =
    'rounded-md px-3 py-1.5 text-sm font-medium text-text-muted no-underline transition hover:text-text-main';

type LandingHeaderProps = {
    scrolled: boolean;
    onLoginClick: () => void;
};

export function LandingHeader({ scrolled, onLoginClick }: LandingHeaderProps) {
    return (
        <header
            className={`fixed inset-x-0 top-0 z-[1000] isolate border-b transition-[background-color,border-color,backdrop-filter] duration-200 ${
                scrolled
                    ? 'border-border-subtle bg-bg-main/95 backdrop-blur-md'
                    : 'border-transparent bg-bg-main/70 backdrop-blur-sm'
            }`}
        >
            <div className="mx-auto flex h-14 max-w-[1120px] items-center gap-3 px-5 md:h-16 md:px-8">
                <a href={appPath('/')} className="flex min-w-0 shrink-0 items-center gap-2.5 text-inherit no-underline">
                    <AppLogo className="h-7 w-7 shrink-0 text-primary md:h-8 md:w-8" aria-hidden />
                    <span className="truncate text-base font-bold tracking-tight text-text-main md:text-lg">
                        LosPerris<span className="text-brand-text">API</span>
                    </span>
                </a>

                <nav
                    className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 md:flex"
                    aria-label="Secciones"
                >
                    <a href="#producto" className={navLink}>
                        Producto
                    </a>
                    <a href={appPath('/docs')} onClick={saveDocsReturnPath} className={navLink}>
                        Docs
                    </a>
                    <a
                        href={DISCORD_COMMUNITY_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={navLink}
                    >
                        Discord
                    </a>
                </nav>

                <div className="ml-auto flex shrink-0 items-center justify-end gap-1">
                    <a href={appPath('/docs')} onClick={saveDocsReturnPath} className={`${navLink} md:hidden`}>
                        Docs
                    </a>
                    <a
                        href={DISCORD_COMMUNITY_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${navLink} inline-flex items-center md:hidden`}
                        aria-label="Discord"
                    >
                        <DiscordIcon className="h-4 w-4" />
                    </a>
                    <LandingAuthCta variant="header" onLoginClick={onLoginClick} />
                </div>
            </div>
        </header>
    );
}
