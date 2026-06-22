import { useCallback, useSyncExternalStore } from 'react';
import {
    EMPTY_TEST_RESULT,
    getCommandConfig,
    getCommandTestField,
    getCommandTestResult,
    setCommandConfig,
    setCommandTestField,
    setCommandTestResult,
    subscribeCommandStore,
    type CommandConfigState,
    type CommandTestResult
} from '@/lib/commandStore';

export function useCommandConfig(commandId: string) {
    const config = useSyncExternalStore(
        subscribeCommandStore,
        () => getCommandConfig(commandId),
        () => getCommandConfig(commandId)
    );

    const update = useCallback(
        (partial: Partial<CommandConfigState>) => {
            setCommandConfig(commandId, partial);
        },
        [commandId]
    );

    return [config, update] as const;
}

export function useCommandTestField(commandId: string, field: string, fallback = '') {
    const value = useSyncExternalStore(
        subscribeCommandStore,
        () => getCommandTestField(commandId, field, fallback),
        () => fallback
    );

    const setValue = useCallback(
        (next: string) => {
            setCommandTestField(commandId, field, next);
        },
        [commandId, field]
    );

    return [value, setValue] as const;
}

export function useCommandTestResult(testId: string) {
    const result = useSyncExternalStore(
        subscribeCommandStore,
        () => getCommandTestResult(testId),
        () => EMPTY_TEST_RESULT
    );

    const setResult = useCallback(
        (next: CommandTestResult) => {
            setCommandTestResult(testId, next);
        },
        [testId]
    );

    return [result, setResult] as const;
}
