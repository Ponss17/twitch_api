import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
    twitchToken?: string;
}

import * as authService from '../services/authService';

const checkToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const safeString = (val: unknown) => (typeof val === 'string' ? val : '');

    let token = safeString(req.query.token);
    const apiKey = safeString(req.query.apiKey);

    if (apiKey) {
        try {
            token = await authService.getValidToken(apiKey);
        } catch (error) {
            return res.status(401).send('⛔ Error: Credenciales inválidas. Verifica tu API Key.');
        }
    }

    if (!token) {
        return res.status(401).send('Error: Token no proporcionado. Debes incluir ?token=TU_TOKEN en la URL.');
    }

    req.twitchToken = token;
    next();
};

export default checkToken;
