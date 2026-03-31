import { Request, Response } from 'express';
import { runHealthCron } from '../src/features/system/health.cron';

export default async function handler(req: Request, res: Response) {
    // Esta es una función serverless dedicada para el Cron de Vercel.
    // Al estar fuera de la app de Express principal (o llamada directamente),
    // evita problemas de rewrites y cumple los límites de Hobby (10s).
    return runHealthCron(req, res);
}
