import type { SVGProps } from 'react';

interface TwitchIconProps extends SVGProps<SVGSVGElement> {
    variant?: 'brand' | 'monochrome';
}

export function TwitchIcon({ className, variant = 'monochrome', ...props }: TwitchIconProps) {
    if (variant === 'brand') {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className ? `block shrink-0 ${className}` : 'block shrink-0'} aria-hidden="true" {...props}>
                <path fill="#9146FF" d="M6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0z"/>
                <path fill="#FFFFFF" d="M20.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714v9.429z"/>
                <path fill="#9146FF" d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714z"/>
            </svg>
        );
    }
    
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className ? `block shrink-0 ${className}` : 'block shrink-0'} aria-hidden="true" {...props}>
            <path fill="currentColor" d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714v9.429z"/>
        </svg>
    );
}

export function DiscordIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
            className={className ? `block shrink-0 ${className}` : 'block shrink-0'}
            aria-hidden="true"
            {...props}
        >
            <path
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.59,34.1733c-.89,1.3069-1.8944,2.6152-2.91,3.8267C7.3,37.79,4.5,33,4.5,33A44.83,44.83,0,0,1,9.31,13.48,16.47,16.47,0,0,1,18.69,10l1,2.31A32.6875,32.6875,0,0,1,24,12a32.9643,32.9643,0,0,1,4.33.3l1-2.31a16.47,16.47,0,0,1,9.38,3.51A44.8292,44.8292,0,0,1,43.5,33s-2.8,4.79-10.18,5a47.4193,47.4193,0,0,1-2.86-3.81m6.46-2.9c-3.84,1.9454-7.5555,3.89-12.92,3.89s-9.08-1.9446-12.92-3.89"
            />
            <circle
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                cx="17.847"
                cy="26.23"
                r="3.35"
            />
            <circle
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                cx="30.153"
                cy="26.23"
                r="3.35"
            />
        </svg>
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
            className={className ? `block shrink-0 ${className}` : 'block shrink-0'}
            aria-hidden="true"
            {...props}
        >
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
    );
}

