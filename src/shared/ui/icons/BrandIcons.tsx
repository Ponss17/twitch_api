import type { ImgHTMLAttributes } from 'react';
import { staticPath } from '@/core/config/paths';

export function TwitchIcon({ className, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src={staticPath('/img/twitch.svg')}
            alt="Twitch"
            className={className ? `block shrink-0 ${className}` : 'block shrink-0'}
            aria-hidden="true"
            {...props}
        />
    );
}

export function DiscordIcon({ className, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src={staticPath('/img/discord.svg')}
            alt="Discord"
            className={className ? `block shrink-0 ${className}` : 'block shrink-0'}
            aria-hidden="true"
            {...props}
        />
    );
}

export function InstagramIcon({ className, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src={staticPath('/img/instagram.svg')}
            alt="Instagram"
            className={className ? `block shrink-0 ${className}` : 'block shrink-0'}
            aria-hidden="true"
            {...props}
        />
    );
}


export function PaypalIcon({ className, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src={staticPath('/img/paypal.svg')}
            alt="PayPal"
            className={className ? `block shrink-0 ${className}` : 'block shrink-0'}
            aria-hidden="true"
            {...props}
        />
    );
}
