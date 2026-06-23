/** Docs — utilidades Tailwind (sin CSS externo en public/) */

export const docsPage =
    'min-h-screen overflow-x-hidden bg-bg-main font-[Outfit,sans-serif] text-[#f4f4f5] bg-fixed';

export const docsContainer = 'flex min-h-screen';

export const docsMobileToggle =
    'fixed top-5 right-5 z-[1001] hidden h-12 w-12 cursor-pointer items-center justify-center rounded-full border-none bg-primary text-white shadow-[0_4px_15px_rgba(0,0,0,0.3)] max-[900px]:flex';

export const docsSidebar = (open: boolean) =>
    `fixed z-[100] flex h-screen w-[280px] flex-col border-r border-white/[0.08] bg-[rgba(14,14,17,0.6)] p-[30px_20px] backdrop-blur-[20px] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] max-[900px]:w-[250px] max-[900px]:shadow-[20px_0_50px_rgba(0,0,0,0.5)] ${open ? 'max-[900px]:translate-x-0' : 'max-[900px]:-translate-x-full'}`;

export const docsSidebarHeader =
    'mb-[30px] flex items-center gap-3 border-b border-white/[0.08] pb-5';

export const docsSidebarLogo = 'h-8 w-8 rounded-lg';

export const docsSidebarTitle = 'm-0 text-[1.1rem] font-bold tracking-tight text-white';

export const docsSearchWrap = 'relative mb-5 flex shrink-0 items-center px-1';

export const docsSearchIcon =
    'pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-[0.9rem] text-[#a1a1aa]';

export const docsSearchInput =
    'w-full rounded-lg border border-white/[0.08] bg-white/5 py-3 pr-3 pl-10 text-[0.9rem] text-white outline-none transition focus:border-primary focus:bg-white/[0.08] focus:shadow-[0_0_0_3px_rgba(145,70,255,0.2)]';

export const docsNav =
    'flex flex-1 flex-col overflow-y-auto pt-2 [scrollbar-color:rgba(255,255,255,0.08)_transparent] [scrollbar-width:thin]';

export const docsNavItem = (active: boolean) => {
    const width = active ? 'ml-3 w-[calc(100%-28px)]' : 'mx-auto w-[calc(100%-16px)]';
    const base = 'relative mb-0.5 flex items-center gap-3 rounded-lg border border-transparent px-3.5 py-1 text-left font-[inherit] text-[0.9rem] font-semibold transition-all no-underline';
    if (active) {
        return `${base} ${width} bg-[#18181b] text-white before:pointer-events-none before:absolute before:top-1/2 before:left-0 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-r before:bg-primary before:shadow-[0_0_8px_#9146ff] before:content-[""]`;
    }
    return `${base} ${width} text-[#a1a1aa] hover:bg-[#18181b] hover:text-white`;
};

export const docsNavGroup = 'mt-6 flex flex-col gap-1';

export const docsNavSub = 'mb-2 flex flex-col gap-1';

export const docsGroupTitle =
    'mb-2 ml-3 text-[0.7rem] font-bold tracking-[0.15em] text-[#a1a1aa] uppercase opacity-70';

export const docsReturnHome =
    'mt-auto flex items-center justify-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 font-semibold text-white no-underline transition hover:bg-white/[0.08]';

export const docsContent =
    'ml-[280px] w-full max-w-[1200px] px-[100px] py-20 max-[900px]:ml-0 max-[900px]:px-5 max-[900px]:py-[60px] [&_a]:font-semibold [&_a]:text-primary [&_a]:no-underline [&_a]:transition hover:[&_a]:text-[#a78bfa] [&_code]:rounded [&_code]:border [&_code]:border-white/[0.05] [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em] [&_code]:text-[#e2e8f0] [&_h2]:relative [&_h2]:mb-[30px] [&_h2]:flex [&_h2]:items-center [&_h2]:gap-[15px] [&_h2]:border-b [&_h2]:border-white/[0.08] [&_h2]:pb-[15px] [&_h2]:text-[1.8rem] [&_h2]:tracking-tight [&_h2]:text-white [&_h2_i]:text-[1.3rem] [&_h2_i]:text-primary [&_h3]:my-6 [&_h3]:text-[1.15rem] [&_h3]:font-bold [&_h3]:text-white [&_p]:mb-5 [&_p]:text-[1rem] [&_p]:text-[#a1a1aa]';

export const docSection =
    'mb-[100px] min-h-[400px] scroll-mt-10 opacity-0 [transform:translateY(20px)] [animation:docsFadeInUp_0.6s_cubic-bezier(0.2,0.8,0.2,1)_forwards]';

export const docsMainTitle =
    'mb-6 text-[3rem] leading-[1.1] font-extrabold tracking-tight text-white max-[900px]:text-center max-[900px]:text-[2.2rem]';

export const docsAccent = 'text-primary [webkit-text-fill-color:#9146ff]';

export const docsLead =
    'mb-10 max-w-[800px] text-[1.25rem] leading-[1.7] font-light text-[#a1a1aa] max-[900px]:text-center max-[900px]:text-[1.1rem]';

export const docsIntroGrid =
    'mt-8 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6';

export const docsStepSeparator = 'text-[0.75rem] text-[#71717a] opacity-50';

export const docsInfoCard =
    'mb-[30px] flex gap-4 rounded-xl border border-primary/20 bg-primary/5 p-5 transition hover:border-primary/30 [&_i]:mt-1 [&_i]:text-primary [&_p]:mb-0 [&_p]:text-[0.9rem] [&_p]:text-[#dedede]';

export const docsInfoCardFlat = `${docsInfoCard} m-0 h-fit items-center [&_i]:mt-0`;

export const docsEndpoint =
    'mb-[30px] flex flex-wrap items-center gap-[15px] rounded-xl border border-white/[0.08] bg-white/[0.02] p-[15px_20px] font-mono transition hover:border-primary/30';

export const docsMethodGet =
    'rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-[0.7rem] font-bold tracking-wide text-primary';

export const docsUrl = 'break-all text-[0.95rem] text-[#e2e8f0]';

export const docsUrlParam = 'font-bold text-primary [text-shadow:0_0_10px_rgba(145,70,255,0.4)]';

export const docsParamsTable =
    'my-[30px] w-full overflow-hidden rounded-2xl border border-white/[0.08] border-separate border-spacing-0 bg-[rgba(19,19,22,0.6)] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.2)] backdrop-blur-[10px] [&_td]:border-b [&_td]:border-white/[0.08] [&_td]:px-[25px] [&_td]:py-[18px] [&_th]:bg-white/[0.02] [&_th]:px-[25px] [&_th]:py-[18px] [&_th]:text-left [&_th]:text-[0.9rem] [&_th]:font-bold [&_th]:tracking-wide [&_th]:text-white [&_th]:uppercase [&_tr:last-child_td]:border-b-0 [&_tr:hover_td]:bg-white/[0.02]';

export const docsCodeBlock =
    'relative my-[30px] rounded-xl border border-white/[0.08] bg-[#0e0e11] p-5 pr-[100px] before:absolute before:top-2.5 before:left-[15px] before:text-[1.2rem] before:leading-none before:tracking-[2px] before:text-[#3f3f46] before:content-["•••"] [&_code]:mt-3 [&_code]:block [&_code]:border-none [&_code]:bg-transparent [&_code]:pr-10 [&_code]:font-mono [&_code]:text-[0.85rem] [&_code]:leading-relaxed [&_code]:text-[#e2e8f0]';

export const docsStepsMini =
    'mb-4 flex items-center gap-[15px] text-[0.9rem] font-medium text-[#a1a1aa]';

export const docsStepBadge =
    'mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-primary/30 bg-primary/15 text-[0.8rem] font-bold text-primary';

export const docsStepsGrid =
    'mt-[30px] grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5';

export const docsStepCard =
    'relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 [&_h3]:mb-2 [&_h3]:text-[1.05rem] [&_h3]:font-bold [&_h3]:text-white [&_p]:mb-0 [&_p]:text-[0.85rem]';

export const docsStepNumber =
    'pointer-events-none absolute -top-[15px] -right-[15px] text-[4rem] leading-none font-extrabold text-white/[0.03]';

export const docsLimitsGrid =
    'my-[30px] grid grid-cols-3 gap-5 max-[768px]:grid-cols-1';

export const docsLimitCard =
    'rounded-xl border border-white/[0.08] bg-[rgba(19,19,22,0.6)] p-5 text-center';

export const docsLimitValue =
    'mb-1 text-[2rem] font-extrabold text-primary [text-shadow:0_0_20px_rgba(145,70,255,0.3)]';

export const docsLimitLabel =
    'text-[0.85rem] font-semibold tracking-wide text-[#a1a1aa] uppercase';

export const docsTabContainer =
    'my-[30px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#0e0e11]';

export const docsTabHeader =
    'flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-white/[0.02] p-2 max-[600px]:flex-col max-[600px]:items-stretch max-[600px]:p-3';

export const docsBotSelector =
    'flex gap-0.5 rounded-md bg-white/5 p-0.5 max-[600px]:w-full max-[600px]:justify-center';

export const docsTabBtn = (active: boolean) =>
    `cursor-pointer rounded px-3 py-1.5 text-[0.8rem] transition max-[600px]:flex-1 ${active ? 'bg-primary font-medium text-white shadow-[0_0_15px_rgba(145,70,255,0.2)]' : 'bg-transparent text-[#a1a1aa] hover:bg-white/5 hover:text-white'}`;

export const docsFormatSelector =
    'ml-auto flex gap-0.5 rounded-md bg-white/5 p-0.5 max-[600px]:order-first max-[600px]:ml-0 max-[600px]:w-full max-[600px]:justify-center';

export const docsFormatBtn = (active: boolean) =>
    `cursor-pointer rounded px-2.5 py-1 text-[0.8rem] transition ${active ? 'bg-primary font-medium text-white' : 'bg-transparent text-[#a1a1aa] hover:bg-white/5 hover:text-white'}`;

export const docsTabContent = 'p-0';

export const docsCopyBtn =
    'absolute top-4 right-4 flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-primary bg-primary px-3 py-1.5 text-[0.8rem] font-medium text-white shadow-[0_0_15px_rgba(145,70,255,0.2)] transition hover:brightness-110';

export const docsCopyBtnSuccess = 'border-success bg-success text-white';

export const docsInfoCardGreen =
    'mb-[30px] flex gap-4 rounded-xl border border-l-4 border-l-success border-white/[0.08] bg-white/[0.02] p-5 [&_i]:mt-1 [&_i]:text-success [&_p]:mb-0 [&_p]:text-[0.9rem] [&_p]:text-[#dedede]';

export const docsInfoCardBlue =
    'mb-[30px] flex gap-4 rounded-xl border border-l-4 border-l-blue-500 border-white/[0.08] bg-white/[0.02] p-5 [&_i]:mt-1 [&_i]:text-blue-500 [&_p]:mb-0 [&_p]:text-[0.9rem] [&_p]:text-[#dedede]';

export const docsInfoCardRed =
    'mb-[30px] flex gap-4 rounded-xl border border-l-4 border-l-error border-white/[0.08] bg-white/[0.02] p-5 [&_i]:mt-1 [&_i]:text-error [&_p]:mb-0 [&_p]:text-[0.9rem] [&_p]:text-[#dedede]';

export const docsInfoCardPurple =
    'mb-[30px] flex gap-4 rounded-xl border border-l-4 border-l-purple-500 border-white/[0.08] bg-white/[0.02] p-5 [&_i]:mt-1 [&_i]:text-purple-500 [&_p]:mb-0 [&_p]:text-[0.9rem] [&_p]:text-[#dedede]';

export const docsInfoCardPrimary =
    'mb-[30px] flex gap-4 rounded-xl border border-l-4 border-l-primary border-white/[0.08] bg-white/[0.02] p-5 [&_i]:mt-1 [&_i]:text-primary [&_p]:mb-0 [&_p]:text-[0.9rem] [&_p]:text-[#dedede]';

export const docsBadgeSuccess =
    'rounded-md border border-success/30 bg-success/10 px-2 py-1 text-[0.7rem] font-bold tracking-wide text-success';

export const docsBadgeWarning =
    'rounded-md border border-warning/30 bg-warning/10 px-2 py-1 text-[0.7rem] font-bold tracking-wide text-warning';

export const docsBadgeError =
    'rounded-md border border-error/30 bg-error/10 px-2 py-1 text-[0.7rem] font-bold tracking-wide text-error';

export const docsBadgeNeutral =
    'rounded-md border border-white/20 bg-white/5 px-2 py-1 text-[0.7rem] font-bold tracking-wide text-[#a1a1aa]';
