const DEFAULT_DESCRIPTION =
    'Pionero de LosPerris API. Manteniendo la barra de calidad absurdamente alta.';
const MAX_DESCRIPTION_CHARS = 160;

export function sanitizePublicTwitchDescription(raw: unknown): string {
    if (typeof raw !== 'string') return DEFAULT_DESCRIPTION;

    let text = raw
        // eslint-disable-next-line no-control-regex -- strip control + bidi chars from Twitch bios
        .replace(/[\u0000-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g, ' ')
        .replace(/<[^>]*>/g, ' ')
        .replace(/https?:\/\/\S+/gi, ' ')
        .replace(/\bwww\.\S+/gi, ' ')
        .replace(/\b(?:discord(?:\.gg|\.com\/invite)|t\.me|telegram\.me)\/\S+/gi, ' ')
        .replace(/\b(?:[a-z0-9-]+\.)+[a-z]{2,24}(?:\/\S*)?/gi, ' ')
        .replace(/[(){}<>[\]]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (text.length < 8) return DEFAULT_DESCRIPTION;
    if (text.length > MAX_DESCRIPTION_CHARS) {
        text = `${text.slice(0, MAX_DESCRIPTION_CHARS - 1).trimEnd()}…`;
    }
    return text;
}
