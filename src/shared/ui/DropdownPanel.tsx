import {
    useCallback,
    useLayoutEffect,
    useState,
    type CSSProperties,
    type HTMLAttributes
} from 'react';
import { createPortal } from 'react-dom';
import { useDropdown } from './DropdownContext';

const panelBase =
    'fixed isolate border border-border-strong bg-bg-modal text-text-main shadow-[0_8px_24px_rgba(0,0,0,0.35)]';
const panelScroll =
    'max-h-full overflow-x-hidden overflow-y-auto overscroll-contain rounded-[inherit]';

type DropdownPlacement = 'auto' | 'top' | 'bottom';

interface DropdownPanelProps extends HTMLAttributes<HTMLDivElement> {
    align?: 'left' | 'right';
    /** `auto` elige arriba/abajo según el espacio en viewport (default). */
    placement?: DropdownPlacement;
    padding?: 'none' | 'compact';
    zIndex?: 50 | 1000 | 1200;
    widthClassName?: string;
    /** Ancho igual al del trigger (sin usar `w-full`, que en `fixed` es el viewport). */
    matchTrigger?: boolean;
}

/** Encima del overlay de modo focus (`z-[1100]`). */
export const DROPDOWN_Z_FOCUS = 1200 as const;

function resolveTriggerEl(container: HTMLDivElement | null): HTMLElement | null {
    if (!container) return null;
    return (
        container.querySelector<HTMLElement>('[aria-haspopup]') ??
        container.querySelector<HTMLElement>('button, [role="button"]') ??
        container
    );
}

export function DropdownPanel({
    children,
    align = 'right',
    placement = 'auto',
    padding = 'none',
    zIndex = 50,
    widthClassName = 'min-w-[11.5rem]',
    matchTrigger = false,
    className = '',
    role = 'menu',
    style,
    ...props
}: DropdownPanelProps) {
    const { open, containerRef, panelRef } = useDropdown();
    const [coords, setCoords] = useState<CSSProperties | null>(null);

    const updatePosition = useCallback(() => {
        const trigger = resolveTriggerEl(containerRef.current);
        if (!trigger) return;

        const rect = trigger.getBoundingClientRect();
        const gap = 8;
        const viewportPad = 8;
        const spaceBelow = window.innerHeight - rect.bottom - gap - viewportPad;
        const spaceAbove = rect.top - gap - viewportPad;
        const minComfortable = 180;

        let placeBottom: boolean;
        if (placement === 'bottom') placeBottom = true;
        else if (placement === 'top') placeBottom = false;
        else {
            placeBottom = spaceBelow >= minComfortable || spaceBelow >= spaceAbove;
        }

        const maxHeight = Math.max(120, placeBottom ? spaceBelow : spaceAbove);
        const matchWidth = matchTrigger || widthClassName.includes('w-full');
        const triggerW = Math.round(rect.width);
        const width = matchWidth ? triggerW : Math.max(triggerW, 180);
        const next: CSSProperties = {
            maxHeight,
            minWidth: width,
            width: matchWidth ? triggerW : undefined,
            zIndex
        };

        if (placeBottom) {
            next.top = rect.bottom + gap;
            next.bottom = 'auto';
        } else {
            next.bottom = window.innerHeight - rect.top + gap;
            next.top = 'auto';
        }

        if (align === 'right') {
            next.left = 'auto';
            next.right = Math.max(viewportPad, window.innerWidth - rect.right);
        } else {
            next.right = 'auto';
            next.left = Math.max(viewportPad, rect.left);
        }

        if (typeof next.left === 'number' && next.left + width > window.innerWidth - viewportPad) {
            next.left = Math.max(viewportPad, window.innerWidth - viewportPad - width);
            next.right = 'auto';
        }

        setCoords(next);
    }, [align, containerRef, matchTrigger, placement, widthClassName, zIndex]);

    useLayoutEffect(() => {
        if (!open) {
            setCoords(null);
            return;
        }
        updatePosition();
        const onScrollOrResize = () => updatePosition();
        window.addEventListener('resize', onScrollOrResize);
        window.addEventListener('scroll', onScrollOrResize, true);
        return () => {
            window.removeEventListener('resize', onScrollOrResize);
            window.removeEventListener('scroll', onScrollOrResize, true);
        };
    }, [open, updatePosition]);

    if (!open || typeof document === 'undefined' || !coords) return null;

    const padClass = padding === 'compact' ? 'p-1.5' : '';
    const zClass = zIndex === 1200 ? 'z-[1200]' : zIndex === 1000 ? 'z-[1000]' : 'z-50';

    return createPortal(
        <div
            ref={panelRef}
            role={role}
            className={`${panelBase} ${zClass} ${widthClassName} rounded-xl ${className}`.trim()}
            style={{ ...coords, ...style }}
            {...props}
        >
            <div className={`${panelScroll} ${padClass}`.trim()}>{children}</div>
        </div>,
        document.body
    );
}
