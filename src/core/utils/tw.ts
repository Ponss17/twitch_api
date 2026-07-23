export const card =
    'rounded-xl border border-white/[0.04] bg-zinc-900/40 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-sm transition-all duration-300 hover:border-white/[0.08] hover:bg-zinc-900/60';

/** Panel calmado (Settings/Analytics): borde suave, sin hover morado. */
export const panelCard = 'rounded-xl border border-white/[0.03] bg-zinc-900/30 shadow-[0_8px_30px_rgba(0,0,0,0.15)] backdrop-blur-md';

export const fadeIn = 'animate-fade-soft opacity-0';

/** Hover morado suave — iconos/botones sin borde (toolbar). */
export const hoverSubtleIconBtn =
    'transition-colors hover:bg-primary/10 hover:text-[#fafafa]';

/** Hover morado suave — chips/botones sin borde propio. */
export const hoverSubtleChip =
    'transition-colors hover:bg-primary/10 hover:text-[#d4d4d8]';

/** Hover gris suave — filas/tablas sin borde interactivo. */
export const hoverSubtleRowBg = 'transition-colors hover:bg-white/[0.04]';

/** Hover morado suave — filas con borde (Recursos, links). */
export const hoverSubtleBorderedRow =
    'transition-colors hover:border-primary/25 hover:bg-primary/10 hover:text-[#fafafa]';

/** Hover morado suave — controles con borde (selects, inputs). */
export const hoverSubtleControl =
    'transition-colors hover:border-primary/25 hover:bg-primary/[0.06]';

/** Hover neutro suave — iconos/botones sin borde (toolbar). */
export const hoverNeutralIconBtn =
    'transition-colors hover:bg-white/[0.06] hover:text-[#fafafa]';

/** Hover neutro suave — chips/botones sin borde propio. */
export const hoverNeutralChip =
    'transition-colors hover:bg-white/[0.06] hover:text-[#d4d4d8]';

/** Hover neutro suave — filas con borde. */
export const hoverNeutralBorderedRow =
    'transition-colors hover:border-white/15 hover:bg-white/[0.04] hover:text-[#fafafa]';

/** Hover neutro suave — controles con borde. */
export const hoverNeutralControl =
    'transition-colors hover:border-white/15 hover:bg-white/[0.04]';

/** Hover morado suave — navegación sidebar. */
export const hoverSubtleNav =
    'transition-colors hover:bg-white/[0.04] hover:text-zinc-200';

const selectChevron =
    "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239146ff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")]";

/** Comandos — paridad con common.css (tipografía y padding compactos) */
export const toolSelector = 'mb-3 flex items-center justify-between gap-2.5 max-sm:flex-col max-sm:items-stretch';

export const toolLabel =
    'flex items-center gap-1.5 text-[0.8125rem] font-semibold leading-tight text-[#a78bfa]';

export const selectInput =
    `[color-scheme:dark] min-w-[180px] w-auto max-w-[min(100%,240px)] shrink-0 cursor-pointer appearance-none rounded-lg border border-white/[0.08] bg-bg-secondary bg-size-[14px] bg-position-[right_8px_center] bg-no-repeat py-[7px] pr-9 pl-3 text-[0.8125rem] leading-tight text-[#fafafa] outline-none ${hoverSubtleControl} focus:border-primary focus:bg-primary/[0.02] ${selectChevron}`;

export const textInput =
    `w-full rounded-lg border border-white/[0.08] bg-bg-secondary px-3 py-[7px] text-[0.8125rem] leading-tight text-[#fafafa] outline-none ${hoverSubtleControl} focus:border-primary focus:bg-primary/[0.02]`;

export const inputLabel =
    'block text-[0.8125rem] font-medium leading-tight text-[#c4c4cc]';

export const codeBox =
    'relative rounded-xl border border-white/[0.08] bg-bg-secondary px-3.5 py-2.5';

export const codeTextarea =
    'block min-h-[38px] w-full resize-none overflow-hidden border-none bg-transparent pr-[96px] font-[Consolas,monospace] text-[0.8125rem] leading-[1.45] text-[#fafafa] outline-none whitespace-pre-wrap break-all';

export const btnCopy =
    'absolute top-1/2 right-2.5 z-[1] flex -translate-y-1/2 cursor-pointer items-center gap-1 rounded-lg bg-[#7c3aed] px-3 py-1.5 text-[0.8125rem] font-semibold text-white shadow-sm transition-all duration-200 hover:scale-105 hover:bg-[#8b5cf6] hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100';

export const btnPrimary =
    'mt-4 inline-flex items-center gap-2 rounded-lg bg-[#7c3aed] px-6 py-2 text-[0.8125rem] font-semibold text-white transition hover:bg-[#6d28d9] disabled:opacity-50';

export const responseCard =
    'mt-3 items-center gap-3 rounded-xl border border-white/[0.08] bg-[rgba(15,23,42,0.6)] px-4 py-3 text-[0.8125rem] leading-normal text-[#fafafa] backdrop-blur-[10px]';

export const formGrid = 'grid grid-cols-1 gap-3 min-[768px]:grid-cols-2';

export const formGroupLabel =
    'mb-1.5 block text-[0.8125rem] font-semibold tracking-wide text-[#c4c4cc] uppercase';

export const textareaXl =
    `min-h-[180px] max-h-[400px] w-full resize-y rounded-xl border border-white/[0.08] bg-bg-secondary px-4 py-4 text-[0.8125rem] leading-relaxed text-[#fafafa] outline-none ${hoverSubtleControl} focus:border-primary focus:bg-primary/[0.02]`;

export const cardFooterFlex =
    'mt-6 flex items-center justify-between gap-5 border-t border-white/[0.08] pt-5 max-[600px]:flex-col max-[600px]:text-center';

export const gameResponseCard =
    'mt-4 flex items-center gap-3 rounded-xl border px-5 py-3 text-[0.8125rem] leading-normal backdrop-blur-[10px]';

/* —— Modales —— */
export const dialogBase =
    'fixed inset-0 z-[2000] m-auto w-[90%] max-w-[500px] border-none bg-transparent p-0 shadow-none backdrop:bg-black/60 backdrop:backdrop-blur-sm';

export const clipPlayerPanel =
    'relative aspect-video w-full min-h-[300px] max-w-4xl overflow-hidden rounded-xl bg-black border border-white/10';

export const modalPanel = 'relative outline-none overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c0e] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] animate-fade-soft before:absolute before:inset-0 before:pointer-events-none before:rounded-2xl before:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]';

export const modalHeader =
    'flex items-center justify-between px-6 pt-6 pb-4';

export const modalTitle = 'm-0 flex items-center gap-2.5 text-[1.15rem] font-bold tracking-tight text-[#fafafa]';

export const modalTitleIcon = 'text-primary';

export const modalBody =
    'px-6 py-2 text-[0.85rem] leading-relaxed text-[#a1a1aa] [&_p]:mb-4 [&_p:last-child]:mb-0 [&_strong]:text-[#fafafa] [&_ul]:my-4 [&_ul]:list-none [&_ul]:space-y-3 [&_ul]:pl-0 [&_li]:flex [&_li]:items-start [&_li]:gap-3 [&_li_svg]:mt-0.5 [&_li_svg]:shrink-0';

export const modalFooter =
    'mt-2 flex flex-row-reverse gap-3 px-6 pt-4 pb-6 bg-black/20 border-t border-white/[0.04]';

const modalBtnBase =
    'inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[0.8125rem] font-semibold outline-none transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card';

export const modalBtnPrimary =
    `${modalBtnBase} bg-[#7c3aed] font-semibold text-white hover:-translate-y-0.5 hover:bg-[#6d28d9]`;

export const btnSecondary =
    `${modalBtnBase} border border-white/15 bg-white/10 font-semibold text-[#fafafa] hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/15`;

export const btnDanger =
    `${modalBtnBase} border border-error bg-error font-bold text-white hover:-translate-y-0.5 hover:bg-error-hover`;

export const btnIcon =
    'rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-[#c4c4cc] outline-none transition hover:bg-white/5 hover:text-[#fafafa] focus-visible:border-white/15 focus-visible:bg-white/5 focus-visible:text-[#fafafa] disabled:opacity-50';

export const dangerModalPanel =
    'relative outline-none overflow-hidden rounded-2xl border border-error/20 bg-[#0c0c0e] shadow-[0_20px_60px_-15px_rgba(239,68,68,0.2)] before:absolute before:inset-0 before:pointer-events-none before:rounded-2xl before:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]';

export const dangerModalHeader =
    'flex items-center justify-between px-6 pt-6 pb-4';

export const dangerModalTitleIcon = 'text-error';

export const dangerInputGroup =
    'mt-5 rounded-xl border border-dashed border-error/20 bg-error/[0.03] p-4';

export const dangerInputLabel = 'mb-2.5 block text-[0.85rem] text-[#c4c4cc]';

export const confirmWordBadge =
    'rounded bg-error/10 px-1.5 py-0.5 font-mono text-sm font-extrabold tracking-wide text-error';

export const dangerInput =
    'w-full rounded-lg border border-white/[0.08] bg-black/20 px-3 py-3 text-center text-base font-semibold uppercase tracking-[0.2em] text-white outline-none transition placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:opacity-50 focus:border-error focus:bg-error/[0.08]';

export const modalShake = 'animate-modal-shake';

export const aboutFadeIn = 'opacity-0 animate-about-in';
export const aboutLegoIn = 'opacity-0 animate-about-lego';

/* —— Sidebar (dashboard + docs) —— */
export const sidebarNavButtonBase =
    'relative mb-0.5 flex items-center gap-3 rounded-md border border-transparent px-3 py-1.5 text-left font-[inherit] text-[0.85rem] font-medium transition-all outline-none focus-visible:bg-bg-tertiary focus-visible:text-white focus-visible:ring-1 focus-visible:ring-white/10';

export const sidebarNavItem = (active: boolean) => {
    const width = 'mx-auto w-[calc(100%-16px)]';
    if (active) {
        return `${sidebarNavButtonBase} ${width} bg-primary/20 text-zinc-100 shadow-md shadow-black/40 [&_svg]:text-primary`;
    }
    return `${sidebarNavButtonBase} ${width} text-zinc-400 ${hoverSubtleNav}`;
};

export const sidebarShell = (mobileOpen: boolean) =>
    `fixed left-0 top-0 z-[1000] flex h-screen w-[240px] flex-col bg-sidebar transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`;

export const sidebarBrandHeader =
    'flex h-20 shrink-0 items-center gap-3 px-5 py-4';

export const sidebarNavScroll =
    'flex flex-1 flex-col overflow-y-auto px-3 py-3 [scrollbar-color:rgba(255,255,255,0.08)_transparent] [scrollbar-width:thin]';

export const sidebarCategoryLabel =
    'mb-2 ml-3 mt-6 block text-[0.75rem] font-bold uppercase tracking-[0.05em] text-zinc-400 first:mt-2';

export const sidebarSupportLink = `${sidebarNavButtonBase} mx-auto w-[calc(100%-16px)] text-zinc-400 no-underline ${hoverSubtleNav}`;

export const sidebarBackdrop =
    'fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm lg:hidden';
