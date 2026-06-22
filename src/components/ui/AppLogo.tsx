import type { ImgHTMLAttributes } from 'react';
import { staticPath } from '@/lib/paths';

type AppLogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'>;

/** Logo estático respetando el mount /api/twitch */
export function AppLogo({ alt = '', ...props }: AppLogoProps) {
    return <img src={staticPath('/img/logo.svg')} alt={alt} {...props} />;
}
