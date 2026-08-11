import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const directory = path.join(root, 'supabase', 'migrations');

if (!fs.existsSync(directory)) {
    console.log('supabase/migrations ausente (local-only / gitignored); nada que verificar.');
    process.exit(0);
}

const migrations = fs.readdirSync(directory)
    .filter((name) => name.endsWith('.sql'))
    .sort();
const failures = [];
const timestamps = new Set();

for (const name of migrations) {
    const match = name.match(/^(\d{14})_[a-z0-9_]+\.sql$/);
    if (!match) {
        failures.push(`${name}: nombre inválido`);
        continue;
    }
    if (timestamps.has(match[1])) failures.push(`${name}: timestamp duplicado`);
    timestamps.add(match[1]);

    const sql = fs.readFileSync(path.join(directory, name), 'utf8');
    if (!sql.trim().endsWith(';')) failures.push(`${name}: debe terminar en punto y coma`);
    if (/realtime_users_bot/i.test(sql)) failures.push(`${name}: incluye el script obsoleto realtime_users_bot`);
}

const readmePath = path.join(directory, 'README.md');
if (fs.existsSync(readmePath)) {
    const readme = fs.readFileSync(readmePath, 'utf8');
    for (const conflict of [
        'bot_get_user_rate_limit.sql',
        'discord_link_events_session.sql',
        'realtime_users_bot.sql',
        'rls_policies.sql',
        'realtime_rls_select_own.sql'
    ]) {
        if (!readme.includes(conflict)) failures.push(`README no documenta ${conflict}`);
    }
}

if (migrations.length && !migrations[0]?.includes('preflight')) {
    failures.push('la primera migración debe ser preflight');
}
if (failures.length) {
    console.error(failures.map((failure) => `- ${failure}`).join('\n'));
    process.exit(1);
}

console.log(`${migrations.length} migraciones locales ordenadas y documentadas.`);
