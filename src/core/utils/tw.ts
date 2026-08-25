export const card =
    'rounded-xl border border-border-subtle bg-bg-card p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-sm transition-all duration-300 hover:border-border-strong hover:bg-bg-card-hover';

/** Panel calmado (Settings/Analytics): borde suave, sin hover de acento. */
export const panelCard = 'rounded-xl border border-border-subtle bg-bg-panel shadow-[0_8px_30px_rgba(0,0,0,0.15)] backdrop-blur-md';

export const toolPanelShell = (focusMode = false) =>
    focusMode
        ? 'flex h-full min-h-0 flex-col overflow-hidden bg-bg-main'
        : `${panelCard} mb-3 flex flex-col`;

export const toolHeaderTopRow =
    'flex flex-wrap items-center justify-between gap-3 px-5 py-3';

export const toolHeaderConfigBar =
    'flex flex-wrap items-center justify-between gap-2.5 border-t border-border-subtle px-5 py-2.5';

export const fadeIn = 'animate-fade-soft opacity-0';

export const hoverSubtleIconBtn =
    'transition-colors hover:bg-white/[0.02] hover:text-text-main';

export const toolHeaderIconBtn =
    `inline-flex size-8 shrink-0 items-center justify-center rounded-lg border-none text-text-muted disabled:cursor-not-allowed disabled:opacity-40 ${hoverSubtleIconBtn}`;

export const hoverSubtleChip = hoverSubtleIconBtn;
export const hoverSubtleRowBg = hoverSubtleIconBtn;

export const hoverSubtleBorderedRow =
    'transition-colors hover:border-border-strong hover:bg-white/[0.02] hover:text-text-main';

export const hoverSubtleControl =
    'transition-colors hover:border-border-strong hover:bg-white/[0.02]';

export const toolConfigControl =
    `inline-flex h-8 shrink-0 items-center gap-2 rounded-lg border border-border-subtle bg-bg-secondary px-2.5 text-[0.8125rem] font-medium leading-none text-text-main ${hoverSubtleControl}`;

export const toolConfigInput =
    `h-8 w-full rounded-lg border border-border-subtle bg-bg-secondary px-3 py-0 text-[0.8125rem] leading-none text-text-main outline-none ${hoverSubtleControl} focus:border-primary focus:bg-primary/[0.02] disabled:cursor-not-allowed disabled:opacity-50`;

export const toolConfigSegment =
    'inline-flex h-8 shrink-0 items-center rounded-lg border border-border-subtle bg-bg-secondary p-0.5 text-[0.75rem]';

/** Chip/tab inactivo: hover gris. Morado solo cuando está activo. */
export const themeIdleChip =
    'border border-transparent text-text-muted transition-colors hover:bg-white/[0.02] hover:text-text-main';

export const themeActiveChip =
    'border border-primary/30 bg-primary/[0.08] text-text-main';

export const themeIdleChoice =
    `border border-border-subtle bg-bg-secondary text-text-muted ${hoverSubtleControl} hover:text-text-main`;

export const themeActiveChoice =
    'border border-primary/35 bg-primary/[0.07] text-text-main';

const selectChevron =
    "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")]";

/** Comandos — paridad con common.css (tipografía y padding compactos) */
export const toolSelector = 'mb-3 flex items-center justify-between gap-2.5 max-sm:flex-col max-sm:items-stretch';

export const toolLabel =
    'flex items-center gap-1.5 text-[0.8125rem] font-semibold leading-tight text-text-main';

export const selectInput =
    `min-w-[180px] w-auto max-w-[min(100%,240px)] shrink-0 cursor-pointer appearance-none rounded-lg border border-border-strong bg-bg-secondary bg-size-[14px] bg-position-[right_8px_center] bg-no-repeat py-[7px] pr-9 pl-3 text-[0.8125rem] leading-tight text-text-main outline-none ${hoverSubtleControl} focus:border-primary focus:bg-primary/[0.02] ${selectChevron}`;

export const textInput =
    `w-full rounded-lg border border-border-strong bg-bg-secondary px-3 py-[7px] text-[0.8125rem] leading-tight text-text-main outline-none ${hoverSubtleControl} focus:border-primary focus:bg-primary/[0.02]`;

export const inputLabel =
    'block text-[0.8125rem] font-medium leading-tight text-text-muted';

export const codeBox =
    'relative rounded-xl border border-border-strong bg-bg-secondary px-3.5 py-2.5';

export const codeTextarea =
    'block min-h-[38px] w-full resize-none overflow-hidden border-none bg-transparent pr-[96px] font-[Consolas,monospace] text-[0.8125rem] leading-[1.45] text-text-main outline-none whitespace-pre-wrap break-all';

export const btnCopy =
    'absolute top-1/2 right-2.5 z-[1] flex -translate-y-1/2 cursor-pointer items-center gap-1 rounded-lg bg-primary-btn px-3 py-1.5 text-[0.8125rem] font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50';

export const btnPrimary =
    'mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-btn px-6 py-2 text-[0.8125rem] font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50';

export const responseCard =
    'mt-3 items-center gap-3 rounded-xl border border-border-strong bg-bg-secondary px-4 py-3 text-[0.8125rem] leading-normal text-text-main backdrop-blur-[10px]';

export const formGrid = 'grid grid-cols-1 gap-3 min-[768px]:grid-cols-2';

export const formGroupLabel =
    'mb-1.5 block text-[0.8125rem] font-semibold tracking-wide text-text-muted uppercase';

export const textareaXl =
    `min-h-[180px] max-h-[400px] w-full resize-y rounded-xl border border-border-strong bg-bg-secondary px-4 py-4 text-[0.8125rem] leading-relaxed text-text-main outline-none ${hoverSubtleControl} focus:border-primary focus:bg-primary/[0.02]`;

export const cardFooterFlex =
    'mt-6 flex items-center justify-between gap-5 border-t border-border-strong pt-5 max-[600px]:flex-col max-[600px]:text-center';

export const gameResponseCard =
    'mt-4 flex items-center gap-3 rounded-xl border px-5 py-3 text-[0.8125rem] leading-normal backdrop-blur-[10px]';

/* —— Modales —— */
export const dialogBase =
    'modal-dialog fixed inset-0 z-[2000] m-0 h-full max-h-none w-full max-w-none overflow-hidden border-none bg-transparent p-0 shadow-none';

/** Centra el panel dentro del overlay del <dialog>. */
export const modalOverlay =
    'flex min-h-full w-full items-center justify-center p-4';

export const clipPlayerPanel =
    'relative aspect-video w-full min-h-[300px] max-w-4xl overflow-hidden rounded-xl bg-black border border-border-subtle';

export const modalPanel =
    'relative w-full max-w-[500px] overflow-hidden rounded-xl border border-border-subtle bg-bg-modal shadow-[0_8px_30px_rgba(0,0,0,0.15)] outline-none';

export const modalHeader =
    'flex items-center justify-between px-6 pt-6 pb-4';

export const modalTitle = 'm-0 flex items-center gap-2.5 text-[1.15rem] font-bold tracking-tight text-text-main';

export const modalTitleIcon = 'text-primary';

export const modalBody =
    'px-6 py-2 text-[0.85rem] leading-relaxed text-text-muted [&_p]:mb-4 [&_p:last-child]:mb-0 [&_strong]:text-text-main [&_ul:not([role=listbox])]:my-4 [&_ul:not([role=listbox])]:list-disc [&_ul:not([role=listbox])]:space-y-2 [&_ul:not([role=listbox])]:pl-5';

/** Primary primero en el DOM → queda a la izquierda. */
export const modalFooter =
    'mt-2 flex gap-3 px-6 pt-4 pb-6 bg-bg-secondary border-t border-border-subtle';

const modalBtnBase =
    'inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[0.8125rem] font-semibold outline-none transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card';

export const modalBtnPrimary =
    `${modalBtnBase} bg-primary-btn font-semibold text-white hover:bg-primary-hover`;

export const btnSecondary =
    'inline-flex items-center justify-center gap-1.5 rounded-lg border border-border-strong bg-bg-secondary px-5 py-2 text-[0.8125rem] font-semibold text-text-main transition hover:bg-white/[0.02] disabled:cursor-not-allowed disabled:opacity-50';

export const modalBtnSecondary = `${btnSecondary} min-w-0 flex-1 px-3`;

export const btnDanger =
    `${modalBtnBase} border border-error bg-error font-bold text-white hover:bg-error-hover`;

export const btnIcon =
    'rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-text-muted outline-none transition hover:bg-white/[0.02] hover:text-text-main focus-visible:border-border-strong focus-visible:bg-white/[0.02] focus-visible:text-text-main disabled:opacity-50';

export const dangerModalPanel =
    'relative w-full max-w-[500px] overflow-hidden rounded-xl border border-border-subtle bg-bg-modal shadow-[0_8px_30px_rgba(0,0,0,0.15)] outline-none';

export const dangerModalHeader =
    'flex items-center justify-between px-6 pt-6 pb-4';

export const dangerModalTitleIcon = 'text-error';

export const dangerInputGroup =
    'mt-5 rounded-xl border border-border-subtle bg-bg-secondary/60 p-4';

export const dangerInputLabel = 'mb-2.5 block text-[0.85rem] text-text-muted';

export const confirmWordBadge =
    'inline-block rounded px-1.5 py-px font-mono text-[0.8125rem] font-semibold tracking-wide text-text-main bg-white/[0.04] border border-border-subtle';

export const dangerInput =
    'w-full rounded-lg border border-border-strong bg-bg-secondary px-3 py-3 text-center text-base font-semibold uppercase tracking-[0.2em] text-text-main outline-none transition placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:opacity-50 focus:border-primary focus:bg-primary/[0.02]';

export const modalShake = 'animate-modal-shake';
export const sheetIn = 'animate-sheet-in';
export const sheetOut = 'animate-sheet-out';

export const aboutFadeIn = 'opacity-0 animate-about-in';
export const aboutLegoIn = 'opacity-0 animate-about-lego';

/* —— Sidebar (dashboard + docs) —— */
/** Misma curva en shell, labels y margen del main. */
export const SIDEBAR_MOTION =
    'duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]';

export const sidebarNavButtonBase =
    `relative mb-0.5 flex items-center rounded-md border border-transparent py-1.5 text-left font-[inherit] text-[0.85rem] font-medium outline-none transition-[width,padding,margin,background-color,color,box-shadow] ${SIDEBAR_MOTION} focus-visible:bg-bg-tertiary focus-visible:text-text-main focus-visible:ring-1 focus-visible:ring-text-main/10`;

export const sidebarNavItem = (active: boolean, collapsed = false) => {
    const width = collapsed
        ? 'mx-auto w-10 justify-center px-0'
        : 'mx-auto w-[calc(100%-16px)] justify-start px-3';
    if (active) {
        return `${sidebarNavButtonBase} ${width} bg-primary/15 text-text-main shadow-none dark:bg-primary/20 dark:shadow-md dark:shadow-black/40 [&_svg]:text-primary`;
    }
    return `${sidebarNavButtonBase} ${width} text-text-muted ${hoverSubtleIconBtn}`;
};

export const SIDEBAR_WIDTH_EXPANDED_PX = 220;
export const SIDEBAR_WIDTH_COLLAPSED_PX = 72;
export const sidebarContentOffset = 'lg:ml-[var(--lp-sidebar-w,220px)]';
export const sidebarFooterOffset = 'lg:pl-[var(--lp-sidebar-w,220px)]';

export const sidebarShell = (mobileOpen: boolean, collapsed = false) =>
    `fixed left-0 top-0 z-[1000] flex h-screen w-[220px] flex-col overflow-hidden border-r border-border-subtle bg-sidebar transition-[transform,width] ${SIDEBAR_MOTION} ${
        collapsed ? 'lg:w-[72px]' : 'lg:w-[220px]'
    } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`;

export const sidebarBrandHeader = (collapsed = false) =>
    `relative flex h-16 shrink-0 items-center overflow-hidden transition-[padding] ${SIDEBAR_MOTION} ${
        collapsed ? 'justify-center px-2' : 'justify-between gap-2 px-3'
    }`;

/** Label de nav: se recorta con el ancho en vez de desmontarse. */
export const sidebarLabelClip = (collapsed: boolean) =>
    `overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] ${SIDEBAR_MOTION} ${
        collapsed ? 'max-w-0 opacity-0' : 'max-w-[9.5rem] opacity-100'
    }`;

export const sidebarNavScroll =
    'flex flex-1 flex-col overflow-x-hidden overflow-y-auto px-3 py-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';

export const sidebarCategoryLabel =
    'mb-2 ml-3 mt-6 block text-[0.75rem] font-bold uppercase tracking-[0.05em] text-text-muted first:mt-2';

/**
 * Franja inferior compartida: sidebar (Feedback / Docs / Comunidad) + footer de página.
 * Misma altura en desktop para que el border-t forme una sola línea horizontal.
 */
export const APP_BOTTOM_BAR_H = 'h-[4.25rem]';
export const APP_BOTTOM_BAR = `shrink-0 border-t border-border-subtle ${APP_BOTTOM_BAR_H}`;

export const sidebarSupportLink = `${sidebarNavButtonBase} mx-auto w-[calc(100%-16px)] text-text-muted no-underline ${hoverSubtleIconBtn}`;

export const sidebarBackdrop =
    'fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm lg:hidden';
