import { createContext } from 'react';
import type { Session } from '@/core/config/config';

export interface SessionContextValue {
    session: Session | null;
    loading: boolean;
    authenticated: boolean;
    refresh: () => Promise<void>;
}

/** Módulo dedicado para que Vite comparta una sola instancia del contexto entre chunks lazy. */
export const SessionContext = createContext<SessionContextValue | null>(null);
