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

const DEFAULT_CONFIG: CommandConfigState = {
    bot: 'nightbot',
    template: '',
    format: 'full',
    extraValues: {}
};

/** Referencia estable para useSyncExternalStore cuando no hay resultado guardado */
export const EMPTY_TEST_RESULT: CommandTestResult = { status: null, message: '' };

let state: CommandStoreState = {
    configs: {},
    testFields: {},
    testResults: {}
};

const listeners = new Set<() => void>();

function emit() {
    listeners.forEach((listener) => listener());
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
    emit();
}
