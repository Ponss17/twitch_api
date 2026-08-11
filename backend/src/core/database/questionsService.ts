import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';

export const MAX_STREAMER_QUESTIONS = 100;
export const STREAMER_QUESTIONS_MAX_AGE_DAYS = 7;

export type StreamerQuestionStatus = 'pending' | 'answered' | 'skipped';

export type StreamerQuestionRow = {
    id: string;
    user_id: string;
    username: string;
    display_name: string;
    question_text: string;
    status: StreamerQuestionStatus;
    created_at: string;
};

export type StreamerQuestionInput = {
    id: string;
    username: string;
    displayName: string;
    text: string;
    status?: StreamerQuestionStatus;
    createdAt?: number;
};

function mapRow(row: StreamerQuestionRow) {
    return {
        id: row.id,
        username: row.username,
        displayName: row.display_name,
        text: row.question_text,
        createdAt: new Date(row.created_at).getTime(),
        status: row.status
    };
}

async function pruneUserQuestions(userId: string): Promise<void> {
    const { error } = await supabase.rpc('prune_streamer_questions', {
        p_user_id: userId,
        p_max: MAX_STREAMER_QUESTIONS,
        p_max_age_days: STREAMER_QUESTIONS_MAX_AGE_DAYS
    });

    if (!error) return;

    logger.warn('prune_streamer_questions RPC fallback:', error.message);
    const cutoff = new Date(
        Date.now() - STREAMER_QUESTIONS_MAX_AGE_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    await supabase
        .from('streamer_questions')
        .delete()
        .eq('user_id', userId)
        .lt('created_at', cutoff);

    const { data: keep } = await supabase
        .from('streamer_questions')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(MAX_STREAMER_QUESTIONS, MAX_STREAMER_QUESTIONS + 500);

    const overflowIds = (keep ?? []).map((row) => row.id as string);
    if (overflowIds.length) {
        await supabase
            .from('streamer_questions')
            .delete()
            .eq('user_id', userId)
            .in('id', overflowIds);
    }
}

export async function listStreamerQuestions(userId: string) {
    await pruneUserQuestions(userId);
    const { data, error } = await supabase
        .from('streamer_questions')
        .select('id, user_id, username, display_name, question_text, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(MAX_STREAMER_QUESTIONS);

    if (error) throw error;
    return (data as StreamerQuestionRow[]).map(mapRow);
}

export async function addStreamerQuestion(userId: string, input: StreamerQuestionInput) {
    const createdAt = input.createdAt
        ? new Date(input.createdAt).toISOString()
        : new Date().toISOString();

    const { error } = await supabase.from('streamer_questions').upsert(
        {
            id: input.id,
            user_id: userId,
            username: input.username.slice(0, 64),
            display_name: input.displayName.slice(0, 64),
            question_text: input.text.slice(0, 500),
            status: input.status ?? 'pending',
            created_at: createdAt
        },
        { onConflict: 'user_id,id' }
    );
    if (error) throw error;
    await pruneUserQuestions(userId);
    return listStreamerQuestions(userId);
}

export async function updateStreamerQuestionStatus(
    userId: string,
    id: string,
    status: StreamerQuestionStatus
) {
    const { error } = await supabase
        .from('streamer_questions')
        .update({ status })
        .eq('user_id', userId)
        .eq('id', id);
    if (error) throw error;
    return listStreamerQuestions(userId);
}

export async function deleteStreamerQuestion(userId: string, id: string) {
    const { error } = await supabase
        .from('streamer_questions')
        .delete()
        .eq('user_id', userId)
        .eq('id', id);
    if (error) throw error;
    return listStreamerQuestions(userId);
}

export async function clearStreamerQuestions(
    userId: string,
    onlyDone = false
) {
    let query = supabase.from('streamer_questions').delete().eq('user_id', userId);
    if (onlyDone) {
        query = query.in('status', ['answered', 'skipped']);
    }
    const { error } = await query;
    if (error) throw error;
    return listStreamerQuestions(userId);
}
