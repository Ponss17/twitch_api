import { Request, Response } from 'express';
import axios from 'axios';
import * as apiService from '../services/apiService';
import { TwitchError } from '../types/twitch';

export const createClip = async (req: Request, res: Response) => {
    const { channel } = req.query;
    if (!channel) return res.status(400).send('Falta el parámetro channel.');

    const token = req.twitchToken || (req.query.token as string);
    if (!token) return res.status(401).send('Token no proporcionado.');

    try {
        const result = await apiService.createClip(channel as string, token);
        return res.send(result);
    } catch (error: unknown) {
        let status = 500;
        let msg = 'Error interno del servidor';

        if (axios.isAxiosError(error)) {
            status = error.response?.status || 500;
            msg = error.response?.data?.message || error.message;
        } else {
            const err = error as TwitchError;
            if (err.status && err.message) {
                status = err.status;
                msg = err.message;
            } else if (error instanceof Error) {
                msg = error.message;
            }
        }

        if (status === 401) {
            return res.send('⛔ Error: Credenciales inválidas. Verifica tu API Key.');
        }

        if (status === 404) return res.send(msg);

        console.error('Error creando clip:', msg);
        return res.send(`❌ Error: ${msg}`);
    }
};

export const getClips = async (req: Request, res: Response) => {
    const { channel, limit } = req.query;
    const limitNum = parseInt(limit as string) || 5;
    if (!channel) return res.status(400).json({ error: 'Falta channel' });

    const token = req.twitchToken || (req.query.token as string);
    if (!token) return res.status(401).json({ error: 'Token no requerido' });

    try {
        const clips = await apiService.getClips(channel as string, limitNum, token);
        res.json(clips);
    } catch (error: unknown) {
        let status = 500;
        let msg = 'Error obteniendo clips';

        if (axios.isAxiosError(error)) {
            status = error.response?.status || 500;
            msg = error.response?.data?.message || error.message;
        }

        if (status === 401) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        console.error('Error fetching clips:', msg);
        res.status(status).json({ error: msg });
    }
};

export const followage = async (req: Request, res: Response) => {
    const { channel, user } = req.query;

    if (!channel || !user) {
        return res.status(400).send('Faltan parámetros: channel y user son requeridos.');
    }

    const token = req.twitchToken || (req.query.token as string);
    if (!token) return res.status(401).send('Token no proporcionado.');

    try {
        const result = await apiService.getFollowAge(channel as string, user as string, token);
        return res.send(result);
    } catch (error: unknown) {
        let status = 500;
        let msg = 'Error interno del servidor';

        if (axios.isAxiosError(error)) {
            status = error.response?.status || 500;
            msg = error.response?.data?.message || error.message;
        } else {
            const err = error as TwitchError;
            if (err.status) status = err.status;
            if (err.message) msg = err.message;
        }

        if (status === 401) {
            return res.send('⛔ Error: Credenciales inválidas. Verifica tu API Key.');
        }

        console.error('Error General:', msg);
        res.send('❌ Error interno del servidor.');
    }
};

export const validateToken = async (req: Request, res: Response) => {
    const token = req.twitchToken || (req.query.token as string);
    if (!token) return res.status(401).send('Token no proporcionado.');

    const isValid = await apiService.validateToken(token);
    if (isValid) {
        return res.status(200).send('Token válido');
    } else {
        return res.status(401).send('Token inválido');
    }
};

import * as authService from '../services/authService';
import * as dbService from '../services/dbService';

export const regenerateKey = async (req: Request, res: Response) => {
    const apiKey = req.query.apiKey as string;
    if (!apiKey) return res.status(400).send('API Key requerida');

    const user = await dbService.getUserByApiKey(apiKey);
    if (!user) return res.status(401).send('Usuario no encontrado');

    try {
        const newKey = await authService.regenerateApiKey(user.userId);
        res.json({ apiKey: newKey });
    } catch (e) {
        res.status(500).send('Error regenerando clave');
    }
};
