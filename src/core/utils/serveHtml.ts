import fs from 'fs';
import path from 'path';
import { Response } from 'express';

const templateCache = new Map<string, string>();

const loadTemplate = async (filePath: string): Promise<string> => {
    const cached = templateCache.get(filePath);
    if (cached) return cached;

    const absolutePath = path.join(process.cwd(), filePath);
    const html = await fs.promises.readFile(absolutePath, 'utf8');
    templateCache.set(filePath, html);
    return html;
};

export const serveHtml = async (
    res: Response,
    filePath: string,
    status: number = 200
): Promise<void> => {
    try {
        const template = await loadTemplate(filePath);
        const nonce = (res.locals as { cspNonce: string }).cspNonce;
        const html = template.replace(/{{cspNonce}}/g, nonce || '');
        res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
        res.status(status).send(html);
    } catch (error) {
        console.error(`Error sirviendo HTML (${filePath}):`, error);
        if (!res.headersSent) {
            res.status(500).send('Error interno del servidor');
        }
    }
};
