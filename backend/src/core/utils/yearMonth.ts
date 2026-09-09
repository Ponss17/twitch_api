const YEAR_MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function isValidYearMonth(value: string): boolean {
    return YEAR_MONTH_RE.test(value);
}

function localYmdParts(
    timeZone: string,
    date: Date
): { year: number; month: number; day: number } {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(date);
    const year = Number(parts.find((p) => p.type === 'year')?.value);
    const month = Number(parts.find((p) => p.type === 'month')?.value);
    const day = Number(parts.find((p) => p.type === 'day')?.value);
    return { year, month, day };
}

export function formatYearMonth(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}`;
}

/** Mes calendario anterior en la TZ del usuario (`YYYY-MM`). */
export function getPreviousYearMonth(timeZone: string, now: Date = new Date()): string {
    const { year, month } = localYmdParts(timeZone, now);
    if (month === 1) return formatYearMonth(year - 1, 12);
    return formatYearMonth(year, month - 1);
}

export function getYearMonthBounds(yearMonth: string): { start: string; end: string } {
    const match = YEAR_MONTH_RE.exec(yearMonth);
    if (!match) throw new Error(`yearMonth inválido: ${yearMonth}`);
    const year = Number(match[1]);
    const month = Number(match[2]);
    const start = `${formatYearMonth(year, month)}-01`;
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const end = `${formatYearMonth(year, month)}-${String(lastDay).padStart(2, '0')}`;
    return { start, end };
}

export function shiftYearMonth(yearMonth: string, deltaMonths: number): string {
    const match = YEAR_MONTH_RE.exec(yearMonth);
    if (!match) throw new Error(`yearMonth inválido: ${yearMonth}`);
    const year = Number(match[1]);
    const month = Number(match[2]);
    const idx = year * 12 + (month - 1) + deltaMonths;
    const nextYear = Math.floor(idx / 12);
    const nextMonth = (idx % 12) + 1;
    return formatYearMonth(nextYear, nextMonth);
}
