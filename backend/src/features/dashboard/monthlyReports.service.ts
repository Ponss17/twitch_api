import { supabase } from '../../core/database/supabaseClient';
import * as dbService from '../../core/database/dbService';
import { logger } from '../../core/utils/logger';
import {
    getPreviousYearMonth,
    getYearMonthBounds,
    isValidYearMonth,
    shiftYearMonth
} from '../../core/utils/yearMonth';

export interface MonthlyReportCommandStat {
    name: string;
    requests: number;
    errors: number;
    avgLatencyMs: number;
}

export interface MonthlyReportDailyPoint {
    date: string;
    requests: number;
    errors: number;
}

export interface MonthlyReportViewer {
    user_name: string;
    total: number;
    last_seen: string;
}

export interface MonthlyReportSummary {
    yearMonth: string;
    timezone: string;
    totalRequests: number;
    totalErrors: number;
    successRate: number;
    avgLatencyMs: number;
    uniqueCommands: number;
    commands: MonthlyReportCommandStat[];
    daily: MonthlyReportDailyPoint[];
    topViewers: MonthlyReportViewer[];
    previous?: {
        yearMonth: string;
        totalRequests: number;
        successRate: number;
        avgLatencyMs: number;
        requestsDelta: number;
    } | null;
}

export interface MonthlyReportRow {
    id: string;
    user_id: string;
    year_month: string;
    summary: MonthlyReportSummary;
    created_at: string;
}

export interface UserNotificationRow {
    id: string;
    user_id: string;
    type: string;
    title: string;
    body: string;
    payload: Record<string, unknown>;
    read_at: string | null;
    created_at: string;
}

type DailyRow = {
    date?: string;
    command_name?: string;
    requests_count?: number;
    errors_count?: number;
    latency_sum?: number;
};

/** PostgREST / schema cache: tablas aún no migradas. */
export function isMissingRelationError(error: unknown): boolean {
    const message =
        typeof error === 'object' && error && 'message' in error
            ? String((error as { message?: unknown }).message ?? '')
            : String(error ?? '');
    return (
        /Could not find the table/i.test(message) ||
        /relation .* does not exist/i.test(message) ||
        /schema cache/i.test(message)
    );
}

function buildSummaryFromDaily(
    yearMonth: string,
    timezone: string,
    rows: DailyRow[],
    topViewers: MonthlyReportViewer[],
    previous: MonthlyReportSummary['previous']
): MonthlyReportSummary {
    const commandMap = new Map<string, { requests: number; errors: number; latency: number }>();
    const dailyMap = new Map<string, { requests: number; errors: number }>();

    let totalRequests = 0;
    let totalErrors = 0;
    let totalLatency = 0;

    for (const row of rows) {
        const date = String(row.date ?? '');
        const name = String(row.command_name ?? 'other');
        const requests = Number(row.requests_count ?? 0);
        const errors = Number(row.errors_count ?? 0);
        const latency = Number(row.latency_sum ?? 0);

        totalRequests += requests;
        totalErrors += errors;
        totalLatency += latency;

        if (date) {
            const day = dailyMap.get(date) ?? { requests: 0, errors: 0 };
            day.requests += requests;
            day.errors += errors;
            dailyMap.set(date, day);
        }

        const cmd = commandMap.get(name) ?? { requests: 0, errors: 0, latency: 0 };
        cmd.requests += requests;
        cmd.errors += errors;
        cmd.latency += latency;
        commandMap.set(name, cmd);
    }

    const commands = Array.from(commandMap.entries())
        .map(([name, s]) => ({
            name,
            requests: s.requests,
            errors: s.errors,
            avgLatencyMs: s.requests > 0 ? Math.round(s.latency / s.requests) : 0
        }))
        .sort((a, b) => b.requests - a.requests);

    const daily = Array.from(dailyMap.entries())
        .map(([date, s]) => ({ date, requests: s.requests, errors: s.errors }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return {
        yearMonth,
        timezone,
        totalRequests,
        totalErrors,
        successRate:
            totalRequests > 0
                ? Math.round(((1 - totalErrors / totalRequests) * 1000)) / 10
                : 0,
        avgLatencyMs: totalRequests > 0 ? Math.round(totalLatency / totalRequests) : 0,
        uniqueCommands: commands.length,
        commands,
        daily,
        topViewers,
        previous
    };
}

async function loadUserTimezone(userId: string): Promise<string> {
    const user = await dbService.getUser(userId);
    return user?.timezone || 'UTC';
}

async function fetchExistingReport(
    userId: string,
    yearMonth: string
): Promise<MonthlyReportRow | null> {
    const { data, error } = await supabase
        .from('monthly_reports')
        .select('id, user_id, year_month, summary, created_at')
        .eq('user_id', userId)
        .eq('year_month', yearMonth)
        .maybeSingle();

    if (error) {
        if (isMissingRelationError(error)) {
            logger.warn('monthly_reports no disponible (¿migración pendiente?):', error.message);
            return null;
        }
        logger.error('Error leyendo monthly_report:', error.message);
        throw error;
    }
    return (data as MonthlyReportRow | null) ?? null;
}

async function buildMonthSummary(
    userId: string,
    timezone: string,
    yearMonth: string,
    includePrevious: boolean
): Promise<MonthlyReportSummary | null> {
    const { start, end } = getYearMonthBounds(yearMonth);
    const [rows, topViewers] = await Promise.all([
        dbService.getDailyStatsByDateRange(userId, start, end),
        dbService.getViewerLeaderboardForRange(userId, start, end, 10)
    ]);

    if (!rows.length) return null;

    let previous: MonthlyReportSummary['previous'] = null;
    if (includePrevious) {
        const prevMonth = shiftYearMonth(yearMonth, -1);
        const existingPrev = await fetchExistingReport(userId, prevMonth);
        if (existingPrev?.summary) {
            const s = existingPrev.summary;
            previous = {
                yearMonth: prevMonth,
                totalRequests: s.totalRequests,
                successRate: s.successRate,
                avgLatencyMs: s.avgLatencyMs,
                requestsDelta: 0 // filled below
            };
        } else {
            const prevBounds = getYearMonthBounds(prevMonth);
            const prevRows = await dbService.getDailyStatsByDateRange(
                userId,
                prevBounds.start,
                prevBounds.end
            );
            if (prevRows.length) {
                const prevSummary = buildSummaryFromDaily(
                    prevMonth,
                    timezone,
                    prevRows as DailyRow[],
                    [],
                    null
                );
                previous = {
                    yearMonth: prevMonth,
                    totalRequests: prevSummary.totalRequests,
                    successRate: prevSummary.successRate,
                    avgLatencyMs: prevSummary.avgLatencyMs,
                    requestsDelta: 0
                };
            }
        }
    }

    const summary = buildSummaryFromDaily(
        yearMonth,
        timezone,
        rows as DailyRow[],
        topViewers,
        previous
            ? {
                  ...previous,
                  requestsDelta: 0
              }
            : null
    );

    if (summary.previous) {
        summary.previous.requestsDelta =
            summary.totalRequests - summary.previous.totalRequests;
    }

    return summary;
}

async function insertNotificationForReport(
    userId: string,
    report: MonthlyReportRow
): Promise<void> {
    const { data: existingRows, error: existingError } = await supabase
        .from('user_notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'monthly_report')
        .contains('payload', { yearMonth: report.year_month })
        .limit(1);

    if (existingError) {
        if (isMissingRelationError(existingError)) {
            logger.warn(
                'user_notifications no disponible (¿migración pendiente?):',
                existingError.message
            );
            return;
        }
        logger.error('Error buscando notificación de reporte:', existingError.message);
        throw existingError;
    }

    if ((existingRows ?? []).length > 0) return;

    const { error } = await supabase.from('user_notifications').insert({
        user_id: userId,
        type: 'monthly_report',
        title: 'Reporte mensual listo',
        body: `Tu resumen de ${report.year_month} ya está disponible.`,
        payload: {
            reportId: report.id,
            yearMonth: report.year_month
        }
    });

    if (error) {
        if (isMissingRelationError(error)) {
            logger.warn('user_notifications insert omitido (migración pendiente):', error.message);
            return;
        }
        // Carrera / índice único: ya existe para ese mes
        if (error.code === '23505') return;
        logger.error('Error insertando notificación de reporte:', error.message);
        throw error;
    }
}

/**
 * Crea el reporte del mes calendario anterior si falta y hay datos.
 * Idempotente: no duplica reporte ni notificación.
 */
export async function ensurePreviousMonthlyReport(userId: string): Promise<{
    created: boolean;
    report: MonthlyReportRow | null;
}> {
    const timezone = await loadUserTimezone(userId);
    const yearMonth = getPreviousYearMonth(timezone);

    const existing = await fetchExistingReport(userId, yearMonth);
    if (existing) {
        await insertNotificationForReport(userId, existing).catch(() => undefined);
        return { created: false, report: existing };
    }

    const summary = await buildMonthSummary(userId, timezone, yearMonth, true);
    if (!summary) {
        return { created: false, report: null };
    }

    const { data, error } = await supabase
        .from('monthly_reports')
        .upsert(
            {
                user_id: userId,
                year_month: yearMonth,
                summary
            },
            { onConflict: 'user_id,year_month', ignoreDuplicates: true }
        )
        .select('id, user_id, year_month, summary, created_at')
        .maybeSingle();

    if (error) {
        if (isMissingRelationError(error)) {
            logger.warn('monthly_reports upsert omitido (migración pendiente):', error.message);
            return { created: false, report: null };
        }
        // Carrera: otro ensure ya lo creó
        const raced = await fetchExistingReport(userId, yearMonth);
        if (raced) {
            await insertNotificationForReport(userId, raced).catch(() => undefined);
            return { created: false, report: raced };
        }
        logger.error('Error guardando monthly_report:', error.message);
        throw error;
    }

    // ignoreDuplicates: conflicto no devuelve fila → reutilizar la existente
    const report = (data as MonthlyReportRow | null) ?? (await fetchExistingReport(userId, yearMonth));
    if (!report) {
        return { created: false, report: null };
    }

    const created = Boolean(data);
    await insertNotificationForReport(userId, report);
    return { created, report };
}

export async function listMonthlyReports(userId: string): Promise<
    Array<{ id: string; yearMonth: string; createdAt: string; totalRequests: number; successRate: number }>
> {
    const { data, error } = await supabase
        .from('monthly_reports')
        .select('id, year_month, created_at, summary')
        .eq('user_id', userId)
        .order('year_month', { ascending: false })
        .limit(36);

    if (error) {
        if (isMissingRelationError(error)) {
            logger.warn('list monthly_reports omitido (migración pendiente):', error.message);
            return [];
        }
        logger.error('Error listando monthly_reports:', error.message);
        throw error;
    }

    return (data ?? []).map((row) => {
        const summary = (row.summary ?? {}) as Partial<MonthlyReportSummary>;
        return {
            id: row.id as string,
            yearMonth: row.year_month as string,
            createdAt: row.created_at as string,
            totalRequests: Number(summary.totalRequests ?? 0),
            successRate: Number(summary.successRate ?? 0)
        };
    });
}

export async function getMonthlyReport(
    userId: string,
    yearMonth: string
): Promise<MonthlyReportRow | null> {
    if (!isValidYearMonth(yearMonth)) return null;
    return fetchExistingReport(userId, yearMonth);
}

export async function listUserNotifications(
    userId: string,
    limit = 30
): Promise<UserNotificationRow[]> {
    const safeLimit = Math.max(1, Math.min(Math.floor(limit), 50));
    const { data, error } = await supabase
        .from('user_notifications')
        .select('id, user_id, type, title, body, payload, read_at, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(safeLimit);

    if (error) {
        if (isMissingRelationError(error)) {
            logger.warn('list user_notifications omitido (migración pendiente):', error.message);
            return [];
        }
        logger.error('Error listando notificaciones:', error.message);
        throw error;
    }

    return (data as UserNotificationRow[]) ?? [];
}

export async function markNotificationRead(
    userId: string,
    notificationId: string
): Promise<boolean> {
    const { data, error } = await supabase
        .from('user_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('id', notificationId)
        .is('read_at', null)
        .select('id')
        .maybeSingle();

    if (error) {
        if (isMissingRelationError(error)) {
            logger.warn('mark notification omitido (migración pendiente):', error.message);
            return false;
        }
        logger.error('Error marcando notificación leída:', error.message);
        throw error;
    }

    if (data?.id) return true;

    // Ya leída o inexistente / ajena → comprobar existencia propia
    const { data: own } = await supabase
        .from('user_notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('id', notificationId)
        .maybeSingle();

    return Boolean(own?.id);
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
    const { data, error } = await supabase
        .from('user_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null)
        .select('id');

    if (error) {
        if (isMissingRelationError(error)) {
            logger.warn('mark all notifications omitido (migración pendiente):', error.message);
            return 0;
        }
        logger.error('Error marcando todas las notificaciones:', error.message);
        throw error;
    }

    return data?.length ?? 0;
}
