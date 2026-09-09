/**
 * Backfill: cifrar API keys en plaintext → GCM + api_key_hash.
 *
 * Dry-run por defecto:
 *   pnpm exec tsx -r dotenv/config scripts/backfill-api-key-encryption.ts
 *
 * Aplicar:
 *   APPLY=1 pnpm exec tsx -r dotenv/config scripts/backfill-api-key-encryption.ts
 *
 * No regenera claves: Nightbot/SE siguen con el mismo UUID.
 */
import { supabase } from '../backend/src/core/database/supabaseClient';
import { isCbcFormat, isGcmFormat } from '../backend/src/core/database/cryptoService';
import {
    apiKeyLookupHash,
    decryptStoredApiKey,
    encryptApiKey
} from '../backend/src/core/utils/apiKeySecurity';

async function main() {
    const apply = process.env.APPLY === '1' || process.env.APPLY === 'true';
    const pageSize = Math.min(Number(process.env.PAGE_SIZE || 200), 500);

    let offset = 0;
    let scanned = 0;
    let needsWork = 0;
    let updated = 0;
    let errors = 0;

    console.log(apply ? 'APPLY=1 — escribiendo cambios' : 'Dry-run — no se escribe (APPLY=1 para aplicar)');

    while (true) {
        const { data, error } = await supabase
            .from('users')
            .select('user_id, login, api_key, api_key_hash')
            .order('user_id', { ascending: true })
            .range(offset, offset + pageSize - 1);

        if (error) {
            console.error(`Supabase: ${error.message}`);
            process.exit(1);
        }
        if (!data?.length) break;

        for (const row of data) {
            scanned += 1;
            const stored = row.api_key as string | null;
            if (!stored) continue;

            let plaintext: string;
            try {
                plaintext = decryptStoredApiKey(stored).plaintext;
            } catch (e) {
                errors += 1;
                console.error(`  ! ${row.login || row.user_id}: decrypt falló — ${(e as Error).message}`);
                continue;
            }

            const expectedHash = apiKeyLookupHash(plaintext);
            const alreadyGcm = isGcmFormat(stored);
            const hashOk = row.api_key_hash === expectedHash;
            const needsCbcUpgrade = isCbcFormat(stored);

            if (alreadyGcm && hashOk) continue;

            needsWork += 1;
            const action = needsCbcUpgrade
                ? 'cbc→gcm+hash'
                : alreadyGcm
                  ? 'rehash'
                  : 'plaintext→gcm+hash';
            console.log(`  ~ ${row.login || row.user_id}: ${action}${hashOk ? '' : ' (hash mismatch/null)'}`);

            if (!apply) continue;

            const { error: updErr } = await supabase
                .from('users')
                .update({
                    api_key: encryptApiKey(plaintext),
                    api_key_hash: expectedHash
                })
                .eq('user_id', row.user_id);

            if (updErr) {
                errors += 1;
                console.error(`  ! update ${row.user_id}: ${updErr.message}`);
            } else {
                updated += 1;
            }
        }

        if (data.length < pageSize) break;
        offset += pageSize;
    }

    console.log(JSON.stringify({ scanned, needsWork, updated, errors, applied: apply }, null, 2));

    if (errors) process.exit(1);
    if (!apply && needsWork > 0) {
        console.log(
            'Hay filas pendientes. Aplicar con: APPLY=1 pnpm exec tsx -r dotenv/config scripts/backfill-api-key-encryption.ts'
        );
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
