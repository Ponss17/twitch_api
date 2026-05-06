import fs from 'fs';
import path from 'path';
import { Response } from 'express';

export const serveHtml = async (
    res: Response,
    filePath: string,
    status: number = 200
): Promise<void> => {
    try {
        let html = await fs.promises.readFile(path.join(process.cwd(), filePath), 'utf8');
        const nonce = (res.locals as { cspNonce: string }).cspNonce;
        html = html.replace(/{{cspNonce}}/g, nonce || '');
        res.status(status).send(html);
    } catch (error) {
        console.error(`Error sirviendo HTML (${filePath}):`, error);
        if (!res.headersSent) {
            res.status(500).send('Error interno del servidor');
        }
    }
};
