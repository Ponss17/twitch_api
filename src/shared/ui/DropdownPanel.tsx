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
    'fixed isolate flex flex-col overflow-hidden overscroll-contain border border-border-strong bg-bg-modal text-text-main shadow-2xl';

type DropdownPlacement = 'auto' | 'top' | 'bottom';

interface DropdownPanelProps extends HTMLAttributes<HTMLDivElement> {
    align?: 'left' | 'right';
    /** `auto` elige arriba/abajo según el espacio en viewport (default). */
    placement?: DropdownPlacement;
    padding?: 'none' | 'compact';
    zIndex?: 50 | 1000;
    widthClassName?: string;
}

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
        const width = Math.max(rect.width, 180);
        const next: CSSProperties = {
            maxHeight,
            minWidth: width,
            width: widthClassName.includes('w-full') ? width : undefined,
            zIndex: zIndex === 1000 ? 1000 : 50
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

        // Evitar que se salga por la izquierda en pantallas estrechas
        if (typeof next.left === 'number' && next.left + width > window.innerWidth - viewportPad) {
            next.left = Math.max(viewportPad, window.innerWidth - viewportPad - width);
            next.right = 'auto';
        }

        setCoords(next);
    }, [align, containerRef, placement, widthClassName, zIndex]);

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
    const zClass = zIndex === 1000 ? 'z-[1000]' : 'z-50';

    return createPortal(
        <div
            ref={panelRef}
            role={role}
            className={`${panelBase} ${zClass} ${widthClassName} rounded-xl ${padClass} ${className}`.trim()}
            style={{ ...coords, ...style }}
            {...props}
        >
            {children}
        </div>,
        document.body
    );
}
