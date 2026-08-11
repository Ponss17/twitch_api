export type QuestionStatus = 'pending' | 'answered' | 'skipped';

export interface QuestionItem {
    id: string;
    username: string;
    displayName: string;
    text: string;
    createdAt: number;
    status: QuestionStatus;
}

export const MAX_QUESTION_ITEMS = 100;
export const QUESTION_MAX_AGE_DAYS = 7;
