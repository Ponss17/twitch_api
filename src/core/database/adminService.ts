import { kv } from '@vercel/kv';
import { logger } from '../utils/logger';
import { CONFIG } from '../config/env';
import { StoredUser } from '../../types/twitch';
import { getUserStats } from './statsService';
import { getUser, saveUser, USERS_KEY } from './userService';
import { addSystemLog } from './auditService';
import { ADMINS_KEY } from './keys';

export const getAllUsers = async (): Promise<StoredUser[]> => {
    try {
        const allUsers = await kv.hgetall<Record<string, StoredUser>>(USERS_KEY);
        if (!allUsers) return [];

        const users = Object.values(allUsers);
        const enhancedUsers = await Promise.all(
            users.map(async (u) => {
                const safeUser = { ...u };
                const safeAnyUser = safeUser as unknown as Record<string, unknown>;
                delete safeAnyUser.accessToken;
                delete safeAnyUser.refreshToken;

                if (safeUser.isActive === undefined) safeUser.isActive = true;

                if (!safeUser.createdAt) {
                    if (safeUser.obtainedAt) {
                        try {
                            safeUser.createdAt = new Date(safeUser.obtainedAt).toISOString();
                        } catch {
                            // Fecha inválida, ignorar
                        }
                    }
                }

                const stats = await getUserStats(u.userId);
                const totalRequests = Object.entries(stats).reduce((acc, [key, val]) => {
                    if (key === 'activity') return acc;
                    return acc + (typeof val === 'number' ? val : 0);
                }, 0);

                return {
                    ...safeUser,
                    totalRequests,
                    stats
                };
            })
        );

        return enhancedUsers;
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
    const isWhiteListed = await kv.sismember(ADMINS_KEY, userId);
    return isWhiteListed === 1;
};

export const addAdmin = async (userId: string): Promise<void> => {
    await kv.sadd(ADMINS_KEY, userId);
    logger.info(`✨ Nuevo administrador añadido: ${userId}`);
    await addSystemLog('info', `Admin añadido: ${userId}`);
};

export const removeAdmin = async (userId: string): Promise<void> => {
    await kv.srem(ADMINS_KEY, userId);
    logger.info(`🗑️ Administrador eliminado: ${userId}`);
    await addSystemLog('warn', `Admin eliminado: ${userId}`);
};

export const getAllAdmins = async (): Promise<string[]> => {
    return await kv.smembers(ADMINS_KEY);
};
