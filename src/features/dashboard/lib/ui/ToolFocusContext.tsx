import { createContext, useContext, useMemo, type ReactNode } from 'react';

interface ToolFocusContextValue {
    focusMode: boolean;
    exitFocusMode: () => void;
}

const ToolFocusContext = createContext<ToolFocusContextValue>({
    focusMode: false,
    exitFocusMode: () => undefined
});

export function ToolFocusProvider({
    focusMode,
    exitFocusMode,
    children
}: ToolFocusContextValue & { children: ReactNode }) {
    const value = useMemo(
        () => ({ focusMode, exitFocusMode }),
        [focusMode, exitFocusMode]
    );
    return <ToolFocusContext.Provider value={value}>{children}</ToolFocusContext.Provider>;
}

export function useToolFocus(): ToolFocusContextValue {
    return useContext(ToolFocusContext);
}
