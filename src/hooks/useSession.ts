import { useContext } from 'react';
import { SessionContext, type SessionContextValue } from '@/lib/sessionContext';
import type { Session } from '@/lib/config';

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
