import { supabase } from './supabaseClient';
import { StoredUser } from '../../types/twitch';
import { encrypt, decrypt, ENCRYPTION_KEY, LEGACY_ENCRYPTION_KEY } from './cryptoService';
import { logger } from '../utils/logger';
import * as cacheService from './cacheService';

function decryptTokenWithFallback(text: string, context: string): string {
    try {
        return decrypt(text, ENCRYPTION_KEY);
    } catch (_e) {
        try {
            return decrypt(text, LEGACY_ENCRYPTION_KEY);
        } catch (_e2) {
            logger.error(`❌ Fallo crítico de descifrado para: ${context}`);
            throw _e;
        }
    }
}

// Convierte un StoredUser del sistema al formato de columnas de Supabase
function toRow(user: StoredUser): Record<string, unknown> {
    return {
        user_id: user.userId,
        login: user.login,
        display_name: user.displayName,
        access_token: user.accessToken ?? null,
        refresh_token: user.refreshToken ?? null,
        api_key: user.apiKey ?? null,
        is_active: user.isActive ?? true,
        blocked_reason: user.blockedReason ?? null,
        custom_rate_limit: user.customRateLimit ?? null,
        profile_image_url: user.profileImageUrl ?? null,
        timezone: user.timezone ?? 'UTC',
        last_active: user.lastActive
            ? new Date(user.lastActive).toISOString()
            : new Date().toISOString(),
        created_at: user.createdAt
            ? new Date(user.createdAt).toISOString()
            : new Date().toISOString()
    };
}

// Convierte una fila de Supabase al tipo StoredUser de la aplicación
function fromRow(row: Record<string, unknown>): StoredUser {
    return {
        userId: row.user_id as string,
        login: row.login as string,
        displayName: row.display_name as string,
        accessToken: (row.access_token as string) ?? '',
        refreshToken: (row.refresh_token as string) ?? '',
        expiresIn: 0,
        obtainedAt: 0,
        apiKey: (row.api_key as string) ?? undefined,
        isActive: row.is_active as boolean,
        blockedReason: (row.blocked_reason as string) ?? undefined,
        customRateLimit: (row.custom_rate_limit as number) ?? undefined,
        profileImageUrl: (row.profile_image_url as string) ?? undefined,
        timezone: (row.timezone as string) ?? 'UTC',
        lastActive: (row.last_active as string) ?? undefined,
        createdAt: (row.created_at as string) ?? undefined
    };
}

export const saveUser = async (user: StoredUser): Promise<void> => {
    // Clonamos sin modificar el objeto original
    const secureUser = { ...user };
    if (secureUser.isActive === undefined) secureUser.isActive = true;

    // Solo ciframos si el token NO está ya cifrado (contiene ':' que usa el formato iv:encrypted)
    const isAlreadyEncrypted = (val: string) => val.includes(':') && val.length > 60;

    if (secureUser.accessToken && !isAlreadyEncrypted(secureUser.accessToken)) {
        secureUser.accessToken = encrypt(secureUser.accessToken);
    }
    if (secureUser.refreshToken && !isAlreadyEncrypted(secureUser.refreshToken)) {
        secureUser.refreshToken = encrypt(secureUser.refreshToken);
    }

    const { error } = await supabase
        .from('users')
        .upsert(toRow(secureUser), { onConflict: 'user_id' });

    if (error) {
        logger.error('Error guardando usuario en Supabase:', error.message);
        throw error;
    }
};

export const getUser = async (userId: string): Promise<StoredUser | null> => {
    const { data, error } = await supabase.from('users').select('*').eq('user_id', userId).single();

    if (error || !data) return null;

    const user = fromRow(data as Record<string, unknown>);
    let needsMigration = false;

    try {
        if (user.accessToken) {
            const plain = decryptTokenWithFallback(user.accessToken, `usuario ${userId}`);
            if (plain !== user.accessToken) needsMigration = true;
            user.accessToken = plain;
        }
        if (user.refreshToken) {
            const plain = decryptTokenWithFallback(user.refreshToken, `usuario ${userId}`);
            if (plain !== user.refreshToken) needsMigration = true;
            user.refreshToken = plain;
        }
    } catch (e) {
        logger.error(`⚠️ Error en descifrado para ${userId}:`, (e as Error).message);
    }

    if (needsMigration) {
        logger.info(`🔄 Migrando claves de cifrado para usuario: ${user.login} (${userId})`);
        await saveUser(user);
    }

    return user;
};

export const getUserByLogin = async (login: string): Promise<StoredUser | null> => {
    const cacheKey = `cache:user:login:${login.toLowerCase()}`;

    const cached = await cacheService.get<StoredUser>(cacheKey);
    if (cached) return cached;

    const { data } = await supabase.from('users').select('*').eq('login', login).single();
    if (!data) return null;

    const user = fromRow(data as Record<string, unknown>);

    try {
        if (user.accessToken)
            user.accessToken = decryptTokenWithFallback(user.accessToken, `login ${login}`);
        if (user.refreshToken)
            user.refreshToken = decryptTokenWithFallback(user.refreshToken, `login ${login}`);
    } catch (e) {
        logger.error(`⚠️ Error en descifrado para login ${login}:`, (e as Error).message);
    }

    await cacheService.set(cacheKey, user, 5 * 60);
    return user;
};

export const getUserByApiKey = async (apiKey: string): Promise<StoredUser | null> => {
    let { data, error } = await supabase.from('users').select('*').eq('api_key', apiKey).single();

    // Si no se encontró, intentar con el formato alternativo (con/sin guiones)
    if ((error || !data) && apiKey.replace(/-/g, '').length === 32) {
        const cleanKey = apiKey.replace(/-/g, '');
        const altKey = apiKey.includes('-')
            ? cleanKey
            : `${cleanKey.slice(0, 8)}-${cleanKey.slice(8, 12)}-${cleanKey.slice(12, 16)}-${cleanKey.slice(16, 20)}-${cleanKey.slice(20)}`;

        const { data: altData, error: altError } = await supabase
            .from('users')
            .select('*')
            .eq('api_key', altKey)
            .single();

        if (!altError && altData) {
            data = altData;
            error = null;
        }
    }

    if (error || !data) return null;

    const user = fromRow(data as Record<string, unknown>);

    if (user.isActive === false) {
        logger.warn(`🛑 Blocked user attempted access: ${user.login}`);
        return null;
    }

    try {
        if (user.accessToken)
            user.accessToken = decryptTokenWithFallback(user.accessToken, `api_key ${apiKey}`);
        if (user.refreshToken)
            user.refreshToken = decryptTokenWithFallback(user.refreshToken, `api_key ${apiKey}`);
    } catch (_e) {
        logger.error(`⚠️ Error descifrando tokens para api_key: ${apiKey}`);
    }

    return user;
};

export const updateLastActive = async (userId: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('users')
            .update({ last_active: new Date().toISOString() })
            .eq('user_id', userId);

        if (error) logger.error('Error actualizando last_active:', error.message);
    } catch (e) {
        logger.error('Error updating last active:', e);
    }
};

export const deleteUser = async (userId: string): Promise<void> => {
    try {
        const user = await getUser(userId);
        if (!user) return;

        // El CASCADE definido en el esquema SQL de Supabase borra automáticamente
        // los registros relacionados en user_stats, activity_logs y admins.
        const { error } = await supabase.from('users').delete().eq('user_id', userId);

        if (error) throw error;

        logger.info(`🗑️ Usuario eliminado por completo: ${user.login} (${userId})`);
    } catch (e) {
        logger.error('Error deleting user:', e);
        throw e;
    }
};

export const updateUserTimezone = async (userId: string, timezone: string): Promise<void> => {
    const { error } = await supabase.from('users').update({ timezone }).eq('user_id', userId);

    if (error) throw error;
};
