import { Request, Response } from 'express';
import axios from 'axios';
import { kv } from '@vercel/kv';
import { supabase } from '../../core/database/supabaseClient';
import { CONFIG } from '../../core/config/env';
import { logger } from '../../core/utils/logger';

const LATENCY_THRESHOLD_MS = 500;
const COOLDOWN_KEY = 'health-cron:alert-cooldown';
const COOLDOWN_TTL = 60 * 30;

async function checkServices() {
    const [dbResult, redisResult] = await Promise.all([
        (async () => {
            const start = Date.now();
            try {
                const { error } = await supabase.from('users').select('user_id').limit(1);
                return { name: 'Supabase', ok: !error, latency: Date.now() - start };
            } catch {
                return { name: 'Supabase', ok: false, latency: Date.now() - start };
            }
        })(),
        (async () => {
            const start = Date.now();
            try {
                await kv.get('health-cron-ping');
                return { name: 'Vercel KV', ok: true, latency: Date.now() - start };
            } catch {
                return { name: 'Vercel KV', ok: false, latency: Date.now() - start };
            }
        })()
    ]);

    return [dbResult, redisResult];
}

async function sendDiscordAlert(services: { name: string; ok: boolean; latency: number }[]) {
    const webhookUrl = CONFIG.DISCORD_HEALTH_WEBHOOK_URL;
    if (!webhookUrl) return;

    const hasCooldown = await kv.get(COOLDOWN_KEY).catch(() => null);
    if (hasCooldown) return;

    const fields = services.map((s) => ({
        name: s.ok ? `✅ ${s.name}` : `🔴 ${s.name}`,
        value: `Latencia: ${s.latency}ms${!s.ok ? ' — **CAÍDO**' : s.latency > LATENCY_THRESHOLD_MS ? ' — ⚠️ Alta latencia' : ''}`,
        inline: true
    }));

    const allOk = services.every((s) => s.ok && s.latency < LATENCY_THRESHOLD_MS);
    if (allOk) return;

    try {
        await axios.post(webhookUrl, {
            username: 'LosPerris Monitor',
            embeds: [
                {
                    title: '⚠️ Alerta de Salud del Sistema',
                    color: services.some((s) => !s.ok) ? 0xff4444 : 0xffa500,
                    fields,
                    footer: { text: 'LosPerris API Health Monitor' },
                    timestamp: new Date().toISOString()
                }
            ]
        });

        await kv.set(COOLDOWN_KEY, '1', { ex: COOLDOWN_TTL });
        logger.warn('Alerta de salud enviada a Discord.');
    } catch (e) {
        logger.error('Error enviando alerta de salud a Discord:', e);
    }
}

export const runHealthCron = async (_req: Request, res: Response) => {
    try {
        const services = await checkServices();
        await sendDiscordAlert(services);

        const allOk = services.every((s) => s.ok);
        res.status(allOk ? 200 : 503).json({
            checked: services.length,
            services: services.map((s) => ({ name: s.name, ok: s.ok, latency: `${s.latency}ms` }))
        });
    } catch (e) {
        logger.error('Error en health cron:', e);
        res.status(500).json({ error: 'Cron failed' });
    }
};
