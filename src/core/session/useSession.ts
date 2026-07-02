import { useContext } from 'react';
import { SessionContext, type SessionContextValue } from '@/core/session/context';
import type { Session } from '@/core/config/config';

export function useSession(): SessionContextValue {
    const ctx = useContext(SessionContext);
    if (!ctx) {
        throw new Error('useSession must be used within SessionProvider');
    }
    return ctx;
}

export function useRequiredSession(): Session {
    const { session } = useSession();
    if (!session) {
        throw new Error('useRequiredSession requires an authenticated session');
    }
    return session;
}
