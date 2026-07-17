import axios from 'axios';
import { CONFIG } from '../../core/config/env';
import * as dbService from '../../core/database/dbService';
import { logger } from '../../core/utils/logger';
import { verifyState } from './auth.service';
import crypto from 'crypto';

const DISCORD_AUTHORIZE = 'https://discord.com/api/oauth2/authorize';
const DISCORD_TOKEN = 'https://discord.com/api/oauth2/token';
const DISCORD_ME = 'https://discord.com/api/users/@me';
const STATE_TTL_MS = 10 * 60 * 1000;

function getHmacSecret(): string {
    return CONFIG.HMAC_SIGNING_SECRET ?? (CONFIG.TWITCH_CLIENT_SECRET as string);
}

function signDiscordState(payload: object): string {
    const data = Buffer.from(
        JSON.stringify({ ...payload, exp: Date.now() + STATE_TTL_MS })
    ).toString('base64');
    const sig = crypto.createHmac('sha256', getHmacSecret()).update(data).digest('hex');
    return `${data}.${sig}`;
}

export function isDiscordOAuthConfigured(): boolean {
    return Boolean(
        CONFIG.DISCORD_CLIENT_ID &&
            CONFIG.DISCORD_CLIENT_SECRET &&
            CONFIG.DISCORD_REDIRECT_URI
    );
}

export function getDiscordAuthorizeUrl(userId: string, redirectOrigin?: string): string {
    if (!isDiscordOAuthConfigured()) {
        throw new Error('DISCORD_OAUTH_NOT_CONFIGURED');
    }

    const state = signDiscordState({
        purpose: 'discord_link',
        userId,
        redirectOrigin: redirectOrigin || ''
    });

    const params = new URLSearchParams({
        client_id: CONFIG.DISCORD_CLIENT_ID as string,
        redirect_uri: CONFIG.DISCORD_REDIRECT_URI as string,
        response_type: 'code',
        scope: 'identify',
        state,
        prompt: 'consent'
    });

    return `${DISCORD_AUTHORIZE}?${params.toString()}`;
}

function discordAvatarUrl(id: string, avatar: string | null | undefined): string | null {
    if (!avatar) return null;
    const ext = avatar.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${id}/${avatar}.${ext}?size=128`;
}

export async function handleDiscordLinkCallback(
    code: string,
    state: string
): Promise<{ userId: string; username: string }> {
    if (!isDiscordOAuthConfigured()) {
        throw new Error('DISCORD_OAUTH_NOT_CONFIGURED');
    }

    const decoded = verifyState(state);
    if (!decoded || decoded.purpose !== 'discord_link' || typeof decoded.userId !== 'string') {
        throw new Error('INVALID_STATE');
    }

    const userId = decoded.userId;

    const body = new URLSearchParams({
        client_id: CONFIG.DISCORD_CLIENT_ID as string,
        client_secret: CONFIG.DISCORD_CLIENT_SECRET as string,
        grant_type: 'authorization_code',
        code,
        redirect_uri: CONFIG.DISCORD_REDIRECT_URI as string
    });

    const tokenRes = await axios.post(DISCORD_TOKEN, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 12_000,
        validateStatus: () => true
    });

    if (tokenRes.status >= 400 || !tokenRes.data?.access_token) {
        logger.error('Discord token exchange failed', {
            status: tokenRes.status,
            data: tokenRes.data
        });
        throw new Error('DISCORD_TOKEN_FAILED');
    }

    const meRes = await axios.get(DISCORD_ME, {
        headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
        timeout: 12_000,
        validateStatus: () => true
    });

    if (meRes.status >= 400 || !meRes.data?.id) {
        logger.error('Discord /users/@me failed', { status: meRes.status });
        throw new Error('DISCORD_USER_FAILED');
    }

    const discordId = String(meRes.data.id);
    const username = String(meRes.data.global_name || meRes.data.username || discordId);
    const avatar = discordAvatarUrl(discordId, meRes.data.avatar);

    await dbService.linkDiscordAccount(userId, {
        discordId,
        discordUsername: username,
        discordAvatar: avatar
    });

    await dbService.addAuditLog('discord_linked', userId, userId, { discordId }).catch(() => {});

    return { userId, username };
}

export async function unlinkDiscord(userId: string): Promise<void> {
    await dbService.unlinkDiscordAccount(userId);
    await dbService.addAuditLog('discord_unlinked', userId, userId).catch(() => {});
}
