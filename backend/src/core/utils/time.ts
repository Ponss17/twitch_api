/**
 * Utilidades para formateo de tiempo y fechas con soporte multi-idioma (ES, EN, PT).
 */

export type SupportedLanguage = 'es' | 'en' | 'pt';

const TIME_UNITS: Record<SupportedLanguage, {
    year: [string, string];
    month: [string, string];
    day: [string, string];
    hour: [string, string];
    minute: [string, string];
    second: [string, string];
    and: string;
}> = {
    es: {
        year: ['año', 'años'],
        month: ['mes', 'meses'],
        day: ['día', 'días'],
        hour: ['hora', 'horas'],
        minute: ['minuto', 'minutos'],
        second: ['segundo', 'segundos'],
        and: ' y '
    },
    en: {
        year: ['year', 'years'],
        month: ['month', 'months'],
        day: ['day', 'days'],
        hour: ['hour', 'hours'],
        minute: ['minute', 'minutes'],
        second: ['second', 'seconds'],
        and: ' and '
    },
    pt: {
        year: ['ano', 'anos'],
        month: ['mês', 'meses'],
        day: ['dia', 'dias'],
        hour: ['hora', 'horas'],
        minute: ['minuto', 'minutos'],
        second: ['segundo', 'segundos'],
        and: ' e '
    }
};

export const normalizeLanguage = (lang?: string): SupportedLanguage => {
    if (!lang) return 'es';
    const lower = lang.toLowerCase().trim();
    if (lower.startsWith('en')) return 'en';
    if (lower.startsWith('pt')) return 'pt';
    return 'es';
};

export const formatDuration = (ms: number, lang: string = 'es'): string => {
    const validLang = normalizeLanguage(lang);
    const u = TIME_UNITS[validLang];

    const parts = {
        years: Math.floor(ms / (1000 * 60 * 60 * 24 * 365)),
        months: Math.floor((ms % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30)),
        days: Math.floor((ms % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24)),
        hours: Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((ms % (1000 * 60)) / 1000)
    };

    const timeString: string[] = [];
    if (parts.years > 0) timeString.push(`${parts.years} ${parts.years === 1 ? u.year[0] : u.year[1]}`);
    if (parts.months > 0) timeString.push(`${parts.months} ${parts.months === 1 ? u.month[0] : u.month[1]}`);
    if (parts.days > 0) timeString.push(`${parts.days} ${parts.days === 1 ? u.day[0] : u.day[1]}`);
    if (parts.hours > 0) timeString.push(`${parts.hours} ${parts.hours === 1 ? u.hour[0] : u.hour[1]}`);
    if (parts.minutes > 0)
        timeString.push(`${parts.minutes} ${parts.minutes === 1 ? u.minute[0] : u.minute[1]}`);
    if (parts.seconds > 0 || timeString.length === 0)
        timeString.push(`${parts.seconds} ${parts.seconds === 1 ? u.second[0] : u.second[1]}`);

    if (timeString.length > 1) {
        return timeString.slice(0, -1).join(', ') + u.and + timeString.slice(-1);
    }
    return timeString[0];
};

/**
 * Calcula la diferencia entre dos fechas y devuelve la frase formateada.
 */
export const getTimePhraseBetween = (
    start: Date,
    end: Date = new Date(),
    lang: string = 'es'
): string => {
    const diff = Math.abs(end.getTime() - start.getTime());
    return formatDuration(diff, lang);
};
