import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
    twitchToken?: string;
}

import * as authService from '../services/authService';

const checkToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    let token = req.query.token as string;
    const apiKey = req.query.apiKey as string;

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
