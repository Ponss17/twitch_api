import { Request, Response } from 'express';
import * as apiService from '../services/apiService';

interface AuthenticatedRequest extends Request {
    twitchToken?: string;
}

export const createClip = async (req: AuthenticatedRequest, res: Response) => {
    const { channel } = req.query;
    if (!channel) return res.status(400).send('Falta el parámetro channel.');

    if (!req.twitchToken) return res.status(401).send('Token no proporcionado.');

    try {
        const result = await apiService.createClip(channel as string, req.twitchToken);
        return res.send(`🎬 Clip creado con éxito! ${result}`);
    } catch (error: any) {
        const status = error.status || error.response?.status || 500;
        const msg = error.response?.data?.message || error.message;

        if (status === 401) {
            return res.send('⛔ Error: Token inválido o expirado. Por favor, vuelve a iniciar sesión en el panel para generar uno nuevo.');
        }

        if (status === 404) return res.send(msg); // Custom 404 from service

        console.error('Error creando clip:', msg);
        return res.send(`❌ Error: ${msg}`);
    }
};

export const getClips = async (req: AuthenticatedRequest, res: Response) => {
    const { channel, limit } = req.query;
    const limitNum = parseInt(limit as string) || 5;
    if (!channel) return res.status(400).json({ error: 'Falta channel' });

    if (!req.twitchToken) return res.status(401).json({ error: 'Token no requerido' });

    try {
        const clips = await apiService.getClips(channel as string, limitNum, req.twitchToken);
        res.json(clips);
    } catch (error: any) {
        const status = error.status || error.response?.status || 500;

        if (status === 401) {
            return res.status(401).json({ error: 'Token inválido o expirado. Relogueate.' });
        }

        console.error('Error fetching clips:', error.response?.data || error.message);
        res.status(status).json({ error: 'Error obteniendo clips' });
    }
};

export const followage = async (req: AuthenticatedRequest, res: Response) => {
    const { channel, user } = req.query;

    if (!channel || !user) {
        return res.status(400).send('Faltan parámetros: channel y user son requeridos.');
    }

    if (!req.twitchToken) return res.status(401).send('Token no proporcionado.');

    try {
        const result = await apiService.getFollowAge(channel as string, user as string, req.twitchToken);
        return res.send(result);
    } catch (error: any) {
        const status = error.status || error.response?.status || 500;

        if (status === 401) {
            return res.send('⛔ Error: Token expirado. Vuelve a loguearte en el panel.');
        }

        console.error('Error General:', error.response?.data || error.message);
        res.send('❌ Error interno del servidor.');
    }
};
