import { es } from '@/core/i18n/locales/es';
import { en } from '@/core/i18n/locales/en';
import { pt } from '@/core/i18n/locales/pt';

/** Collect nested object keys; treat functions/arrays/primitives as leaves. */
function collectKeys(value: unknown, prefix = ''): string[] {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        return prefix ? [prefix] : [];
    }

    const keys: string[] = [];
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        const path = prefix ? `${prefix}.${k}` : k;
        keys.push(path);
        if (v !== null && typeof v === 'object' && !Array.isArray(v) && typeof v !== 'function') {
            keys.push(...collectKeys(v, path));
        }
    }
    return keys;
}

function sortedUnique(keys: string[]): string[] {
    return [...new Set(keys)].sort();
}

describe('locale key parity (es / en / pt)', () => {
    it('tiene las mismas claves en es, en y pt', () => {
        const esKeys = sortedUnique(collectKeys(es));
        const enKeys = sortedUnique(collectKeys(en));
        const ptKeys = sortedUnique(collectKeys(pt));

        const missingInEn = esKeys.filter((k) => !enKeys.includes(k));
        const missingInPt = esKeys.filter((k) => !ptKeys.includes(k));
        const extraInEn = enKeys.filter((k) => !esKeys.includes(k));
        const extraInPt = ptKeys.filter((k) => !esKeys.includes(k));

        expect({ missingInEn, missingInPt, extraInEn, extraInPt }).toEqual({
            missingInEn: [],
            missingInPt: [],
            extraInEn: [],
            extraInPt: []
        });
    });
});
