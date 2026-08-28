export interface ReportTemplateData {
    name: string;
    safeLogin: string;
    safeUserId: string;
    safeAvatarUrl: string;
    dateStr: string;
    timeStr: string;
    year: number;
    reportId: string;
    channelType: string;
    followerCount: string | number;
    createdAtStr: string;
    safeDescription: string;
    maskedKey: string;
    todayRequests: number;
    totalRequests: number;
    averageLatency: string;
    successRate: string;
    cmdTotal: number;
    toolTotal: number;
    gameTotal: number;
    rateLimit: number;
    commandRows: string;
    homeUrl: string;
    docsUrl: string;
    dashboardUrl: string;
    aboutUrl: string;
    logoUrl: string;
    faviconUrl: string;
    statusUrl: string;
    siteLabel: string;
    siteUrl: string;
    discordUrl: string;
    legalPrivacy: string;
    legalTerms: string;
    legalStorage: string;
    snapshotJson: string;
}

import type { Translations } from '@/core/i18n/locales/es';

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" aria-hidden="true"><path fill="#9146ff" d="M228 56c-62.4 8.1-115.3 46.4-143 103.5-13 26.8-18.3 50.5-18.3 81 0 32.9 5.9 59 19 84.7 30 58.9 86 97.2 150.3 102.7 14.4 1.3 32.2.2 48.4-2.9 72.1-14 130.1-70.2 145.6-141 3.4-15.8 4.5-26.4 4.4-44-.1-19.6-1.1-28.1-5.6-45.3q-12-47.1-46.2-82.5c-16.4-17-31.9-28.1-54-38.7-15.6-7.6-27-11.5-43.1-15.1-10.2-2.2-14.9-2.7-31.5-2.9-10.7-.2-22.4 0-26 .5m42.6 6.5c6 .8 11.8 1.7 12.9 1.9 1.1.3 5.1 1.2 8.9 2.1 27.4 6.5 58.2 23.5 79.3 43.8s34.8 40.4 44 64.1c7.5 19.5 11 35.5 12.2 55.2 2.8 47.5-11.3 91.5-40.7 127.7-11.3 13.9-29.9 29.8-46.7 39.9-9.5 5.7-24.4 13-25.4 12.3-.5-.3 0-3.1 1.1-6.3 1.8-4.7 2.3-9.2 2.9-25.2.8-20.5.2-28.3-3-39-6.5-22.3-8.2-26-16.3-38.2l-3.8-5.7 5.5-5.2c3-2.9 5.5-5.9 5.5-6.8-.1-.9-2.3-3.3-5.1-5.5-2.7-2.1-4.9-4.2-4.7-4.6.6-1.5 9.6-10.7 14.2-14.5 2.5-2 4.6-4.4 4.6-5.2 0-1.9-17.7-10.3-30.2-14.4-8.3-2.7-9.8-3.6-9.8-5.3 0-3.5 1.7-5 5.8-5.2 2.1-.1 6.3-1 9.3-1.9l5.5-1.7 5.9 3c14.7 7.3 32.5 6.9 43-1.1l4.8-3.7h18.6c16.2 0 19.1-.3 22.9-2 3.3-1.5 4.2-2.4 4.2-4.5 0-2.8-2.4-5.6-7.2-8.2-2.9-1.6-6.1-1.8-24.8-1.9-11.8-.1-23.3-.2-25.5-.3-3.4-.1-5.7-1.4-14.5-8-13-9.8-14.5-11.4-17.2-18.2-2.3-5.8-2.8-15.7-.7-16.9.6-.4 3.8-1 7.2-1.3 7.1-.7 18.1-3.9 21.5-6.2 2.8-2 2.8-4.8.1-7.4-1.9-1.7-13.5-5-23-6.6l-3.5-.5-1.2-8.6c-1.6-10.9-4.5-18.7-8.9-23.5-5.5-6.1-8.7-6.6-22.3-3.5-6.3 1.4-13 2.6-14.8 2.6s-7.8-1.4-13.4-3c-11.4-3.4-16.5-3.7-21.4-1.4-5 2.4-10.9 9.6-15.2 18.4l-3.7 7.7h-14c-7.7 0-15.9.6-18.2 1.2-5.3 1.4-6.5 4.2-3.3 7.6 3 3.2 16.5 9.7 27 12.9 4.6 1.5 9 3.2 9.8 3.9 1.9 1.6 1 7.8-2.4 15.6-2.3 5.2-2.5 6.7-1.6 8.2 1 1.5.8 3.6-.9 10.1-1.6 6.1-2 9.7-1.5 14.2.8 7.8-.7 13.4-3.7 14-2.6.6-4.9.8-38.1 4.6-14.3 1.7-26.1 3.2-26.4 3.5-.8.7 7.8 4.3 13.9 5.7 3.6.9 13.3 1.3 28.7 1.3 22.7 0 23.3 0 23 2-.2 1.6-1.5 2.2-6.1 3.1-7.8 1.6-11.5 3.3-13 5.8-.6 1.2-1.4 9-1.8 17.6-.8 17.3-2.2 24-6.5 30.2-5.3 7.6-8.8 10.4-18.5 14.3-8.4 3.3-59.5 21.5-60.6 21.5-.6 0-6.1-12.5-9.4-21.5-10.5-28.5-13.8-62.4-9-93 5.9-37.6 21.7-69.2 49.1-97.9 37.2-38.9 94.3-59.2 146.6-52.1"/></svg>`;

const LOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;

export function buildReportHtml(d: ReportTemplateData, t: Translations): string {
    const e = t.exporter;
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${e.reportBadge} de ${d.name} — LosPerris Twitch API">
    <title>${d.name} · Reporte · LosPerris</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Inter:ital,opsz,wght@0,14..32,300;0,14..32,400;0,14..32,500;0,14..32,600;1,14..32,400&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
            --bg:          #08080b;
            --surface:     #0f0f12;
            --surface-hi:  #141418;
            --border:      #1f1f24;
            --border-hi:   #2a2a32;
            --fg:          #ffffff;
            --fg-soft:     #e4e4e7;
            --muted:       #71717a;
            --dim:         #3f3f46;
            --p:           #a855f7;
            --p-lo:        rgba(168,85,247,.10);
            --p-mid:       rgba(168,85,247,.22);
            --green:       #34d399;
            --amber:       #fbbf24;
            --mono:        'JetBrains Mono', monospace;
        }

        html { scroll-behavior: smooth; }
        body {
            font-family: 'Inter', system-ui, sans-serif;
            background: var(--bg);
            color: var(--fg);
            min-height: 100vh;
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
        }
        a { color: inherit; text-decoration: none; }

        /* ── Layout ─────────────────────────────────────── */
        .page { max-width: 900px; margin: 0 auto; padding: 0 1.5rem 5rem; }

        /* ── Top bar ────────────────────────────────────── */
        .topbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.25rem 0;
            border-bottom: 1px solid var(--border);
            margin-bottom: 3rem;
        }
        .brand {
            display: flex; align-items: center; gap: 0.55rem;
            font-size: 0.9rem; font-weight: 600; color: var(--fg-soft);
            letter-spacing: -0.01em;
        }
        .brand-logo { width: 20px; height: 20px; flex-shrink: 0; }
        .topbar-right { text-align: right; }
        .topbar-id {
            font-family: var(--mono);
            font-size: 0.68rem;
            color: var(--dim);
            margin-bottom: 0.15rem;
        }
        .topbar-date { font-size: 0.78rem; color: var(--muted); }

        /* ── Hero ───────────────────────────────────────── */
        .hero {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            align-items: start;
            margin-bottom: 2.5rem;
        }
        .hero-left {}
        .hero-eyebrow {
            font-size: 0.68rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: var(--p);
            margin-bottom: 0.75rem;
        }
        .hero-title {
            font-size: 2rem;
            font-weight: 600;
            letter-spacing: -0.035em;
            color: var(--fg);
            line-height: 1.15;
            margin-bottom: 1.5rem;
        }
        .profile-card {
            display: flex;
            align-items: center;
            gap: 1rem;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 1rem 1.25rem;
        }
        .avatar {
            width: 48px; height: 48px;
            border-radius: 8px;
            object-fit: cover;
            border: 1px solid var(--border-hi);
            flex-shrink: 0;
        }
        .avatar-ph {
            width: 48px; height: 48px;
            border-radius: 8px;
            background: var(--surface-hi);
            border: 1px solid var(--border);
            display: flex; align-items: center; justify-content: center;
            font-size: 1.4rem; flex-shrink: 0;
        }
        .profile-info {}
        .profile-name {
            font-size: 1rem; font-weight: 600;
            letter-spacing: -0.02em;
            color: var(--fg);
            margin-bottom: 0.2rem;
        }
        .profile-meta {
            font-size: 0.78rem; color: var(--muted);
            display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;
        }
        .meta-sep { color: var(--dim); }
        .meta-type {
            color: var(--p);
            font-weight: 500;
            background: var(--p-lo);
            padding: 0.1rem 0.45rem;
            border-radius: 4px;
            font-size: 0.72rem;
        }

        /* ── Stats grid (right column of hero) ─────────── */
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
        }
        .stat-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 1rem 1.25rem;
        }
        .stat-card.accent { border-color: var(--p-mid); }
        .stat-label {
            font-size: 0.65rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.09em;
            color: var(--muted);
            margin-bottom: 0.4rem;
        }
        .stat-value {
            font-size: 1.8rem;
            font-weight: 300;
            letter-spacing: -0.04em;
            line-height: 1;
            color: var(--fg);
        }
        .stat-value.c-p     { color: var(--p); }
        .stat-value.c-g     { color: var(--green); }
        .stat-sub {
            font-size: 0.7rem; color: var(--dim);
            margin-top: 0.3rem;
        }

        /* ── Warning ────────────────────────────────────── */
        .warning {
            display: flex; gap: 0.9rem; align-items: flex-start;
            background: rgba(251,191,36,.04);
            border: 1px solid rgba(251,191,36,.18);
            border-radius: 8px;
            padding: 0.9rem 1.2rem;
            margin-bottom: 2.5rem;
        }
        .warning-icon {
            flex-shrink: 0; width: 15px; height: 15px;
            margin-top: 2px; color: var(--amber);
        }
        .warning-title { font-size: 0.76rem; font-weight: 600; color: var(--amber); margin-bottom: 0.2rem; }
        .warning-body { font-size: 0.74rem; color: #92400e; line-height: 1.5; }

        /* ── Section ────────────────────────────────────── */
        .section { margin-bottom: 3rem; }
        .section-header {
            display: flex; align-items: center; gap: 0.6rem;
            margin-bottom: 1rem;
        }
        .section-label {
            font-size: 0.65rem; font-weight: 600;
            text-transform: uppercase; letter-spacing: 0.1em;
            color: var(--muted);
        }
        .section-line {
            flex: 1; height: 1px;
            background: var(--border);
        }

        /* ── Detail cards ───────────────────────────────── */
        .detail-cols {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }
        .detail-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 10px;
            overflow: hidden;
        }
        .detail-card-title {
            font-size: 0.72rem; font-weight: 600;
            text-transform: uppercase; letter-spacing: 0.08em;
            color: var(--muted);
            padding: 0.9rem 1.2rem 0.6rem;
            border-bottom: 1px solid var(--border);
        }
        .detail-row {
            display: flex; justify-content: space-between; align-items: center;
            padding: 0.65rem 1.2rem;
            border-bottom: 1px solid var(--border);
            font-size: 0.84rem;
        }
        .detail-row:last-child { border-bottom: none; }
        .detail-key { color: var(--muted); }
        .detail-val { font-weight: 500; color: var(--fg-soft); text-align: right; }
        .detail-val.mono { font-family: var(--mono); font-size: 0.76rem; }
        .detail-val.c-g  { color: var(--green); }
        .detail-val.c-p  { color: var(--p); }

        /* ── Commands ───────────────────────────────────── */
        .cmd-list { display: flex; flex-direction: column; gap: 0; }
        .cmd-item {
            border: 1px solid var(--border);
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 0.75rem;
        }
        .cmd-header {
            display: flex; justify-content: space-between; align-items: center;
            padding: 0.9rem 1.2rem;
            background: var(--surface);
            cursor: default;
        }
        .cmd-header-left {}
        .cmd-name {
            font-size: 0.92rem; font-weight: 500;
            color: #ffffff; margin-bottom: 0.15rem;
        }
        .cmd-desc { font-size: 0.78rem; color: var(--muted); }
        .cmd-count {
            font-size: 0.82rem; font-weight: 600;
            color: var(--p); white-space: nowrap;
            background: var(--p-lo);
            padding: 0.2rem 0.6rem;
            border-radius: 6px;
            margin-left: 1rem;
        }
        .cmd-variants { padding: 0 1.2rem 1rem; background: var(--surface); }
        .variant-block { padding-top: 0.75rem; }
        .variant-name {
            font-size: 0.75rem; font-weight: 500;
            color: #71717a; margin-bottom: 0.35rem;
        }
        .code-block {
            background: #0a0a0e;
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 0.75rem 1rem;
            font-family: var(--mono);
            font-size: 0.68rem;
            color: #71717a;
            white-space: pre-wrap;
            word-break: break-all;
            line-height: 1.6;
        }
        .code-comment { color: #3f3f46; }

        /* ── Dashboard tools ────────────────────────────── */
        .dash-tools {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 10px;
            overflow: hidden;
            margin-top: 1.5rem;
        }
        .dash-tools-title {
            font-size: 0.65rem; font-weight: 600;
            text-transform: uppercase; letter-spacing: 0.09em;
            color: var(--muted);
            padding: 0.8rem 1.2rem;
            border-bottom: 1px solid var(--border);
            background: var(--surface-hi);
        }
        .dash-tool-row {
            display: flex; justify-content: space-between; align-items: center;
            padding: 0.65rem 1.2rem;
            border-bottom: 1px solid var(--border);
            font-size: 0.84rem;
        }
        .dash-tool-row:last-child { border-bottom: none; }
        .dash-tool-name { font-weight: 500; color: var(--fg-soft); }
        .dash-tool-desc { font-size: 0.74rem; color: var(--muted); margin-top: 0.1rem; }
        .dash-tool-count { font-size: 0.82rem; font-weight: 600; color: var(--p); white-space: nowrap; margin-left: 1.5rem; }

        /* ── Footer ─────────────────────────────────────── */
        .footer {
            border-top: 1px solid var(--border);
            padding-top: 1.75rem;
            display: flex; justify-content: space-between; align-items: center;
            font-size: 0.74rem; color: var(--dim);
        }
        .footer-brand { display: flex; align-items: center; gap: 0.4rem; }
        .footer-logo { width: 13px; height: 13px; }
        .footer-links { display: flex; gap: 1.25rem; }
        .footer-links a:hover { color: var(--muted); }

        /* ── Tag ────────────────────────────────────────── */
        .tag-post {
            font-size: 0.6rem; padding: 0.1rem 0.35rem;
            background: rgba(251,191,36,.1); color: #fbbf24;
            border-radius: 3px; margin-left: 0.4rem;
            vertical-align: middle; font-weight: 600;
        }

        /* ── Responsive ─────────────────────────────────── */
        @media (max-width: 640px) {
            .hero { grid-template-columns: 1fr; }
            .detail-cols { grid-template-columns: 1fr; }
            .stats-grid { grid-template-columns: 1fr 1fr; }
            .topbar { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
            .topbar-right { text-align: left; }
            .footer { flex-direction: column; gap: 1rem; align-items: flex-start; }
        }
        @media print {
            body { background: #fff; color: #000; }
            .warning { display: none; }
            .stat-card, .detail-card, .cmd-item, .dash-tools {
                border-color: #ddd; background: #f9f9f9;
            }
            :root {
                --fg: #000; --fg-soft: #111; --muted: #555;
                --dim: #888; --border: #ddd; --surface: #f9f9f9;
            }
        }
    </style>
</head>
<body>
<div class="page">

    <!-- ── Top bar ── -->
    <nav class="topbar">
        <a href="${d.homeUrl}" class="brand">
            <span class="brand-logo">${LOGO_SVG}</span>
            LosPerris API
        </a>
        <div class="topbar-right">
            <div class="topbar-id">ID ${d.reportId}</div>
            <div class="topbar-date">${d.dateStr} · ${d.timeStr}</div>
        </div>
    </nav>

    <!-- ── Hero ── -->
    <div class="hero">
        <div class="hero-left">
            <div class="hero-eyebrow">${e.reportBadge}</div>
            <h1 class="hero-title">${d.name}</h1>
            <div class="profile-card">
                ${d.safeAvatarUrl
                    ? `<img src="${d.safeAvatarUrl}" alt="" class="avatar">`
                    : `<div class="avatar-ph" aria-hidden="true">👤</div>`}
                <div class="profile-info">
                    <div class="profile-name">@${d.safeLogin}</div>
                    <div class="profile-meta">
                        <span>UID ${d.safeUserId}</span>
                        <span class="meta-sep">·</span>
                        <span class="meta-type">${d.channelType}</span>
                        <span class="meta-sep">·</span>
                        <span>desde ${d.createdAtStr}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">${e.today}</div>
                <div class="stat-value">${d.todayRequests.toLocaleString()}</div>
                <div class="stat-sub">peticiones hoy</div>
            </div>
            <div class="stat-card accent">
                <div class="stat-label">${e.total}</div>
                <div class="stat-value c-p">${(d.totalRequests as number).toLocaleString()}</div>
                <div class="stat-sub">historial total</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">${e.success}</div>
                <div class="stat-value c-g">${d.successRate}</div>
                <div class="stat-sub">tasa de éxito</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">${e.followers}</div>
                <div class="stat-value">${d.followerCount}</div>
                <div class="stat-sub">seguidores</div>
            </div>
        </div>
    </div>

    <!-- ── Warning ── -->
    <div class="warning" role="alert">
        <svg class="warning-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <div>
            <div class="warning-title">Archivo privado — no compartir</div>
            <div class="warning-body">Contiene credenciales de tu cuenta y datos de actividad de canal.</div>
        </div>
    </div>

    <!-- ── Información de cuenta ── -->
    <div class="section">
        <div class="section-header">
            <span class="section-label">Cuenta y Seguridad</span>
            <div class="section-line"></div>
        </div>
        <div class="detail-cols">
            <div class="detail-card">
                <div class="detail-card-title">Información</div>
                <div class="detail-row"><span class="detail-key">${e.name}</span><span class="detail-val">${d.name}</span></div>
                <div class="detail-row"><span class="detail-key">${e.login}</span><span class="detail-val">@${d.safeLogin}</span></div>
                <div class="detail-row"><span class="detail-key">${e.memberSince}</span><span class="detail-val">${d.createdAtStr}</span></div>
                <div class="detail-row"><span class="detail-key">Plan</span><span class="detail-val">Estándar</span></div>
                <div class="detail-row"><span class="detail-key">Acceso</span><span class="detail-val">Full API</span></div>
            </div>
            <div class="detail-card">
                <div class="detail-card-title">Seguridad y Uso</div>
                <div class="detail-row"><span class="detail-key">API Key</span><span class="detail-val mono">${d.maskedKey}</span></div>
                <div class="detail-row"><span class="detail-key">Estado</span><span class="detail-val c-g">Activa</span></div>
                <div class="detail-row"><span class="detail-key">Límite de tasa</span><span class="detail-val">${d.rateLimit} req/min</span></div>
                <div class="detail-row"><span class="detail-key">Latencia media</span><span class="detail-val">${d.averageLatency}</span></div>
                <div class="detail-row"><span class="detail-key">Tasa de éxito</span><span class="detail-val c-p">${d.successRate}</span></div>
            </div>
        </div>
    </div>

    <!-- ── Integraciones ── -->
    <div class="section">
        <div class="section-header">
            <span class="section-label">Registro de Integraciones</span>
            <div class="section-line"></div>
        </div>
        <div class="cmd-list">
            ${d.commandRows || '<p style="font-size:0.875rem;color:#52525b;">No hay registros disponibles.</p>'}
        </div>
    </div>

    <!-- ── Footer ── -->
    <footer class="footer">
        <div class="footer-brand">
            <span class="footer-logo">${LOGO_SVG}</span>
            © ${d.year} ${d.siteLabel}
        </div>
        <div class="footer-links">
            <a href="${d.dashboardUrl}">Dashboard</a>
            <a href="${d.docsUrl}">Docs</a>
            <a href="${d.legalPrivacy}">Privacidad</a>
        </div>
    </footer>

</div>
<script type="application/json" id="losperris-data-snapshot">${d.snapshotJson}</script>
</body>
</html>`;
}