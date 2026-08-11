import { API_ENDPOINTS, type Session } from '@/core/config/config';
import { apiFetch } from '@/core/api/auth';
import type { QuestionItem, QuestionStatus } from '@/features/tools/questions/lib/questionTypes';

type QuestionsPayload = {
    items?: QuestionItem[];
    maxItems?: number;
    maxAgeDays?: number;
};

export async function fetchQuestions(session: Session): Promise<QuestionItem[]> {
    const data = await apiFetch<QuestionsPayload>(API_ENDPOINTS.QUESTIONS, session, {}, { logoutOn401: false });
    return Array.isArray(data.items) ? data.items : [];
}

export async function persistQuestion(session: Session, item: QuestionItem): Promise<QuestionItem[]> {
    const data = await apiFetch<QuestionsPayload>(
        API_ENDPOINTS.QUESTIONS,
        session,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: item.id,
                username: item.username,
                displayName: item.displayName,
                text: item.text,
                status: item.status,
                createdAt: item.createdAt
            })
        },
        { logoutOn401: false }
    );
    return Array.isArray(data.items) ? data.items : [];
}

export async function persistQuestionStatus(
    session: Session,
    id: string,
    status: QuestionStatus
): Promise<QuestionItem[]> {
    const data = await apiFetch<QuestionsPayload>(
        `${API_ENDPOINTS.QUESTIONS}${encodeURIComponent(id)}/`,
        session,
        {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        },
        { logoutOn401: false }
    );
    return Array.isArray(data.items) ? data.items : [];
}

export async function persistRemoveQuestion(session: Session, id: string): Promise<QuestionItem[]> {
    const data = await apiFetch<QuestionsPayload>(
        `${API_ENDPOINTS.QUESTIONS}${encodeURIComponent(id)}/`,
        session,
        { method: 'DELETE' },
        { logoutOn401: false }
    );
    return Array.isArray(data.items) ? data.items : [];
}

export async function persistClearQuestions(
    session: Session,
    onlyDone = false
): Promise<QuestionItem[]> {
    const url = onlyDone ? `${API_ENDPOINTS.QUESTIONS}?done=1` : API_ENDPOINTS.QUESTIONS;
    const data = await apiFetch<QuestionsPayload>(
        url,
        session,
        { method: 'DELETE' },
        { logoutOn401: false }
    );
    return Array.isArray(data.items) ? data.items : [];
}
