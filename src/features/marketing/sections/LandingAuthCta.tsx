import { TwitchIcon } from '@/shared/ui/icons/BrandIcons';
import { appPath } from '@/core/config/paths';
import { useTranslation } from '@/core/i18n/I18nContext';
import { landingBtnHeader, landingBtnPrimary } from '../lib/landingContent';
import { ArrowRightIcon } from '../lib/landingIcons';
import '../styles/LandingAuthCta.css';

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
    const { t } = useTranslation();
    const cta = t.landing.cta;
    const isHeader = variant === 'header';
    const shell = isHeader ? landingBtnHeader : landingBtnPrimary;
    const guestLabel = legacyReloginNotice ? cta.reconnect : cta.start;

    const guestInner = isHeader ? (
        guestLabel
    ) : (
        <>
            <TwitchIcon className="h-4 w-4" />
            {guestLabel}
        </>
    );

    const sessionInner = isHeader ? (
        cta.panelShort
    ) : (
        <>
            {cta.goToPanel}
            <ArrowRightIcon className="h-4 w-4" />
        </>
    );

    return (
        <span className="lp-auth-cta inline-grid">
            <a
                href={appPath('/dashboard/')}
                className={`${shell} lp-auth-cta__session col-start-1 row-start-1`}
                data-lp-auth="session"
                aria-label={cta.panelAria}
            >
                {sessionInner}
            </a>
            <button
                type="button"
                onClick={onLoginClick}
                className={`${shell} lp-auth-cta__guest col-start-1 row-start-1`}
                data-lp-auth="guest"
                aria-label={guestLabel}
            >
                {guestInner}
            </button>
        </span>
    );
}
