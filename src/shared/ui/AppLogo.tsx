import type { ImgHTMLAttributes } from 'react';
import { staticPath } from '@/core/config/paths';

type AppLogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'>;

/** Logo estático vía staticPath (raíz del subdominio). */
export function AppLogo({ alt = '', ...props }: AppLogoProps) {
    return <img src={staticPath('/img/logo.svg')} alt={alt} {...props} />;
}
