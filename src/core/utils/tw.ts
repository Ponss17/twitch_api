export const card =
    'rounded-xl border border-white/[0.08] bg-bg-card p-3 transition-[border-color] duration-200 hover:border-primary';

export const fadeIn = 'animate-fade-soft opacity-0';

const selectChevron =
    "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239146ff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")]";

/** Comandos — paridad con common.css (tipografía y padding compactos) */
export const toolSelector = 'mb-3 flex items-center justify-between gap-2.5 max-sm:flex-col max-sm:items-stretch';

export const toolLabel =
    'flex items-center gap-1.5 text-[0.8125rem] font-semibold leading-tight text-primary';

export const selectInput =
    `[color-scheme:dark] min-w-[180px] w-auto max-w-[min(100%,240px)] shrink-0 cursor-pointer appearance-none rounded-lg border border-white/[0.08] bg-bg-secondary bg-size-[14px] bg-position-[right_8px_center] bg-no-repeat py-[7px] pr-9 pl-3 text-[0.8125rem] leading-tight text-[#fafafa] outline-none transition focus:border-primary focus:bg-primary/[0.02] ${selectChevron}`;

export const textInput =
    'w-full rounded-lg border border-white/[0.08] bg-bg-secondary px-3 py-[7px] text-[0.8125rem] leading-tight text-[#fafafa] outline-none transition focus:border-primary focus:bg-primary/[0.02]';

export const inputLabel =
    'block text-[0.8125rem] font-medium leading-tight text-[#c4c4cc]';

export const codeBox =
    'relative rounded-xl border border-white/[0.08] bg-black/40 px-3.5 py-2.5';

export const codeTextarea =
    'block h-[38px] w-full resize-none overflow-hidden border-none bg-transparent pr-[96px] font-[Consolas,monospace] text-[0.8125rem] leading-[1.45] text-[#fafafa] outline-none';

export const btnCopy =
    'absolute top-1/2 right-2.5 flex -translate-y-1/2 items-center gap-1 rounded-lg bg-[#7c3aed] px-3 py-1.5 text-[0.8125rem] font-semibold text-white transition hover:bg-[#6d28d9]';

export const btnPrimary =
    'mt-4 inline-flex items-center gap-2 rounded-lg bg-[#7c3aed] px-6 py-2 text-[0.8125rem] font-semibold text-white transition hover:bg-[#6d28d9] disabled:opacity-50';

export const responseCard =
    'mt-3 items-center gap-3 rounded-xl border border-white/[0.08] bg-[rgba(15,23,42,0.6)] px-4 py-3 text-[0.8125rem] leading-normal text-[#fafafa] backdrop-blur-[10px]';

export const formGrid = 'grid grid-cols-1 gap-3 min-[768px]:grid-cols-2';

export const formGroupLabel =
    'mb-1.5 block text-[0.8125rem] font-semibold tracking-wide text-[#c4c4cc] uppercase';

export const textareaXl =
    'min-h-[180px] max-h-[400px] w-full resize-y rounded-xl border border-white/[0.08] bg-bg-secondary px-4 py-4 text-[0.8125rem] leading-relaxed text-[#fafafa] outline-none transition focus:border-primary focus:bg-primary/[0.02]';

export const cardFooterFlex =
    'mt-6 flex items-center justify-between gap-5 border-t border-white/[0.08] pt-5 max-[600px]:flex-col max-[600px]:text-center';

export const gameResponseCard =
    'mt-4 flex items-center gap-3 rounded-xl border px-5 py-3 text-[0.8125rem] leading-normal backdrop-blur-[10px]';

/* —— Modales —— */
export const dialogBase =
    'fixed inset-0 z-[2000] m-auto w-[90%] max-w-[500px] border-none bg-transparent p-0 shadow-none backdrop:bg-black/60 backdrop:backdrop-blur-sm';

export const clipPlayerPanel =
    'relative aspect-video w-full min-h-[300px] max-w-4xl overflow-hidden rounded-xl bg-black border border-white/10';

export const modalPanel = 'overflow-hidden rounded-xl border border-white/[0.08] bg-bg-card animate-fade-soft';

export const modalHeader =
    'flex items-center justify-between border-b border-white/[0.08] bg-bg-secondary px-5 py-4';

export const modalTitle = 'm-0 flex items-center gap-2 text-[1.05rem] font-bold text-[#fafafa]';

export const modalTitleIcon = 'text-primary';

export const modalBody =
    'px-5 py-5 text-[0.875rem] leading-relaxed text-[#c4c4cc] [&_p]:mb-3.5 [&_p:last-child]:mb-0 [&_strong]:text-[#fafafa] [&_ul]:my-3 [&_ul]:list-none [&_ul]:space-y-2 [&_ul]:pl-2.5 [&_li]:flex [&_li]:items-start [&_li]:gap-2 [&_li_i]:mt-0.5 [&_li_i]:text-primary';

export const modalFooter =
    'flex flex-row-reverse gap-2.5 border-t border-white/[0.08] bg-bg-secondary px-5 py-4';

const modalBtnBase =
    'inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[0.8125rem] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';

export const modalBtnPrimary =
    `${modalBtnBase} bg-[#7c3aed] font-semibold text-white hover:-translate-y-0.5 hover:bg-[#6d28d9]`;

export const btnSecondary =
    `${modalBtnBase} border border-white/15 bg-white/10 font-semibold text-[#fafafa] hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/15`;

export const btnDanger =
    `${modalBtnBase} border border-error bg-error font-bold text-white hover:-translate-y-0.5 hover:bg-error-hover`;

export const btnIcon =
    'rounded-lg border-none bg-transparent px-2 py-1.5 text-[#c4c4cc] transition hover:bg-white/5 hover:text-[#fafafa] disabled:opacity-50';

export const dangerModalPanel =
    'overflow-hidden rounded-xl border border-error/30 bg-bg-card';

export const dangerModalHeader =
    'flex items-center justify-between border-b border-error/20 bg-error/[0.05] px-5 py-4';

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
    'relative mb-0.5 flex items-center gap-3 rounded-lg border border-transparent px-3.5 py-1.5 text-left font-[inherit] text-[0.85rem] font-semibold transition-all outline-none focus-visible:bg-bg-tertiary focus-visible:text-[#fafafa] focus-visible:border-primary/50';

export const sidebarNavItem = (active: boolean) => {
    const width = 'mx-auto w-[calc(100%-16px)]';
    if (active) {
        return `${sidebarNavButtonBase} ${width} bg-bg-tertiary text-[#fafafa] overflow-hidden before:pointer-events-none before:absolute before:top-1/2 before:left-0 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-r-md before:bg-primary before:content-[""]`;
    }
    return `${sidebarNavButtonBase} ${width} text-[#c4c4cc] hover:bg-bg-tertiary hover:text-[#fafafa]`;
};

export const sidebarShell = (mobileOpen: boolean) =>
    `fixed left-0 top-0 z-[1000] flex h-screen w-[280px] flex-col border-r border-white/[0.08] bg-sidebar transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`;

export const sidebarBrandHeader =
    'flex h-20 shrink-0 items-center gap-3 border-b border-white/[0.08] px-5 py-4';

export const sidebarNavScroll =
    'flex flex-1 flex-col overflow-y-auto px-3 py-3 [scrollbar-color:rgba(255,255,255,0.08)_transparent] [scrollbar-width:thin]';

export const sidebarCategoryLabel =
    'mb-2 ml-3 mt-6 block text-[0.75rem] font-bold uppercase tracking-[0.05em] text-[#71717a] first:mt-2';

export const sidebarSupportLink = `${sidebarNavButtonBase} mx-auto w-[calc(100%-16px)] text-[#c4c4cc] no-underline transition hover:bg-bg-tertiary hover:text-[#fafafa]`;

export const sidebarBackdrop =
    'fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm lg:hidden';
