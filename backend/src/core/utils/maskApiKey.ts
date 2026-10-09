/** Misma forma que `src/core/utils/utils.ts` (FE) — mantener en sync a propósito. */
export function maskApiKey(key: string): string {
    if (!key || key.length < 8) return '••••••••••••';
    return `${key.slice(0, 4)}${'•'.repeat(Math.min(key.length - 8, 20))}${key.slice(-4)}`;
}
