import type { MonthlyReportSummary } from './reportsApi';

function csvEscape(value: unknown): string {
    const s = String(value ?? '');
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

function row(cells: unknown[]): string {
    return cells.map(csvEscape).join(',');
}

export function buildMonthlyReportCsv(
    summary: MonthlyReportSummary,
    meta: { login: string; exportedAt: string }
): string {
    const sections: string[] = [];

    sections.push(
        [
            '# RESUMEN',
            row(['metrica', 'valor']),
            row(['login', meta.login]),
            row(['yearMonth', summary.yearMonth]),
            row(['exportedAt', meta.exportedAt]),
            row(['timezone', summary.timezone]),
            row(['totalRequests', summary.totalRequests]),
            row(['totalErrors', summary.totalErrors]),
            row(['successRate', summary.successRate]),
            row(['avgLatencyMs', summary.avgLatencyMs]),
            row(['uniqueCommands', summary.uniqueCommands])
        ].join('\n')
    );

    if (summary.previous) {
        sections.push(
            [
                '# COMPARACION_MES_ANTERIOR',
                row(['metrica', 'valor']),
                row(['yearMonth', summary.previous.yearMonth]),
                row(['totalRequests', summary.previous.totalRequests]),
                row(['successRate', summary.previous.successRate]),
                row(['avgLatencyMs', summary.previous.avgLatencyMs]),
                row(['requestsDelta', summary.previous.requestsDelta])
            ].join('\n')
        );
    }

    const cmdRows = [
        '# COMANDOS',
        row(['comando', 'peticiones', 'errores', 'latencia_media_ms'])
    ];
    for (const cmd of summary.commands) {
        cmdRows.push(row([cmd.name, cmd.requests, cmd.errors, cmd.avgLatencyMs]));
    }
    sections.push(cmdRows.join('\n'));

    const dailyRows = ['# SERIE_DIARIA', row(['fecha', 'peticiones', 'errores'])];
    for (const day of summary.daily) {
        dailyRows.push(row([day.date, day.requests, day.errors]));
    }
    sections.push(dailyRows.join('\n'));

    const viewerRows = ['# TOP_VIEWERS', row(['usuario', 'usos', 'ultimo_visto'])];
    for (const v of summary.topViewers) {
        viewerRows.push(row([v.user_name, v.total, v.last_seen]));
    }
    sections.push(viewerRows.join('\n'));

    return sections.join('\n\n') + '\n';
}

export function buildMonthlyReportHtml(
    summary: MonthlyReportSummary,
    meta: { login: string; title: string; note: string; exportedAt: string }
): string {
    const cmdRows = summary.commands
        .map(
            (c) =>
                `<tr><td>${escape(c.name)}</td><td>${c.requests}</td><td>${c.errors}</td><td>${c.avgLatencyMs} ms</td></tr>`
        )
        .join('');
    const dailyRows = summary.daily
        .map(
            (d) =>
                `<tr><td>${escape(d.date)}</td><td>${d.requests}</td><td>${d.errors}</td></tr>`
        )
        .join('');
    const viewerRows = summary.topViewers
        .map(
            (v) =>
                `<tr><td>${escape(v.user_name)}</td><td>${v.total}</td></tr>`
        )
        .join('');

    const prev = summary.previous
        ? `<p>Mes anterior (${escape(summary.previous.yearMonth)}): ${summary.previous.totalRequests} requests (Δ ${summary.previous.requestsDelta}).</p>`
        : '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>${escape(meta.title)}</title>
<style>
body{font-family:system-ui,sans-serif;max-width:880px;margin:2rem auto;padding:0 1rem;color:#111}
h1{font-size:1.4rem} table{border-collapse:collapse;width:100%;margin:1rem 0}
th,td{border:1px solid #ddd;padding:.4rem .55rem;text-align:left;font-size:.9rem}
th{background:#f5f5f5} .muted{color:#666;font-size:.85rem}
</style>
</head>
<body>
<h1>${escape(meta.title)}</h1>
<p class="muted">@${escape(meta.login)} · ${escape(summary.yearMonth)} · ${escape(meta.exportedAt)}</p>
<p>${escape(meta.note)}</p>
<ul>
<li>Requests: <strong>${summary.totalRequests}</strong></li>
<li>Éxito: <strong>${summary.successRate}%</strong></li>
<li>Latencia media: <strong>${summary.avgLatencyMs} ms</strong></li>
<li>Comandos distintos: <strong>${summary.uniqueCommands}</strong></li>
</ul>
${prev}
<h2>Comandos</h2>
<table><thead><tr><th>Comando</th><th>Peticiones</th><th>Errores</th><th>Latencia</th></tr></thead><tbody>${cmdRows}</tbody></table>
<h2>Serie diaria</h2>
<table><thead><tr><th>Fecha</th><th>Peticiones</th><th>Errores</th></tr></thead><tbody>${dailyRows}</tbody></table>
<h2>Top viewers</h2>
<table><thead><tr><th>Usuario</th><th>Usos</th></tr></thead><tbody>${viewerRows}</tbody></table>
</body>
</html>`;
}

function escape(value: unknown): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function downloadTextFile(content: string, filename: string, mime: string): void {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
