import { supabase } from './supabaseClient';
import { StoredUser } from '../../types/twitch';
import { invalidateDiscordLinkCaches } from '../utils/cacheInvalidation';
import { logger } from '../utils/logger';
import { getUser } from './userService';

export type DiscordLinkPayload = {
    discordId: string;
    discordUsername: string;
    discordAvatar: string | null;
};

export type DiscordLinkFields = {
    discordId: string | null;
    discordUsername: string | null;
    discordAvatar: string | null;
};

export const findUserByDiscordId = async (discordId: string): Promise<StoredUser | null> => {
    const { data, error } = await supabase
        .from('users')
        .select('user_id')
        .eq('discord_id', discordId)
        .maybeSingle();

    if (error || !data?.user_id) return null;

    return getUser(data.user_id as string);
};

/** Lee Discord vinculado directo de DB (evita caché de perfil/Twitch desactualizado). */
export const getDiscordLinkFields = async (userId: string): Promise<DiscordLinkFields> => {
    const { data, error } = await supabase
        .from('users')
        .select('discord_id, discord_username, discord_avatar')
        .eq('user_id', userId)
        .maybeSingle();

    if (error || !data) {
        return { discordId: null, discordUsername: null, discordAvatar: null };
    }

    return {
        discordId: (data.discord_id as string) ?? null,
        discordUsername: (data.discord_username as string) ?? null,
        discordAvatar: (data.discord_avatar as string) ?? null
    };
};

export const linkDiscordAccount = async (
    userId: string,
    payload: DiscordLinkPayload
): Promise<StoredUser> => {
    const existing = await findUserByDiscordId(payload.discordId);
    if (existing && existing.userId !== userId) {
        throw new Error('DISCORD_ALREADY_LINKED');
    }

    const now = new Date().toISOString();
    const current = await getUser(userId);
    if (!current) throw new Error('USER_NOT_FOUND');

    const { data, error } = await supabase
        .from('users')
        .update({
            discord_id: payload.discordId,
            discord_username: payload.discordUsername,
            discord_avatar: payload.discordAvatar,
            discord_linked_at: current.discordId ? current.discordLinkedAt ?? now : now,
            discord_updated_at: now
        })
        .eq('user_id', userId)
        .select('discord_id')
        .maybeSingle();

    if (error) {
        if (error.code === '23505') throw new Error('DISCORD_ALREADY_LINKED');
        logger.error('Error linking Discord:', error.message);
        throw new Error('DISCORD_LINK_FAILED');
    }

    if (!data || data.discord_id !== payload.discordId) {
        logger.error('Discord link update did not persist', { userId, discordId: payload.discordId });
        throw new Error('DISCORD_LINK_FAILED');
    }

    await invalidateDiscordLinkCaches(userId, current.login);

    const updated = await getUser(userId);
    if (!updated) throw new Error('USER_NOT_FOUND');
    return updated;
};

export const unlinkDiscordAccount = async (userId: string): Promise<void> => {
    const current = await getUser(userId);
    if (!current) throw new Error('USER_NOT_FOUND');

    const { error } = await supabase
        .from('users')
        .update({
            discord_id: null,
            discord_username: null,
            discord_avatar: null,
            discord_linked_at: null,
            discord_updated_at: null
        })
        .eq('user_id', userId);

    if (error) {
        logger.error('Error unlinking Discord:', error.message);
        throw new Error('DISCORD_UNLINK_FAILED');
    }

    await invalidateDiscordLinkCaches(userId, current.login);
};
