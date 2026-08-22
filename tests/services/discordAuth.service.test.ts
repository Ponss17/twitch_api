jest.mock('../../backend/src/features/twitch/twitchClient', () => ({
    apiClient: {
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
        get: jest.fn(),
        post: jest.fn()
    },
    handleTwitchError: jest.fn()
}));

jest.mock('../../backend/src/core/config/env', () => ({
    CONFIG: { SUPABASE_URL: 'https://test.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'test_key',
        TWITCH_CLIENT_SECRET: 'test-secret-for-hmac',
        HMAC_SIGNING_SECRET: undefined,
        DISCORD_CLIENT_ID: 'discord-client',
        DISCORD_CLIENT_SECRET: 'discord-secret',
        DISCORD_REDIRECT_URI: 'https://example.com/api/twitch/auth/discord/callback'
    }
}));

jest.mock('../../backend/src/core/database/dbService', () => ({
    linkDiscordAccount: jest.fn().mockResolvedValue(undefined),
    addAuditLog: jest.fn().mockResolvedValue(undefined),
    unlinkDiscordAccount: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('axios');

import { describe, expect, it, beforeEach } from '@jest/globals';
import axios from 'axios';
import crypto from 'crypto';
import * as dbService from '../../backend/src/core/database/dbService';
import {
    getDiscordAuthorizeUrl,
    handleDiscordLinkCallback,
    isDiscordOAuthConfigured,
    unlinkDiscord
} from '../../backend/src/features/auth/discordAuth.service';
import { verifyState } from '../../backend/src/features/auth/auth.service';

describe('discordAuth.service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('isDiscordOAuthConfigured refleja variables requeridas', () => {
        expect(isDiscordOAuthConfigured()).toBe(true);
    });

    it('getDiscordAuthorizeUrl incluye state firmado y scopes', () => {
        const url = getDiscordAuthorizeUrl('user-42', 'https://losperris.dev');

        expect(url).toContain('discord.com/api/oauth2/authorize');
        expect(url).toContain('client_id=discord-client');
        expect(url).toContain('scope=identify');
        expect(url).toMatch(/state=[^&]+/);
    });

    it('handleDiscordLinkCallback vincula cuenta Discord', async () => {
        const statePayload = {
            purpose: 'discord_link',
            userId: 'user-42',
            redirectOrigin: '',
            exp: Date.now() + 600_000
        };
        const data = Buffer.from(JSON.stringify(statePayload)).toString('base64');
        const sig = crypto.createHmac('sha256', 'test-secret-for-hmac').update(data).digest('hex');
        const state = `${data}.${sig}`;

        (axios.post as jest.Mock).mockResolvedValueOnce({
            status: 200,
            data: { access_token: 'discord-token' }
        });
        (axios.get as jest.Mock).mockResolvedValueOnce({
            status: 200,
            data: { id: '999', username: 'duck', global_name: 'Ponss', avatar: 'abc123' }
        });

        const result = await handleDiscordLinkCallback('oauth-code', state);

        expect(result).toEqual({ userId: 'user-42', username: 'Ponss' });
        expect(dbService.linkDiscordAccount).toHaveBeenCalledWith(
            'user-42',
            expect.objectContaining({
                discordId: '999',
                discordUsername: 'Ponss'
            })
        );
    });

    it('handleDiscordLinkCallback rechaza state inválido', async () => {
        await expect(handleDiscordLinkCallback('oauth-code', 'bad.state')).rejects.toThrow(
            'INVALID_STATE'
        );
    });

    it('unlinkDiscord desvincula y audita', async () => {
        await unlinkDiscord('user-42');

        expect(dbService.unlinkDiscordAccount).toHaveBeenCalledWith('user-42');
        expect(dbService.addAuditLog).toHaveBeenCalledWith('discord_unlinked', 'user-42', 'user-42');
    });

    it('verifyState acepta state firmado por Discord link', () => {
        const payload = {
            purpose: 'discord_link',
            userId: 'user-42',
            redirectOrigin: '',
            exp: Date.now() + 600_000
        };
        const data = Buffer.from(JSON.stringify(payload)).toString('base64');
        const sig = crypto.createHmac('sha256', 'test-secret-for-hmac').update(data).digest('hex');
        const state = `${data}.${sig}`;

        expect(verifyState(state)).toMatchObject({ purpose: 'discord_link', userId: 'user-42' });
    });
});
