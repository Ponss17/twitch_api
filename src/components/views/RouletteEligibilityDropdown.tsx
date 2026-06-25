import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Users } from 'lucide-react';
import {
    ROULETTE_ROLE_OPTIONS,
    filtersSummaryLabel,
    hasAnyFilter,
    isAllFilters,
    setAllFilters,
    type RouletteEligibilityFilters
} from '@/lib/rouletteEligibility';

interface RouletteEligibilityDropdownProps {
    filters: RouletteEligibilityFilters;
    onChange: (filters: RouletteEligibilityFilters) => void;
    disabled?: boolean;
}

export function RouletteEligibilityDropdown({
    filters,
    onChange,
    disabled = false
}: RouletteEligibilityDropdownProps) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const todosRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const el = todosRef.current;
        if (el) {
            el.indeterminate = hasAnyFilter(filters) && !isAllFilters(filters);
        }
    }, [filters]);

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('click', onDocClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('click', onDocClick);
            document.removeEventListener('keydown', onKey);
        };
    }, []);

    const summary = filtersSummaryLabel(filters);

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={`Quién puede participar: ${summary}`}
                onClick={() => !disabled && setOpen((v) => !v)}
                className="flex min-w-[9.5rem] max-w-[11.5rem] items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-1.5 text-[0.75rem] font-medium text-[#fafafa] transition hover:border-primary/30 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
            >
                <Users className="size-3.5 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-left">{summary}</span>
                <ChevronDown
                    className={`size-3.5 shrink-0 text-[#71717a] transition-transform ${open ? 'rotate-180' : ''}`}
                    aria-hidden
                />
            </button>

            {open && (
                <div
                    role="listbox"
                    aria-label="Quién puede participar"
                    className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[11.5rem] animate-fade-soft overflow-hidden rounded-xl border border-primary/20 bg-[rgba(15,15,20,0.96)] p-1.5 shadow-2xl backdrop-blur-xl"
                >
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-[0.75rem] font-semibold text-[#fafafa] transition hover:bg-primary/10">
                        <input
                            ref={todosRef}
                            type="checkbox"
                            checked={isAllFilters(filters)}
                            disabled={disabled}
                            onChange={(e) => onChange(setAllFilters(e.target.checked))}
                            className="size-3.5 accent-[#9146ff]"
                        />
                        Todos
                    </label>
                    <div className="my-1 border-t border-white/5" aria-hidden />
                    {ROULETTE_ROLE_OPTIONS.map(({ key, label }) => (
                        <label
                            key={key}
                            className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-[0.75rem] font-medium text-[#a1a1aa] transition hover:bg-primary/10 hover:text-[#fafafa]"
                        >
                            <input
                                type="checkbox"
                                checked={filters[key]}
                                disabled={disabled}
                                onChange={(e) => {
                                    onChange({ ...filters, [key]: e.target.checked });
                                }}
                                className="size-3.5 accent-[#9146ff]"
                            />
                            {label}
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}
