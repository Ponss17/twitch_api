export interface CommandConfigState {
    bot: string;
    template: string;
    format: 'full' | 'url';
    extraValues: Record<string, string>;
}

export interface CommandTestResult {
    status: 'success' | 'error' | null;
    message: string;
}

interface CommandStoreState {
    configs: Record<string, CommandConfigState>;
    testFields: Record<string, Record<string, string>>;
    testResults: Record<string, CommandTestResult>;
}

interface PersistedCommandStore {
    configs: Record<string, CommandConfigState>;
    testFields: Record<string, Record<string, string>>;
}

const STORAGE_KEY = 'twitch_command_store_v1';
const PERSIST_DEBOUNCE_MS = 400;

const DEFAULT_CONFIG: CommandConfigState = {
    bot: 'nightbot',
    template: '',
    format: 'full',
    extraValues: {}
};

/** Referencia estable para useSyncExternalStore cuando no hay resultado guardado */
export const EMPTY_TEST_RESULT: CommandTestResult = { status: null, message: '' };

const EMPTY_STATE: CommandStoreState = {
    configs: {},
    testFields: {},
    testResults: {}
};

function loadPersistedState(): Pick<CommandStoreState, 'configs' | 'testFields'> {
    if (typeof window === 'undefined') {
        return { configs: {}, testFields: {} };
    }

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { configs: {}, testFields: {} };

        const parsed = JSON.parse(raw) as PersistedCommandStore;
        return {
            configs: parsed.configs && typeof parsed.configs === 'object' ? parsed.configs : {},
            testFields: parsed.testFields && typeof parsed.testFields === 'object' ? parsed.testFields : {}
        };
    } catch {
        return { configs: {}, testFields: {} };
    }
}

let state: CommandStoreState = {
    ...EMPTY_STATE,
    ...loadPersistedState()
};

const listeners = new Set<() => void>();
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePersist(): void {
    if (typeof window === 'undefined') return;

    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
        persistTimer = null;
        try {
            const payload: PersistedCommandStore = {
                configs: state.configs,
                testFields: state.testFields
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } catch {
            /* quota exceeded */
        }
    }, PERSIST_DEBOUNCE_MS);
}

function emit(persist = true) {
    listeners.forEach((listener) => listener());
    if (persist) schedulePersist();
}

function configsEqual(a: CommandConfigState, b: CommandConfigState): boolean {
    if (a.bot !== b.bot || a.template !== b.template || a.format !== b.format) return false;
    const aKeys = Object.keys(a.extraValues);
    const bKeys = Object.keys(b.extraValues);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => a.extraValues[key] === b.extraValues[key]);
}

export function subscribeCommandStore(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function getCommandConfig(commandId: string): CommandConfigState {
    // Referencia estable cuando no hay config guardada (requerido por useSyncExternalStore).
    return state.configs[commandId] ?? DEFAULT_CONFIG;
}

export function setCommandConfig(commandId: string, partial: Partial<CommandConfigState>): void {
    const current = getCommandConfig(commandId);
    const next: CommandConfigState = {
        ...current,
        ...partial,
        extraValues: partial.extraValues
            ? { ...current.extraValues, ...partial.extraValues }
            : current.extraValues
    };

    if (state.configs[commandId] && configsEqual(state.configs[commandId], next)) {
        return;
    }

    state = {
        ...state,
        configs: {
            ...state.configs,
            [commandId]: next
        }
    };
    emit();
}

export function getCommandTestField(commandId: string, field: string, fallback = ''): string {
    return state.testFields[commandId]?.[field] ?? fallback;
}

export function setCommandTestField(commandId: string, field: string, value: string): void {
    const current = state.testFields[commandId]?.[field];
    if (current === value) return;

    state = {
        ...state,
        testFields: {
            ...state.testFields,
            [commandId]: {
                ...(state.testFields[commandId] ?? {}),
                [field]: value
            }
        }
    };
    emit();
}

export function getCommandTestResult(testId: string): CommandTestResult {
    return state.testResults[testId] ?? EMPTY_TEST_RESULT;
}

export function setCommandTestResult(testId: string, result: CommandTestResult): void {
    const current = state.testResults[testId] ?? EMPTY_TEST_RESULT;
    if (current.status === result.status && current.message === result.message) {
        return;
    }

    state = {
        ...state,
        testResults: {
            ...state.testResults,
            [testId]: result
        }
    };
    emit(false);
}
