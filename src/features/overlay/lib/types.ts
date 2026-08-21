import type { RouletteUser } from '@/core/types/twitch';

export type OverlayTool = 'roulette' | 'trends' | 'questions';

export const OVERLAY_PAGE_PATHS: Record<OverlayTool, string> = {
    roulette: '/overlay/roulette',
    trends: '/overlay/trends',
    questions: '/overlay/questions'
};

export interface RouletteOverlayState {
    chatters: RouletteUser[];
    isOpen: boolean;
    isSpinning: boolean;
    wheelRotation: number;
    wheelTransition: string;
    winner: RouletteUser | null;
    lastSpinCount: number;
    spinSeq: number;
    targetRotation?: number;
    spinDuration?: number;
    wheelColor?: string;
    updatedAt: number;
}

export interface TrendsOverlayState {
    tracking: boolean;
    remaining: number;
    timerEnded: boolean;
    wordCounts: Record<string, number>;
    minutes: number;
    displayName: string;
    sessionActive: boolean;
    /** Timestamp absoluto de fin — el overlay calcula la cuenta atrás sin polling. */
    timerEndsAt?: number;
    updatedAt: number;
}

export interface QuestionsOverlayCurrent {
    displayName: string;
    text: string;
}

export interface QuestionsOverlayState {
    isActive: boolean;
    keyword: string;
    pendingCount: number;
    current: QuestionsOverlayCurrent | null;
    updatedAt: number;
}

export type OverlayStateMap = {
    roulette: RouletteOverlayState;
    trends: TrendsOverlayState;
    questions: QuestionsOverlayState;
};

export type OverlayStateForTool<T extends OverlayTool> = OverlayStateMap[T];
export type AnyOverlayState = OverlayStateMap[OverlayTool];

export function emptyRouletteOverlayState(): RouletteOverlayState {
    return {
        chatters: [],
        isOpen: false,
        isSpinning: false,
        wheelRotation: 0,
        wheelTransition: 'none',
        winner: null,
        lastSpinCount: 0,
        spinSeq: 0,
        updatedAt: Date.now()
    };
}

export function emptyTrendsOverlayState(displayName = 'Channel'): TrendsOverlayState {
    return {
        tracking: false,
        remaining: 0,
        timerEnded: false,
        wordCounts: {},
        minutes: 5,
        displayName,
        sessionActive: false,
        updatedAt: Date.now()
    };
}

export function emptyQuestionsOverlayState(): QuestionsOverlayState {
    return {
        isActive: false,
        keyword: 'pregunta',
        pendingCount: 0,
        current: null,
        updatedAt: Date.now()
    };
}

export function emptyOverlayState(
    tool: OverlayTool,
    displayName = 'Channel'
): AnyOverlayState {
    if (tool === 'roulette') return emptyRouletteOverlayState();
    if (tool === 'questions') return emptyQuestionsOverlayState();
    return emptyTrendsOverlayState(displayName);
}
