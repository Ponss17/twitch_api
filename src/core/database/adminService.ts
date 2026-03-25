import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';
import { CONFIG } from '../config/env';
import { StoredUser } from '../../types/twitch';
import { getUser, saveUser } from './userService';
import { addSystemLog } from './auditService';

export const getAllUsers = async (): Promise<StoredUser[]> => {
    try {
        // JOIN en una sola query para evitar el problema N+1 de consultas individuales
        const { data, error } = await supabase.from('users').select(`
            *,
            user_stats (
                total_requests, total_errors, total_latency,
                clips_count, followage_count, so_count, stalker_count,
                trends_count, roulette_count, message_count, russian_count,
                magic8_count, duel_count
            )
        `);

        if (error || !data) return [];

        return data.map((row) => {
            const stats = (row.user_stats as Record<string, number> | null) ?? {};
            const totalRequests = stats.total_requests ?? 0;

            return {
                userId: row.user_id as string,
                login: row.login as string,
                displayName: row.display_name as string,
                apiKey: (row.api_key as string) ?? undefined,
                isActive: (row.is_active as boolean) ?? true,
                blockedReason: (row.blocked_reason as string) ?? undefined,
                customRateLimit: (row.custom_rate_limit as number) ?? undefined,
                profileImageUrl: (row.profile_image_url as string) ?? undefined,
                lastActive: (row.last_active as string) ?? undefined,
                createdAt: (row.created_at as string) ?? undefined,
                accessToken: '',
                refreshToken: '',
                expiresIn: 0,
                obtainedAt: 0,
                totalRequests,
                stats
            } as StoredUser & { totalRequests: number; stats: Record<string, number> };
        });
    } catch (e: unknown) {
        logger.error('Error getting all users:', e);
        return [];
    }
};

export const updateUserStatus = async (
    userId: string,
    isActive: boolean,
    reason?: string
): Promise<void> => {
    const user = await getUser(userId);
    if (!user) throw new Error('User not found');

    user.isActive = isActive;
    if (reason) user.blockedReason = reason;
    else if (isActive) delete user.blockedReason; // Transformar a undefined si se está desbloqueando

    await saveUser(user);
};

export const isAdmin = async (userId: string): Promise<boolean> => {
    if (CONFIG.ADMIN_ROOT_ID && userId === CONFIG.ADMIN_ROOT_ID) return true;

    const { data } = await supabase.from('admins').select('user_id').eq('user_id', userId).single();

    return !!data;
};

export const addAdmin = async (userId: string): Promise<void> => {
    await supabase.from('admins').upsert({ user_id: userId }, { onConflict: 'user_id' });
    logger.info(`✨ Nuevo administrador añadido: ${userId}`);
    await addSystemLog('info', `Admin añadido: ${userId}`);
};

export const removeAdmin = async (userId: string): Promise<void> => {
    await supabase.from('admins').delete().eq('user_id', userId);
    logger.info(`🗑️ Administrador eliminado: ${userId}`);
    await addSystemLog('warn', `Admin eliminado: ${userId}`);
};

export const getAllAdmins = async (): Promise<string[]> => {
    const { data } = await supabase.from('admins').select('user_id');
    return data ? data.map((row) => row.user_id as string) : [];
};
