import { Request, Response } from 'express';
import * as authService from '../services/authService';
import * as dbService from '../services/dbService';
import * as apiService from '../services/apiService';

interface AuthenticatedRequest extends Request {
    twitchToken?: string;
    userId?: string;
}

const safeString = (val: unknown): string => (typeof val === 'string' ? val : '');

export const validateToken = async (req: AuthenticatedRequest, res: Response) => {
    const token = req.twitchToken;
    if (!token) return res.status(401).send('Token no proporcionado.');

    try {
        const validation = await apiService.validateToken(token);
        if (validation) {
            try {
                const userProfile = await apiService.getUserInfo(validation.login, token);
                return res.json({
                    valid: true,
                    user: {
                        id: userProfile.id,
                        login: userProfile.login,
                        display_name: userProfile.display_name,
                        profile_image_url: userProfile.profile_image_url
                    }
                });
            } catch (e) {
                return res.json({ valid: true, user: { login: validation.login } });
            }
        } else {
            return res.status(401).send('Token inválido');
        }
    } catch (error: any) {
        return res.status(500).json({ error: 'Error validando token' });
    }
};

export const regenerateKey = async (req: Request, res: Response) => {
    const apiKey = safeString(req.body.key);
    if (!apiKey) return res.status(400).json({ error: 'Key requerida' });

    try {
        const user = await dbService.getUserByApiKey(apiKey);
        if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });

        const newKey = await authService.regenerateApiKey(user.userId);
        res.json({ apiKey: newKey });
    } catch (e) {
        console.error('Error regenerando key:', e);
        res.status(500).json({ error: 'Error regenerando clave' });
    }
};
