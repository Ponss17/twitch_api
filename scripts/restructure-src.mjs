#!/usr/bin/env node
/**
 * One-shot migration: src/lib + src/components -> core/, shared/, features/
 * Run from twitch_api/: node scripts/restructure-src.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'src');

const fileMoves = [
    ['lib/config.ts', 'core/config/config.ts'],
    ['lib/paths.ts', 'core/config/paths.ts'],
    ['lib/pageTitle.ts', 'core/config/pageTitle.ts'],
    ['lib/apiError.ts', 'core/api/apiError.ts'],
    ['lib/auth.ts', 'core/api/auth.ts'],
    ['lib/authQuery.ts', 'core/api/authQuery.ts'],
    ['lib/sessionContext.ts', 'core/session/context.ts'],
    ['lib/sessionLoadProgress.ts', 'core/session/loadProgress.ts'],
    ['lib/localPrefs.ts', 'core/session/localPrefs.ts'],
    ['hooks/useSession.ts', 'core/session/useSession.ts'],
    ['lib/tw.ts', 'core/ui/tw.ts'],
    ['lib/docsTw.ts', 'core/ui/docsTw.ts'],
    ['lib/animateValue.ts', 'core/ui/animateValue.ts'],
    ['lib/clipboard.ts', 'core/ui/clipboard.ts'],
    ['lib/utils.ts', 'core/ui/utils.ts'],
    ['lib/debugLog.ts', 'core/logging/debugLog.ts'],
    ['lib/logError.ts', 'core/logging/logError.ts'],
    ['lib/rateLimitCooldown.ts', 'core/errors/rateLimitCooldown.ts'],
    ['lib/twitchTypes.ts', 'core/types/twitch.ts'],
    ['lib/cacheService.ts', 'core/cache/cacheService.ts'],
    ['lib/tmiService.ts', 'features/chat/lib/tmiService.ts'],
    ['lib/chatLogStore.ts', 'features/chat/lib/chatLogStore.ts'],
    ['hooks/useTmiChat.ts', 'features/chat/hooks/useTmiChat.ts'],
    ['lib/dashboardSync.ts', 'features/dashboard/lib/dashboardSync.ts'],
    ['lib/dashboardStats.ts', 'features/dashboard/lib/dashboardStats.ts'],
    ['lib/dashboardSummary.ts', 'features/dashboard/lib/dashboardSummary.ts'],
    ['lib/dashboardTabs.ts', 'features/dashboard/lib/dashboardTabs.ts'],
    ['lib/dashboardTabUrl.ts', 'features/dashboard/lib/dashboardTabUrl.ts'],
    ['lib/activityLogDisplay.ts', 'features/dashboard/lib/activityLogDisplay.ts'],
    ['lib/realtimeService.ts', 'features/dashboard/lib/realtimeService.ts'],
    ['lib/dataExporter.ts', 'features/dashboard/lib/dataExporter.ts'],
    ['lib/tabSyncService.ts', 'features/dashboard/lib/tabSyncService.ts'],
    ['lib/useMountedTabs.ts', 'features/dashboard/hooks/useMountedTabs.ts'],
    ['hooks/useDashboardRealtime.ts', 'features/dashboard/hooks/useDashboardRealtime.ts'],
    ['components/DashboardApp.tsx', 'features/dashboard/app/DashboardApp.tsx'],
    ['components/views/DashboardContent.tsx', 'features/dashboard/components/DashboardContent.tsx'],
    ['components/views/HomeView.tsx', 'features/dashboard/components/home/HomeView.tsx'],
    ['components/views/HomeHero.tsx', 'features/dashboard/components/home/HomeHero.tsx'],
    ['components/views/HomeResourcesPanel.tsx', 'features/dashboard/components/home/HomeResourcesPanel.tsx'],
    ['components/views/HomeActivityFeed.tsx', 'features/dashboard/components/home/HomeActivityFeed.tsx'],
    ['components/views/HomeActivityLogEntry.tsx', 'features/dashboard/components/home/HomeActivityLogEntry.tsx'],
    ['components/views/ProfileView.tsx', 'features/dashboard/components/profile/ProfileView.tsx'],
    ['components/views/profile/ProfileSecuritySection.tsx', 'features/dashboard/components/profile/ProfileSecuritySection.tsx'],
    ['components/views/profile/ProfileHero.tsx', 'features/dashboard/components/profile/ProfileHero.tsx'],
    ['components/views/profile/ProfileExportSection.tsx', 'features/dashboard/components/profile/ProfileExportSection.tsx'],
    ['components/views/profile/ProfileDangerZone.tsx', 'features/dashboard/components/profile/ProfileDangerZone.tsx'],
    ['components/views/profile/ProfileActivitySummary.tsx', 'features/dashboard/components/profile/ProfileActivitySummary.tsx'],
    ['components/layout/Sidebar.tsx', 'features/dashboard/components/layout/Sidebar.tsx'],
    ['components/layout/DashboardHeader.tsx', 'features/dashboard/components/layout/DashboardHeader.tsx'],
    ['lib/commandStore.ts', 'features/commands/lib/commandStore.ts'],
    ['lib/commandGenerator.ts', 'features/commands/lib/commandGenerator.ts'],
    ['lib/commands/config.ts', 'features/commands/lib/config.ts'],
    ['lib/hooks/useCommandStore.ts', 'features/commands/hooks/useCommandStore.ts'],
    ['components/views/CommandsViews.tsx', 'features/commands/components/CommandsViews.tsx'],
    ['components/views/CommandGeneratorCard.tsx', 'features/commands/components/CommandGeneratorCard.tsx'],
    ['components/views/ClipsView.tsx', 'features/clips/components/ClipsView.tsx'],
    ['components/views/MinigamesViews.tsx', 'features/minigames/components/MinigamesViews.tsx'],
    ['components/views/FeedbackView.tsx', 'features/feedback/components/FeedbackView.tsx'],
    ['components/landing/LandingPage.tsx', 'features/marketing/components/LandingPage.tsx'],
    ['components/docs/DocsApp.tsx', 'features/docs/components/DocsApp.tsx'],
    ['components/docs/DocsContent.tsx', 'features/docs/components/DocsContent.tsx'],
    ['components/docs/DocsCodeTabs.tsx', 'features/docs/components/DocsCodeTabs.tsx'],
    ['components/legal/LegalPage.tsx', 'features/legal/components/LegalPage.tsx'],
    ['components/legal/LegalSectionContent.tsx', 'features/legal/components/LegalSectionContent.tsx'],
    ['components/legal/legalConstants.ts', 'features/legal/lib/legalConstants.ts'],
    ['components/about/AboutPage.tsx', 'features/about/components/AboutPage.tsx'],
    ['components/about/AboutTechCards.tsx', 'features/about/components/AboutTechCards.tsx'],
    ['components/providers/SessionProvider.tsx', 'shared/providers/SessionProvider.tsx'],
    ['components/layout/Footer.tsx', 'shared/layout/Footer.tsx']
];

const dirMoves = [
    ['components/ui', 'shared/ui'],
    ['components/errors', 'shared/errors']
];

const toDelete = [
    'lib/overlaySyncService.ts',
    'lib/overlayTypes.ts',
    'lib/rouletteEligibility.ts',
    'lib/rouletteWheelUtils.ts'
];

/** Longest paths first to avoid partial replacement */
const importReplacements = [
    ['@/components/views/HomeActivityLogEntry', '@/features/dashboard/components/home/HomeActivityLogEntry'],
    ['@/components/views/HomeResourcesPanel', '@/features/dashboard/components/home/HomeResourcesPanel'],
    ['@/components/views/CommandGeneratorCard', '@/features/commands/components/CommandGeneratorCard'],
    ['@/components/views/HomeActivityFeed', '@/features/dashboard/components/home/HomeActivityFeed'],
    ['@/components/layout/DashboardHeader', '@/features/dashboard/components/layout/DashboardHeader'],
    ['@/components/views/DashboardContent', '@/features/dashboard/components/DashboardContent'],
    ['@/components/legal/PrivacyPolicyPage', '@/features/legal/components/LegalPage'],
    ['@/components/legal/LegalPageShell', '@/features/legal/components/LegalPage'],
    ['@/components/legal/TermsPage', '@/features/legal/components/LegalPage'],
    ['@/components/legal/CookiesPage', '@/features/legal/components/LegalPage'],
    ['@/components/about/AboutTechCards', '@/features/about/components/AboutTechCards'],
    ['@/components/views/CommandsViews', '@/features/commands/components/CommandsViews'],
    ['@/components/views/MinigamesViews', '@/features/minigames/components/MinigamesViews'],
    ['@/components/providers/SessionProvider', '@/shared/providers/SessionProvider'],
    ['@/components/errors/RateLimitPage', '@/shared/errors/RateLimitPage'],
    ['@/components/landing/LandingPage', '@/features/marketing/components/LandingPage'],
    ['@/components/views/FeedbackView', '@/features/feedback/components/FeedbackView'],
    ['@/components/docs/DocsCodeTabs', '@/features/docs/components/DocsCodeTabs'],
    ['@/components/views/ProfileView', '@/features/dashboard/components/profile/ProfileView'],
    ['@/components/views/profile/', '@/features/dashboard/components/profile/'],
    ['@/components/docs/DocsContent', '@/features/docs/components/DocsContent'],
    ['@/components/layout/DashboardHeader', '@/features/dashboard/components/layout/DashboardHeader'],
    ['@/components/errors/ErrorPage', '@/shared/errors/ErrorPage'],
    ['@/components/views/HomeHero', '@/features/dashboard/components/home/HomeHero'],
    ['@/components/about/AboutPage', '@/features/about/components/AboutPage'],
    ['@/components/views/HomeView', '@/features/dashboard/components/home/HomeView'],
    ['@/components/views/ClipsView', '@/features/clips/components/ClipsView'],
    ['@/components/docs/DocsApp', '@/features/docs/components/DocsApp'],
    ['@/components/DashboardApp', '@/features/dashboard/app/DashboardApp'],
    ['@/components/layout/Sidebar', '@/features/dashboard/components/layout/Sidebar'],
    ['@/components/layout/Footer', '@/shared/layout/Footer'],
    ['@/components/ui/', '@/shared/ui/'],
    ['@/lib/hooks/useCommandStore', '@/features/commands/hooks/useCommandStore'],
    ['@/lib/sessionLoadProgress', '@/core/session/loadProgress'],
    ['@/lib/activityLogDisplay', '@/features/dashboard/lib/activityLogDisplay'],
    ['@/hooks/useDashboardRealtime', '@/features/dashboard/hooks/useDashboardRealtime'],
    ['@/lib/commands/config', '@/features/commands/lib/config'],
    ['@/lib/commandGenerator', '@/features/commands/lib/commandGenerator'],
    ['@/lib/rateLimitCooldown', '@/core/errors/rateLimitCooldown'],
    ['@/lib/dashboardTabUrl', '@/features/dashboard/lib/dashboardTabUrl'],
    ['@/lib/dashboardSummary', '@/features/dashboard/lib/dashboardSummary'],
    ['@/lib/useMountedTabs', '@/features/dashboard/hooks/useMountedTabs'],
    ['@/lib/realtimeService', '@/features/dashboard/lib/realtimeService'],
    ['@/lib/tabSyncService', '@/features/dashboard/lib/tabSyncService'],
    ['@/lib/dashboardStats', '@/features/dashboard/lib/dashboardStats'],
    ['@/lib/dashboardTabs', '@/features/dashboard/lib/dashboardTabs'],
    ['@/lib/dashboardSync', '@/features/dashboard/lib/dashboardSync'],
    ['@/lib/dataExporter', '@/features/dashboard/lib/dataExporter'],
    ['@/lib/sessionContext', '@/core/session/context'],
    ['@/lib/chatLogStore', '@/features/chat/lib/chatLogStore'],
    ['@/lib/commandStore', '@/features/commands/lib/commandStore'],
    ['@/lib/cacheService', '@/core/cache/cacheService'],
    ['@/lib/twitchTypes', '@/core/types/twitch'],
    ['@/lib/authQuery', '@/core/api/authQuery'],
    ['@/lib/tmiService', '@/features/chat/lib/tmiService'],
    ['@/lib/animateValue', '@/core/ui/animateValue'],
    ['@/lib/localPrefs', '@/core/session/localPrefs'],
    ['@/lib/apiError', '@/core/api/apiError'],
    ['@/lib/pageTitle', '@/core/config/pageTitle'],
    ['@/lib/debugLog', '@/core/logging/debugLog'],
    ['@/lib/logError', '@/core/logging/logError'],
    ['@/lib/clipboard', '@/core/ui/clipboard'],
    ['@/lib/docsTw', '@/core/ui/docsTw'],
    ['@/hooks/useTmiChat', '@/features/chat/hooks/useTmiChat'],
    ['@/hooks/useSession', '@/core/session/useSession'],
    ['@/lib/config', '@/core/config/config'],
    ['@/lib/paths', '@/core/config/paths'],
    ['@/lib/auth', '@/core/api/auth'],
    ['@/lib/utils', '@/core/ui/utils'],
    ['@/lib/tw', '@/core/ui/tw']
];

const astroReplacements = [
    ["from '../components/DashboardApp'", "from '@/features/dashboard/app/DashboardApp'"],
    ["from '../components/providers/SessionProvider'", "from '@/shared/providers/SessionProvider'"],
    ["from '../../components/providers/SessionProvider'", "from '@/shared/providers/SessionProvider'"],
    ["from '../../features/tools/overlay/apps/OverlayRouletteApp'", "from '@/features/tools/overlay/apps/OverlayRouletteApp'"],
    ["from '../../features/tools/overlay/apps/OverlayTrendsApp'", "from '@/features/tools/overlay/apps/OverlayTrendsApp'"],
    ["from '../components/landing/LandingPage'", "from '@/features/marketing/components/LandingPage'"],
    ["from '../components/docs/DocsApp'", "from '@/features/docs/components/DocsApp'"],
    ["from '../components/legal/TermsPage'", "from '@/features/legal/components/LegalPage'"],
    ["from '../components/legal/PrivacyPolicyPage'", "from '@/features/legal/components/LegalPage'"],
    ["from '../components/legal/CookiesPage'", "from '@/features/legal/components/LegalPage'"],
    ["from '../components/legal/LegalPageShell'", "from '@/features/legal/components/LegalPage'"],
    ["from '../components/about/AboutPage'", "from '@/features/about/components/AboutPage'"],
    ["from '../components/errors/ErrorPage'", "from '@/shared/errors/ErrorPage'"],
    ["from '../components/errors/RateLimitPage'", "from '@/shared/errors/RateLimitPage'"],
    ["from '../lib/paths'", "from '@/core/config/paths'"],
    ["from '../lib/pageTitle'", "from '@/core/config/pageTitle'"],
    ["from '../components/layout/Footer'", "from '@/shared/layout/Footer'"]
];

function ensureDir(filePath) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function moveFile(fromRel, toRel) {
    const from = path.join(src, fromRel);
    const to = path.join(src, toRel);
    if (!fs.existsSync(from)) {
        console.warn(`skip missing: ${fromRel}`);
        return;
    }
    ensureDir(to);
    fs.renameSync(from, to);
    console.log(`moved ${fromRel} -> ${toRel}`);
}

function moveDir(fromRel, toRel) {
    const from = path.join(src, fromRel);
    const to = path.join(src, toRel);
    if (!fs.existsSync(from)) {
        console.warn(`skip missing dir: ${fromRel}`);
        return;
    }
    ensureDir(to);
    for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
        const srcPath = path.join(from, entry.name);
        const destPath = path.join(to, entry.name);
        if (entry.isDirectory()) {
            fs.cpSync(srcPath, destPath, { recursive: true });
            fs.rmSync(srcPath, { recursive: true, force: true });
        } else {
            fs.renameSync(srcPath, destPath);
        }
    }
    try {
        fs.rmdirSync(from);
    } catch {
        /* may not be empty if nested */
    }
    console.log(`moved dir ${fromRel} -> ${toRel}`);
}

function walkFiles(dir, acc = []) {
    if (!fs.existsSync(dir)) return acc;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walkFiles(full, acc);
        else if (/\.(ts|tsx|astro|mjs)$/.test(entry.name)) acc.push(full);
    }
    return acc;
}

function rewriteImports(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    for (const [from, to] of importReplacements) {
        if (content.includes(from)) {
            content = content.split(from).join(to);
            changed = true;
        }
    }
    if (filePath.endsWith('.astro')) {
        for (const [from, to] of astroReplacements) {
            if (content.includes(from)) {
                content = content.split(from).join(to);
                changed = true;
            }
        }
    }
    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`rewrote ${path.relative(root, filePath)}`);
    }
}

function pruneEmptyDirs(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) pruneEmptyDirs(path.join(dir, entry.name));
    }
    if (dir === src) return;
    if (fs.readdirSync(dir).length === 0) {
        fs.rmdirSync(dir);
        console.log(`removed empty ${path.relative(root, dir)}`);
    }
}

const importsOnly = process.argv.includes('--imports-only');

if (!importsOnly) {
    console.log('=== Moving files ===');
    for (const [from, to] of fileMoves) moveFile(from, to);
    for (const [from, to] of dirMoves) moveDir(from, to);
} else {
    console.log('=== Skipping file moves (--imports-only) ===');
}

console.log('=== Deleting deprecated shims ===');
for (const rel of toDelete) {
    const full = path.join(src, rel);
    if (fs.existsSync(full)) {
        fs.unlinkSync(full);
        console.log(`deleted ${rel}`);
    }
}

console.log('=== Rewriting imports ===');
const targets = [
    ...walkFiles(src),
    ...walkFiles(path.join(root, 'tests')),
    path.join(root, 'e2e', 'smoke.spec.ts'),
    path.join(root, 'e2e', 'api.spec.ts')
].filter((p) => fs.existsSync(p));

for (const file of targets) rewriteImports(file);

console.log('=== Pruning empty directories ===');
pruneEmptyDirs(path.join(src, 'lib'));
pruneEmptyDirs(path.join(src, 'components'));
pruneEmptyDirs(path.join(src, 'hooks'));

console.log('Done.');
