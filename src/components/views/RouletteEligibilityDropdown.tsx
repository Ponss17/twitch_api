import { useEffect, useRef } from 'react';
import { Users } from 'lucide-react';
import {
    Dropdown,
    DropdownCheckboxItem,
    DropdownChevron,
    DropdownDivider,
    DropdownPanel,
    DropdownTrigger,
    dropdownTriggerCompact
} from '@/components/ui/Dropdown';
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
    const todosRef = useRef<HTMLInputElement>(null);
    const summary = filtersSummaryLabel(filters);

    useEffect(() => {
        const el = todosRef.current;
        if (el) {
            el.indeterminate = hasAnyFilter(filters) && !isAllFilters(filters);
        }
    }, [filters]);

    return (
        <Dropdown>
            <DropdownTrigger
                disabled={disabled}
                haspopup="listbox"
                aria-label={`Quién puede participar: ${summary}`}
                className={dropdownTriggerCompact}
            >
                <Users className="size-3.5 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-left">{summary}</span>
                <DropdownChevron />
            </DropdownTrigger>

            <DropdownPanel role="listbox" aria-label="Quién puede participar" padding="compact">
                <DropdownCheckboxItem
                    inputRef={todosRef}
                    checked={isAllFilters(filters)}
                    disabled={disabled}
                    emphasis
                    onChange={(checked) => onChange(setAllFilters(checked))}
                >
                    Todos
                </DropdownCheckboxItem>
                <DropdownDivider />
                {ROULETTE_ROLE_OPTIONS.map(({ key, label }) => (
                    <DropdownCheckboxItem
                        key={key}
                        checked={filters[key]}
                        disabled={disabled}
                        onChange={(checked) => onChange({ ...filters, [key]: checked })}
                    >
                        {label}
                    </DropdownCheckboxItem>
                ))}
            </DropdownPanel>
        </Dropdown>
    );
}
