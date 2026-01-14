import { Request, Response } from 'express';
import * as authService from '../services/authService';

export const login = (req: Request, res: Response) => {
    const redirectOrigin = (req.query.redirect_origin as string) || '';
    const url = authService.getAuthorizeUrl(redirectOrigin);
    res.redirect(url);
};

export const callback = async (req: Request, res: Response) => {
    const { code, state } = req.query as { code: string; state: string };

    if (!code) {
        return res.redirect('/?error=no_code');
    }

    try {
        const { user, access_token, redirectOrigin, apiKey } = await authService.handleCallback(code, state);

        const params = `?token=${access_token}&apiKey=${apiKey}&userId=${user.id}&login=${user.login}&displayName=${encodeURIComponent(user.display_name)}`;
        const redirectUrl = redirectOrigin ? `${redirectOrigin}${params}` : `/dashboard${params}`;

        res.redirect(redirectUrl);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error en autenticación:', errorMessage);

        let errorRedirect = '/?error=auth_failed';
        if (state) {
            try {
                const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
                if (decoded.redirectOrigin) errorRedirect = `${decoded.redirectOrigin}?error=auth_failed`;
            } catch (e) { }
        }
        res.redirect(errorRedirect);
    }
};
