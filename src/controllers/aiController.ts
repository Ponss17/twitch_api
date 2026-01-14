import { Request, Response } from 'express';
import { generateResponse } from '../services/aiService';

export const generateCommand = async (req: Request, res: Response) => {
    try {
        const { prompt, history } = req.body;

        if (!prompt && (!history || history.length === 0)) {
            return res.status(400).json({ error: '¡Necesito que me digas algo! Cuak.' });
        }

        const protocol = req.protocol;
        const host = req.get('host');
        let domain = `${protocol}://${host}${req.baseUrl}`;

        if (req.originalUrl.includes('/api/twitch')) {
            domain = `${protocol}://${host}/api/twitch`;
        } else {
            domain = `${protocol}://${host}`;
        }

        let contextMessages = history || [];
        if (!history && prompt) {
            contextMessages = [{ role: 'user', content: prompt }];
        }

        if (prompt && (!history || history[history.length - 1].content !== prompt)) {
            contextMessages.push({ role: 'user', content: prompt });
        }

        const response = await generateResponse(contextMessages, domain);

        res.json({ result: response });
    } catch (error) {
        console.error('AI Controller Error:', error);
        res.status(500).json({ error: 'Error interno del pato.' });
    }
};
