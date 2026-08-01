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
} from '@/shared/ui/Dropdown';
import {
    ROULETTE_ROLE_OPTIONS,
    filtersSummaryLabel,
    hasAnyFilter,
    isAllFilters,
    setAllFilters,
    type RouletteEligibilityFilters
} from '@/features/roulette/lib/eligibility';
import { useTranslation } from '@/core/i18n/I18nContext';

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
    const { t } = useTranslation();
    const rlT = t.minigames.roulette;
    const todosRef = useRef<HTMLInputElement>(null);
    const summary = filtersSummaryLabel(filters, rlT);

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
                aria-label={`${rlT.whoCanPlay}: ${summary}`}
                className={dropdownTriggerCompact}
            >
                <Users className="size-3.5 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-left">{summary}</span>
                <DropdownChevron />
            </DropdownTrigger>

            <DropdownPanel role="listbox" aria-label={rlT.whoCanPlay} padding="compact">
                <DropdownCheckboxItem
                    inputRef={todosRef}
                    checked={isAllFilters(filters)}
                    disabled={disabled}
                    emphasis
                    onChange={(checked) => onChange(setAllFilters(checked))}
                >
                    {rlT.all}
                </DropdownCheckboxItem>
                <DropdownDivider />
                {ROULETTE_ROLE_OPTIONS(rlT).map(({ key, label }) => (
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
