import type { AnalyticsData } from './exporterData';

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
}

/** Genera el HTML completo del reporte de exportacion. */
export function buildReportHtml(d: ReportTemplateData): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Reporte de cuenta de ${d.name} — LosPerris Twitch API">
    <title>${d.name} · Reporte · LosPerris Twitch API</title>
    <link rel="icon" href="${d.faviconUrl}" type="image/svg+xml">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --bg: #080808; --surface: #0a0a0b; --surface-2: #111113; --surface-3: #18181b;
            --border: rgba(255,255,255,0.08); --border-strong: rgba(255,255,255,0.12);
            --primary: #9146ff; --primary-hover: #7c3aed; --accent: #a78bfa;
            --text: #fafafa; --text-muted: #c4c4cc; --text-dim: #71717a; --text-footer: #a1a1aa;
            --success: #10b981; --success-bg: rgba(16,185,129,0.1);
            --warning: #f59e0b; --warning-bg: rgba(245,158,11,0.08);
            --info: #3b82f6; --info-bg: rgba(59,130,246,0.1);
            --radius: 12px; --radius-lg: 16px;
        }
        html { scroll-behavior: smooth; }
        body { font-family: 'Outfit', system-ui, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; line-height: 1.6; -webkit-font-smoothing: antialiased; }
        .page { position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column; }
        a { color: inherit; }
        .site-header { position: sticky; top: 0; z-index: 100; border-bottom: 1px solid var(--border); background: rgba(8,8,8,0.92); backdrop-filter: blur(16px); }
        .site-header-inner { max-width: 1100px; margin: 0 auto; padding: 0.85rem 1.25rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .brand { display: inline-flex; align-items: center; gap: 0.75rem; text-decoration: none; color: var(--text); }
        .brand img { width: 40px; height: 40px; object-fit: contain; }
        .brand-text { font-size: 1.1rem; font-weight: 800; letter-spacing: -0.02em; }
        .brand-accent { color: var(--primary); }
        .site-nav { display: flex; flex-wrap: wrap; gap: 0.35rem; }
        .nav-link { display: inline-flex; align-items: center; padding: 0.45rem 0.85rem; border-radius: 8px; font-size: 0.82rem; font-weight: 500; color: var(--text-muted); text-decoration: none; transition: background 0.15s, color 0.15s; }
        .nav-link:hover { background: rgba(255,255,255,0.05); color: var(--text); }
        .nav-link-primary { background: var(--primary); color: #fff; font-weight: 600; }
        .nav-link-primary:hover { background: var(--primary-hover); color: #fff; }
        .main { flex: 1; max-width: 1100px; width: 100%; margin: 0 auto; padding: 2rem 1.25rem 3rem; }
        .report-intro { text-align: center; margin-bottom: 2rem; }
        .report-badge { display: inline-flex; align-items: center; gap: 0.35rem; margin-bottom: 1rem; padding: 0.35rem 0.85rem; border-radius: 999px; border: 1px solid rgba(145,70,255,0.25); background: rgba(145,70,255,0.08); font-size: 0.68rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); }
        .report-title { font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.15; margin-bottom: 0.5rem; }
        .gradient-text { color: var(--primary); }
        .report-subtitle { color: var(--text-muted); font-size: 0.95rem; max-width: 36rem; margin: 0 auto; }
        .profile-hero { display: flex; align-items: center; gap: 1.25rem; padding: 1.5rem; margin-bottom: 1.25rem; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); flex-wrap: wrap; position: relative; overflow: hidden; }
        .avatar { width: 80px; height: 80px; border-radius: 16px; border: 2px solid var(--border-strong); object-fit: cover; flex-shrink: 0; }
        .avatar-placeholder { width: 80px; height: 80px; border-radius: 16px; background: var(--surface-3); border: 2px solid var(--border-strong); display: flex; align-items: center; justify-content: center; font-size: 2rem; flex-shrink: 0; }
        .profile-main { flex: 1; min-width: 200px; }
        .profile-name { font-size: 1.65rem; font-weight: 800; letter-spacing: -0.02em; }
        .profile-login { color: var(--text-muted); font-size: 0.9rem; margin-top: 0.1rem; }
        .chips { display: flex; flex-wrap: wrap; gap: 0.45rem; margin-top: 0.75rem; }
        .chip { display: inline-flex; align-items: center; padding: 0.22rem 0.65rem; border-radius: 999px; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.02em; }
        .chip-purple { background: rgba(145,70,255,0.1); color: var(--accent); border: 1px solid rgba(145,70,255,0.22); }
        .chip-green { background: var(--success-bg); color: var(--success); border: 1px solid rgba(16,185,129,0.22); }
        .chip-blue { background: var(--info-bg); color: var(--info); border: 1px solid rgba(59,130,246,0.22); }
        .profile-meta { text-align: right; flex-shrink: 0; }
        .meta-id { font-family: 'JetBrains Mono', monospace; font-size: 0.62rem; color: var(--text-dim); letter-spacing: 0.04em; }
        .meta-date { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem; }
        .security-banner { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem 1.15rem; margin-bottom: 1.25rem; border: 1px solid rgba(245,158,11,0.28); border-radius: var(--radius); background: var(--warning-bg); }
        .security-banner .sb-icon { font-size: 1.15rem; flex-shrink: 0; }
        .security-banner .sb-text { font-size: 0.8rem; color: #fbbf24; line-height: 1.5; }
        .security-banner .sb-text strong { color: #fcd34d; }
        .quick-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-bottom: 1.25rem; }
        .stat-card { padding: 1rem 0.75rem; text-align: center; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); transition: border-color 0.15s; }
        .stat-card:hover { border-color: rgba(145,70,255,0.35); }
        .stat-val { font-size: 1.45rem; font-weight: 800; color: var(--accent); line-height: 1; margin-bottom: 0.3rem; }
        .stat-lbl { font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }
        .section { border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); overflow: hidden; margin-bottom: 1.1rem; }
        .section-head { display: flex; align-items: center; gap: 0.65rem; padding: 0.9rem 1.35rem; border-bottom: 1px solid var(--border); background: var(--surface-2); }
        .section-kicker { display: inline-block; margin-bottom: 0.35rem; padding: 0.2rem 0.55rem; border-radius: 6px; border: 1px solid rgba(145,70,255,0.2); background: rgba(145,70,255,0.1); font-size: 0.62rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); }
        .section-icon { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: rgba(145,70,255,0.1); border: 1px solid rgba(145,70,255,0.18); font-size: 0.85rem; }
        .section-title { font-size: 0.95rem; font-weight: 700; color: var(--text); }
        .section-body { padding: 1.15rem 1.35rem; }
        .row { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0.55rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .row:last-child { border-bottom: none; }
        .row-label { color: var(--text-muted); font-size: 0.84rem; font-weight: 500; }
        .row-value { color: var(--text); font-size: 0.84rem; font-weight: 600; text-align: right; max-width: 58%; word-break: break-word; }
        .badge { display: inline-block; padding: 0.2rem 0.55rem; border-radius: 6px; font-size: 0.72rem; font-weight: 700; background: rgba(145,70,255,0.1); color: var(--accent); border: 1px solid rgba(145,70,255,0.22); }
        .badge-green { background: var(--success-bg); color: var(--success); border-color: rgba(16,185,129,0.25); }
        .masked { font-family: 'JetBrains Mono', monospace; letter-spacing: 0.06em; color: var(--text-muted); font-size: 0.8rem; }
        .metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .metric-card { padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface-2); }
        .metric-val { font-size: 1.35rem; font-weight: 800; margin-bottom: 0.2rem; }
        .metric-lbl { font-size: 0.72rem; color: var(--text-muted); }
        .mv-purple { color: var(--accent); } .mv-green { color: var(--success); } .mv-yellow { color: var(--warning); } .mv-blue { color: var(--info); }
        .cat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-top: 0.85rem; }
        .cat-card { padding: 0.9rem; text-align: center; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface-2); }
        .cat-card:hover { border-color: rgba(145,70,255,0.3); }
        .cat-icon { font-size: 1.15rem; margin-bottom: 0.35rem; }
        .cat-val { font-size: 1.15rem; font-weight: 800; color: var(--accent); margin-bottom: 0.15rem; }
        .cat-lbl { font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.07em; font-weight: 600; }
        .commands-container { display: flex; flex-direction: column; gap: 0.85rem; }
        .command-card { border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface-2); overflow: hidden; }
        .command-card:hover { border-color: rgba(145,70,255,0.28); }
        .cmd-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 1rem 1.15rem; border-bottom: 1px solid var(--border); }
        .cmd-title h3 { font-size: 0.95rem; font-weight: 700; margin-bottom: 0.15rem; }
        .cmd-title p { font-size: 0.75rem; color: var(--text-muted); }
        .cmd-stat { text-align: right; flex-shrink: 0; }
        .cmd-stat .s-val { font-size: 1.25rem; font-weight: 800; color: var(--accent); line-height: 1; }
        .cmd-stat .s-lbl { font-size: 0.58rem; color: var(--text-dim); letter-spacing: 0.08em; text-transform: uppercase; margin-top: 0.15rem; }
        .cmd-variants { padding: 0.85rem; display: flex; flex-direction: column; gap: 0.7rem; }
        .variant-box { padding: 0.8rem; border: 1px solid var(--border); border-radius: 10px; background: #0d0d0f; }
        .v-name { font-size: 0.82rem; font-weight: 700; display: block; }
        .v-desc { font-size: 0.72rem; color: var(--text-muted); margin-top: 0.15rem; }
        .bot-syntax-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.65rem; }
        .bot-name { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); margin-bottom: 0.25rem; }
        .code-block { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; line-height: 1.45; padding: 0.65rem 0.8rem; border-radius: 8px; border: 1px solid var(--border); background: #111; color: #c4b5fd; word-break: break-all; white-space: pre-wrap; user-select: all; }
        .cmd-tag { display: inline-block; margin-left: 0.35rem; padding: 0.12rem 0.4rem; border-radius: 4px; font-size: 0.58rem; font-weight: 700; letter-spacing: 0.06em; vertical-align: middle; }
        .tag-post { background: rgba(245,158,11,0.12); color: var(--warning); }
        .tag-dash { background: var(--info-bg); color: var(--info); }
        .dashboard-only-badge { display: inline-flex; margin-top: 0.5rem; padding: 0.28rem 0.6rem; border-radius: 6px; font-size: 0.65rem; font-weight: 600; color: var(--info); background: var(--info-bg); border: 1px solid rgba(59,130,246,0.22); }
        .cta-strip { display: flex; flex-wrap: wrap; gap: 0.65rem; justify-content: center; margin-top: 1.5rem; padding: 1.25rem; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); }
        .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.65rem 1.25rem; border-radius: 8px; font-size: 0.88rem; font-weight: 600; text-decoration: none; transition: background 0.15s, border-color 0.15s, color 0.15s; }
        .btn-primary { background: var(--primary); color: #fff; }
        .btn-primary:hover { background: var(--primary-hover); }
        .btn-ghost { border: 1px solid var(--border-strong); color: var(--text-muted); background: transparent; }
        .btn-ghost:hover { border-color: rgba(255,255,255,0.22); color: var(--text); }
        .site-footer { margin-top: auto; border-top: 1px solid var(--border); background: #09090b; padding: 2rem 1.25rem; }
        .footer-inner { max-width: 1100px; margin: 0 auto; text-align: center; }
        .footer-brand-row { display: flex; align-items: center; justify-content: center; gap: 0.65rem; margin-bottom: 1rem; }
        .footer-brand-row img { width: 28px; height: 28px; }
        .footer-brand-name { font-size: 0.95rem; font-weight: 700; color: var(--text-muted); }
        .footer-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem 1.25rem; margin-bottom: 1rem; font-size: 0.8rem; }
        .footer-links a { color: var(--text-footer); text-decoration: underline; text-underline-offset: 2px; transition: color 0.15s; }
        .footer-links a:hover { color: var(--text); }
        .footer-legal { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem 1rem; margin-bottom: 0.85rem; font-size: 0.78rem; }
        .footer-legal a { color: var(--text-footer); text-decoration: underline; text-underline-offset: 2px; }
        .footer-legal a:hover { color: #fff; }
        .footer-copy { font-size: 0.82rem; color: var(--text-footer); line-height: 1.6; }
        .footer-copy a { color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }
        .footer-copy a:hover { color: var(--primary); }
        @media (max-width: 720px) {
            .quick-stats { grid-template-columns: 1fr 1fr; }
            .bot-syntax-grid, .metrics-grid { grid-template-columns: 1fr; }
            .cat-grid { grid-template-columns: 1fr; }
            .profile-hero { flex-direction: column; text-align: center; }
            .profile-meta { text-align: center; }
            .chips { justify-content: center; }
            .site-header-inner { justify-content: center; }
            .site-nav { justify-content: center; }
            .cmd-header { flex-direction: column; align-items: flex-start; }
            .cmd-stat { text-align: left; }
        }
        @media print {
            .site-header, .security-banner, .cta-strip, .site-footer .footer-links,
            .bot-syntax-grid, .cmd-variants, .nav-link, .dashboard-only-badge { display: none !important; }
            body { background: #fff; color: #111; }
            .section, .stat-card, .profile-hero, .metric-card, .cat-card, .command-card { background: #fff; border-color: #ddd; break-inside: avoid; }
            .gradient-text, .stat-val, .cat-val, .metric-val, .cmd-stat .s-val { color: #111 !important; -webkit-text-fill-color: #111; }
            .main { padding: 0.5rem; max-width: 100%; }
        }
    </style>
</head>
<body>
<div class="page">
    <header class="site-header">
        <div class="site-header-inner">
            <a class="brand" href="${d.homeUrl}">
                <img src="${d.logoUrl}" alt="LosPerris">
                <span class="brand-text">LosPerris <span class="brand-accent">Twitch Api</span></span>
            </a>
            <nav class="site-nav" aria-label="Navegacion del sitio">
                <a class="nav-link" href="${d.homeUrl}">Inicio</a>
                <a class="nav-link" href="${d.docsUrl}">Documentacion</a>
                <a class="nav-link" href="${d.aboutUrl}">Sobre la API</a>
                <a class="nav-link nav-link-primary" href="${d.dashboardUrl}">Dashboard</a>
            </nav>
        </div>
    </header>

    <main class="main">
        <section class="report-intro">
            <div class="report-badge">Reporte de cuenta</div>
            <h1 class="report-title">Tu panel en <span class="gradient-text">un archivo</span></h1>
            <p class="report-subtitle">
                Resumen exportado desde LosPerris Twitch API. Misma identidad visual que
                <a href="${d.homeUrl}" style="color:var(--accent);text-decoration:underline;text-underline-offset:2px">la pagina principal</a>.
            </p>
        </section>

        <section class="profile-hero" aria-label="Perfil del streamer">
            ${d.safeAvatarUrl
                ? `<img src="${d.safeAvatarUrl}" alt="" class="avatar">`
                : `<div class="avatar-placeholder" aria-hidden="true">👤</div>`}
            <div class="profile-main">
                <div class="profile-name">${d.name}</div>
                <div class="profile-login">@${d.safeLogin}</div>
                <div class="chips">
                    <span class="chip chip-purple">${d.channelType}</span>
                    <span class="chip chip-green">API activa</span>
                    <span class="chip chip-blue">LosPerris API</span>
                </div>
            </div>
            <div class="profile-meta">
                <div class="meta-id">ID: ${d.reportId}</div>
                <div class="meta-date">${d.dateStr}</div>
                <div class="meta-date">${d.timeStr}</div>
            </div>
        </section>

        <div class="security-banner" role="alert">
            <span class="sb-icon" aria-hidden="true">⚠</span>
            <p class="sb-text">
                <strong>Este archivo incluye tu API Key en los bloques de comandos.</strong>
                No lo compartas en publico ni lo subas a redes, streams o repos.
            </p>
        </div>

        <div class="quick-stats" aria-label="Resumen rapido">
            <div class="stat-card"><div class="stat-val">${d.followerCount}</div><div class="stat-lbl">Seguidores</div></div>
            <div class="stat-card"><div class="stat-val">${d.todayRequests.toLocaleString()}</div><div class="stat-lbl">Hoy</div></div>
            <div class="stat-card"><div class="stat-val">${(d.totalRequests as number).toLocaleString()}</div><div class="stat-lbl">Total</div></div>
            <div class="stat-card"><div class="stat-val">${d.successRate}</div><div class="stat-lbl">Exito</div></div>
        </div>

        <section class="section">
            <div class="section-head">
                <div class="section-icon" aria-hidden="true">👤</div>
                <div><div class="section-kicker">Perfil</div><h2 class="section-title">Informacion de cuenta</h2></div>
            </div>
            <div class="section-body">
                <div class="row"><span class="row-label">Nombre</span><span class="row-value">${d.name}</span></div>
                <div class="row"><span class="row-label">Login</span><span class="row-value">@${d.safeLogin}</span></div>
                <div class="row"><span class="row-label">ID de usuario</span><span class="row-value">${d.safeUserId}</span></div>
                <div class="row"><span class="row-label">Tipo de canal</span><span class="row-value"><span class="badge">${d.channelType}</span></span></div>
                <div class="row"><span class="row-label">Miembro desde</span><span class="row-value">${d.createdAtStr}</span></div>
                <div class="row"><span class="row-label">Biografia</span><span class="row-value">${d.safeDescription}</span></div>
            </div>
        </section>

        <section class="section">
            <div class="section-head">
                <div class="section-icon" aria-hidden="true">🔐</div>
                <div><div class="section-kicker">Acceso</div><h2 class="section-title">Seguridad y API Key</h2></div>
            </div>
            <div class="section-body">
                <div class="row"><span class="row-label">API Key</span><span class="row-value masked">${d.maskedKey}</span></div>
                <div class="row"><span class="row-label">Estado</span><span class="row-value"><span class="badge badge-green">Activa</span></span></div>
                <div class="row"><span class="row-label">Limite</span><span class="row-value">${d.rateLimit} req/min</span></div>
                <div class="row"><span class="row-label">Nivel</span><span class="row-value">Full API</span></div>
            </div>
        </section>

        <section class="section">
            <div class="section-head">
                <div class="section-icon" aria-hidden="true">📊</div>
                <div><div class="section-kicker">Metricas</div><h2 class="section-title">Rendimiento de la API</h2></div>
            </div>
            <div class="section-body">
                <div class="metrics-grid">
                    <div class="metric-card"><div class="metric-val mv-purple">${d.todayRequests.toLocaleString()}</div><div class="metric-lbl">Peticiones hoy</div></div>
                    <div class="metric-card"><div class="metric-val mv-blue">${(d.totalRequests as number).toLocaleString()}</div><div class="metric-lbl">Peticiones totales</div></div>
                    <div class="metric-card"><div class="metric-val mv-yellow">${d.averageLatency}</div><div class="metric-lbl">Latencia promedio</div></div>
                    <div class="metric-card"><div class="metric-val mv-green">${d.successRate}</div><div class="metric-lbl">Tasa de exito</div></div>
                </div>
                <div class="cat-grid">
                    <div class="cat-card"><div class="cat-icon" aria-hidden="true">API</div><div class="cat-val">${d.cmdTotal.toLocaleString()}</div><div class="cat-lbl">Comandos</div></div>
                    <div class="cat-card"><div class="cat-icon" aria-hidden="true">🔧</div><div class="cat-val">${d.toolTotal.toLocaleString()}</div><div class="cat-lbl">Herramientas</div></div>
                    <div class="cat-card"><div class="cat-icon" aria-hidden="true">🎮</div><div class="cat-val">${d.gameTotal.toLocaleString()}</div><div class="cat-lbl">Minijuegos</div></div>
                </div>
            </div>
        </section>

        <section class="section">
            <div class="section-head">
                <div class="section-icon" aria-hidden="true">#</div>
                <div><div class="section-kicker">Integraciones</div><h2 class="section-title">Comandos y sintaxis para tu bot</h2></div>
            </div>
            <div class="section-body">
                <div class="commands-container">
                    ${d.commandRows || '<p style="text-align:center;color:var(--text-dim);padding:1rem">Aun no hay comandos registrados.</p>'}
                </div>
            </div>
        </section>

        <div class="cta-strip">
            <a class="btn btn-primary" href="${d.dashboardUrl}">Volver al dashboard</a>
            <a class="btn btn-ghost" href="${d.docsUrl}">Ver documentacion</a>
            <a class="btn btn-ghost" href="${d.homeUrl}">Ir al inicio</a>
        </div>
    </main>

    <footer class="site-footer">
        <div class="footer-inner">
            <div class="footer-brand-row">
                <img src="${d.logoUrl}" alt="">
                <span class="footer-brand-name">LosPerris Twitch API</span>
            </div>
            <nav class="footer-links" aria-label="Enlaces del sitio">
                <a href="${d.homeUrl}">Inicio</a>
                <a href="${d.dashboardUrl}">Dashboard</a>
                <a href="${d.docsUrl}">Documentacion</a>
                <a href="${d.aboutUrl}">Sobre la API</a>
                <a href="${d.discordUrl}" target="_blank" rel="noopener noreferrer">Discord</a>
                <a href="${d.statusUrl}" target="_blank" rel="noopener noreferrer">Status</a>
            </nav>
            <nav class="footer-legal" aria-label="Legal">
                <a href="${d.legalPrivacy}">Privacidad</a>
                <a href="${d.legalTerms}">Terminos</a>
                <a href="${d.legalStorage}">Almacenamiento</a>
            </nav>
            <p class="footer-copy">
                Reporte generado el <strong>${d.dateStr}</strong> a las <strong>${d.timeStr}</strong>
                · ID <code>${d.reportId}</code><br>
                &copy; ${d.year}
                <a href="${d.siteUrl}" target="_blank" rel="noopener noreferrer">${d.siteLabel}</a>.
                Creado para la comunidad. No afiliado con Twitch o Amazon.
            </p>
        </div>
    </footer>
</div>
</body>
</html>`;
}