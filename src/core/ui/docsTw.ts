/** Docs — utilidades alineadas con el dashboard (tw.ts + global.css) */

import {
    btnCopy,
    card,
    fadeIn,
    sidebarCategoryLabel,
    sidebarNavItem,
    sidebarNavScroll,
    sidebarSupportLink,
    textInput
} from '@/core/ui/tw';

export const docsPage = 'min-h-screen overflow-x-hidden bg-bg-main font-sans text-[#fafafa] antialiased';

export const docsSearchWrap = 'relative mb-3 flex shrink-0 items-center px-1';

export const docsSearchIcon =
    'pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[0.85rem] text-[#c4c4cc]';

export const docsSearchInput = `${textInput} py-2.5 pl-9 pr-3 text-[0.875rem]`;

export const docsNav = sidebarNavScroll;

export const docsNavItem = sidebarNavItem;

export const docsNavGroup = 'flex flex-col';

export const docsNavSub = 'mb-1 flex flex-col';

export const docsGroupTitle = sidebarCategoryLabel;

export const docsReturnHome = `${sidebarSupportLink} mt-4 gap-3`;

export const docsContent =
    'mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 md:px-6 md:py-8 [&_a]:font-semibold [&_a]:text-primary [&_a]:no-underline [&_a]:transition hover:[&_a]:text-primary-hover [&_code]:rounded [&_code]:border [&_code]:border-white/[0.05] [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-[#fafafa] [&_h2]:relative [&_h2]:mb-6 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-3 [&_h2]:border-b [&_h2]:border-white/[0.08] [&_h2]:pb-3 [&_h2]:text-[1.35rem] [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-[#fafafa] md:[&_h2]:text-[1.5rem] [&_h2_i]:text-primary [&_h3]:my-5 [&_h3]:text-[1rem] [&_h3]:font-bold [&_h3]:text-[#fafafa] [&_p]:mb-4 [&_p]:text-[0.9375rem] [&_p]:leading-relaxed [&_p]:text-[#c4c4cc]';

export const docSection = `mb-16 min-h-[200px] scroll-mt-28 ${fadeIn}`;

export const docsMainTitle =
    'mb-4 text-[2rem] font-extrabold leading-tight tracking-tight text-[#fafafa] md:text-[2.4rem]';

export const docsAccent = 'text-primary';

export const docsLead =
    'mb-8 max-w-[720px] text-[1.05rem] leading-relaxed text-[#c4c4cc] md:text-[1.125rem]';

export const docsIntroGrid =
    'mt-6 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4';

export const docsStepSeparator = 'text-[0.75rem] text-[#71717a] opacity-60';

const infoCardBase =
    'mb-6 flex gap-4 rounded-xl border border-white/[0.08] bg-bg-card p-4 transition-[border-color] duration-200 [&_p]:mb-0 [&_p]:text-[0.875rem] [&_p]:leading-relaxed [&_p]:text-[#c4c4cc]';

export const docsInfoCard = `${infoCardBase} border-primary/20 bg-primary/[0.04] hover:border-primary/30 [&_i]:mt-0.5 [&_i]:shrink-0 [&_i]:text-primary`;

export const docsInfoCardFlat = `${docsInfoCard} m-0 h-fit items-center [&_i]:mt-0`;

export const docsEndpoint =
    `${card} mb-6 flex flex-wrap items-center gap-3 p-4 font-mono hover:border-primary/30`;

export const docsMethodGet =
    'rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-[0.7rem] font-bold tracking-wide text-primary';

export const docsUrl = 'break-all text-[0.875rem] text-[#fafafa]';

export const docsUrlParam = 'font-bold text-primary';

export const docsParamsTable =
    `${card} my-6 w-full overflow-hidden border-separate border-spacing-0 p-0 [&_td]:border-b [&_td]:border-white/[0.08] [&_td]:px-5 [&_td]:py-4 [&_th]:bg-white/[0.02] [&_th]:px-5 [&_th]:py-4 [&_th]:text-left [&_th]:text-[0.8125rem] [&_th]:font-bold [&_th]:tracking-wide [&_th]:text-[#fafafa] [&_th]:uppercase [&_tr:last-child_td]:border-b-0 [&_tr:hover_td]:bg-white/[0.02]`;

export const docsCodeBlock =
    `${card} my-6 border-l-4 border-l-primary py-3 pr-[100px] [&_code]:block [&_code]:!border-none [&_code]:!bg-transparent [&_code]:!p-0 [&_code]:font-[Consolas,monospace] [&_code]:text-[0.8125rem] [&_code]:leading-relaxed [&_code]:text-[#fafafa] [&_code]:whitespace-pre-wrap`;

export const docsCopyBtn = btnCopy;

export const docsCopyBtnSuccess = 'bg-success hover:bg-success';

export const docsStepsMini =
    'mb-4 flex items-center gap-3 text-[0.875rem] font-medium text-[#c4c4cc]';

export const docsStepBadge =
    'mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-primary/30 bg-primary/15 text-[0.8rem] font-bold text-primary';

export const docsStepsGrid =
    'mt-6 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4';

export const docsStepCard =
    `${card} relative overflow-hidden p-4 hover:border-primary/30 [&_h3]:mb-2 [&_h3]:text-[1rem] [&_h3]:font-bold [&_h3]:text-[#fafafa] [&_p]:mb-0 [&_p]:text-[0.8125rem]`;

export const docsStepNumber =
    'pointer-events-none absolute -top-3 -right-3 text-[3.5rem] font-extrabold leading-none text-white/[0.03]';

export const docsLimitsGrid =
    'my-6 grid grid-cols-3 gap-4 max-[768px]:grid-cols-1';

export const docsLimitCard = `${card} p-5 text-center hover:border-primary/30`;

export const docsLimitValue =
    'mb-1 text-[1.75rem] font-extrabold text-primary md:text-[2rem]';

export const docsLimitLabel =
    'text-[0.8125rem] font-semibold uppercase tracking-wide text-[#c4c4cc]';

export const docsTabContainer =
    'my-6 overflow-hidden rounded-xl border border-white/[0.08] border-l-4 border-l-primary bg-bg-card shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]';

export const docsTabHeader =
    'flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-3 py-2.5 max-[600px]:flex-col max-[600px]:items-stretch';

export const docsBotSelector =
    'flex flex-wrap gap-1.5 max-[600px]:w-full';

export const docsTabBtn = (active: boolean) =>
    `cursor-pointer rounded-lg border px-3 py-1.5 text-[0.8125rem] font-semibold transition max-[600px]:flex-1 ${
        active
            ? 'border-primary/40 bg-primary/15 text-[#fafafa] shadow-[0_0_12px_rgba(145,70,255,0.12)]'
            : 'border-white/[0.08] bg-white/[0.03] text-[#c4c4cc] hover:border-white/15 hover:text-[#fafafa]'
    }`;

export const docsFormatSelector =
    'ml-auto flex flex-wrap gap-1.5 max-[600px]:order-first max-[600px]:ml-0 max-[600px]:w-full max-[600px]:justify-center';

export const docsFormatBtn = (active: boolean) =>
    `cursor-pointer rounded-lg border px-2.5 py-1.5 text-[0.8125rem] font-semibold transition ${
        active
            ? 'border-primary/40 bg-primary/15 text-[#fafafa]'
            : 'border-white/[0.08] bg-white/[0.03] text-[#c4c4cc] hover:border-white/15 hover:text-[#fafafa]'
    }`;

export const docsTabCodeArea =
    'relative px-4 py-3.5 pr-[108px] [&_code]:block [&_code]:font-[Consolas,monospace] [&_code]:text-[0.8125rem] [&_code]:leading-relaxed [&_code]:text-[#fafafa] [&_code]:whitespace-pre-wrap [&_code]:break-all';

export const docsTabContent = 'p-0';

const infoCardAccent = (accent: string) =>
    `${infoCardBase} border-l-4 ${accent} [&_i]:mt-0.5 [&_i]:shrink-0`;

export const docsInfoCardRed = infoCardAccent('border-l-error [&_i]:text-error');

export const docsInfoCardPrimary = infoCardAccent('border-l-primary [&_i]:text-primary');

export const docsBadgeSuccess =
    'rounded-md border border-success/30 bg-success/10 px-2 py-1 text-[0.7rem] font-bold tracking-wide text-success';

export const docsBadgeWarning =
    'rounded-md border border-warning/30 bg-warning/10 px-2 py-1 text-[0.7rem] font-bold tracking-wide text-warning';

export const docsBadgeError =
    'rounded-md border border-error/30 bg-error/10 px-2 py-1 text-[0.7rem] font-bold tracking-wide text-error';

export const docsBadgeNeutral =
    'rounded-md border border-white/20 bg-white/5 px-2 py-1 text-[0.7rem] font-bold tracking-wide text-[#c4c4cc]';

export const docsBadgeBeta =
    'ml-2 inline-flex align-middle rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-primary';
