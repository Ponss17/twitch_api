import { useCallback, useEffect, useRef, useState } from 'react';
import { API_ENDPOINTS } from '@/core/config/config';
import { authHeaders, withApiCredentials } from '@/core/api/auth';
import { fetchWithRetry } from '@/core/api/fetchWithRetry';
import { useRequiredSession } from '@/core/session/useSession';
import {
    isUserAuditAction,
    type UserAuditLogEntry
} from '@/features/dashboard/lib/auditLogDisplay';

type AuditLogsResponse = {
    logs?: unknown[];
    page?: number;
    pageSize?: number;
    total?: number;
};

export function useSettingsAuditLogs(active: boolean, refreshEpoch: number) {
    const session = useRequiredSession();
    const [page, setPage] = useState(1);
    const [logs, setLogs] = useState<UserAuditLogEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [pageSize, setPageSize] = useState(20);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const sessionRef = useRef(session);
    sessionRef.current = session;

    useEffect(() => {
        setPage(1);
    }, [refreshEpoch]);

    useEffect(() => {
        if (!active || !session.userId) return;

        const controller = new AbortController();
        const currentSession = sessionRef.current;
        setLoading(true);
        setError(false);

        void (async () => {
            try {
                const res = await fetchWithRetry(
                    `${API_ENDPOINTS.AUDIT_LOGS}?page=${page}`,
                    withApiCredentials({
                        headers: authHeaders(currentSession),
                        signal: controller.signal
                    })
                );
                if (controller.signal.aborted) return;
                if (!res.ok) {
                    setLogs([]);
                    setTotal(0);
                    setError(true);
                    return;
                }
                const data = (await res.json()) as AuditLogsResponse;
                if (controller.signal.aborted) return;
                const mapped: UserAuditLogEntry[] = [];
                for (const row of data.logs ?? []) {
                    if (!row || typeof row !== 'object') continue;
                    const entry = row as {
                        action?: unknown;
                        createdAt?: unknown;
                        scopes?: { stats?: unknown; questions?: unknown };
                    };
                    if (typeof entry.action !== 'string' || !isUserAuditAction(entry.action)) continue;
                    if (typeof entry.createdAt !== 'string' || !entry.createdAt) continue;
                    const next: UserAuditLogEntry = {
                        action: entry.action,
                        createdAt: entry.createdAt
                    };
                    if (entry.action === 'stats_cleared' && entry.scopes) {
                        next.scopes = {
                            stats: entry.scopes.stats === true,
                            questions: entry.scopes.questions === true
                        };
                    }
                    mapped.push(next);
                }
                setLogs(mapped);
                setPageSize(typeof data.pageSize === 'number' && data.pageSize > 0 ? data.pageSize : 20);
                setTotal(typeof data.total === 'number' && data.total >= 0 ? data.total : mapped.length);
            } catch (e) {
                if (controller.signal.aborted || (e as Error).name === 'AbortError') return;
                setLogs([]);
                setTotal(0);
                setError(true);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        })();

        return () => controller.abort();
    }, [active, page, refreshEpoch, session.userId]);

    const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);

    const goPrev = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
    const goNext = useCallback(
        () => setPage((p) => Math.min(pageCount, p + 1)),
        [pageCount]
    );

    return {
        logs,
        page,
        pageCount,
        total,
        loading,
        error,
        goPrev,
        goNext
    };
}
