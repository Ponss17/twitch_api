import { TwitchIcon } from '@/shared/ui/icons/BrandIcons';
import { appPath } from '@/core/config/paths';
import { landingBtnHeader, landingBtnPrimary } from './landingContent';
import { ArrowRightIcon } from './landingIcons';

type LandingAuthCtaProps = {
    legacyReloginNotice?: boolean;
    onLoginClick: () => void;
    variant: 'hero' | 'header';
};

export function LandingAuthCta({
    legacyReloginNotice = false,
    onLoginClick,
    variant
}: LandingAuthCtaProps) {
    const isHeader = variant === 'header';
    const shell = isHeader ? landingBtnHeader : landingBtnPrimary;
    const guestLabel = legacyReloginNotice ? 'Volver a conectar con Twitch' : 'Empezar';

    const guestInner = isHeader ? (
        guestLabel
    ) : (
        <>
            <TwitchIcon className="h-4 w-4" />
            {guestLabel}
        </>
    );

    const sessionInner = isHeader ? (
        'Panel'
    ) : (
        <>
            Ir al Panel
            <ArrowRightIcon className="h-4 w-4" />
        </>
    );

    return (
        <span className="lp-auth-cta inline-grid">
            <a
                href={appPath('/dashboard/')}
                className={`${shell} lp-auth-cta__session col-start-1 row-start-1`}
                data-lp-auth="session"
            >
                {sessionInner}
            </a>
            <button
                type="button"
                onClick={onLoginClick}
                className={`${shell} lp-auth-cta__guest col-start-1 row-start-1`}
                data-lp-auth="guest"
            >
                {guestInner}
            </button>
        </span>
    );
}
