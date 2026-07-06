import type { SVGProps, ImgHTMLAttributes } from 'react';
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

export function InstagramIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            {...props}
        >
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
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
