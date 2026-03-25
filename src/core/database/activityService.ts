import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';

const MAX_USER_LOGS = 50;

export interface ActivityLogEntry {
    type: 'clip' | 'followage' | 'shoutout' | 'message' | 'russian' | 'magic8' | 'duel' | 'other';
    user: string;
    detail?: string;
}

export interface StoredActivityLog {
    timestamp: string;
    type: string;
    user: string;
    detail?: string;
}

export const addUserActivity = async (userId: string, entry: ActivityLogEntry): Promise<void> => {
    try {
        const { error } = await supabase.from('activity_logs').insert({
            user_id: userId,
            activity_type: entry.type,
            user_name: entry.user, // Guardamos el nombre del usuario (viewer/streamer)
            detail: entry.detail ?? null,
            created_at: new Date().toISOString()
        });

        if (error) logger.error('Error guardando actividad de usuario:', error.message);
    } catch (e) {
        logger.error('Error adding user activity:', e);
    }
};

export const getUserActivity = async (userId: string): Promise<StoredActivityLog[]> => {
    try {
        const { data, error } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(MAX_USER_LOGS);

        if (error || !data) return [];

        return data.map((row) => ({
            timestamp: row.created_at as string,
            type: row.activity_type as string,
            user: (row.user_name as string) || 'Usuario', // Devolvemos el nombre guardado
            detail: (row.detail as string) ?? undefined
        }));
    } catch (e) {
        logger.error('Error getting user activity:', e);
        return [];
    }
};
