import { MoreHorizontal, type LucideIcon } from 'lucide-react';
import {
    Dropdown,
    DropdownDivider,
    DropdownItem,
    DropdownPanel,
    DropdownTrigger,
    DROPDOWN_Z_FOCUS
} from '@/shared/ui/Dropdown';
import { toolHeaderIconBtn } from '@/core/utils/tw';
import { useTranslation } from '@/core/i18n/I18nContext';

export interface ToolMoreItem {
    id: string;
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
    disabled?: boolean;
    variant?: 'default' | 'danger';
    dividerBefore?: boolean;
}

interface ToolMoreMenuProps {
    items: ToolMoreItem[];
    helpText?: string;
}

export function ToolMoreMenu({ items, helpText }: ToolMoreMenuProps) {
    const { t } = useTranslation();

    if (items.length === 0 && !helpText) return null;

    return (
        <Dropdown className="relative">
            <DropdownTrigger
                aria-label={t.common.moreOptions}
                title={t.common.moreOptions}
                className={toolHeaderIconBtn}
            >
                <MoreHorizontal className="size-4" aria-hidden />
            </DropdownTrigger>
            <DropdownPanel
                align="right"
                placement="bottom"
                widthClassName="w-[220px]"
                zIndex={DROPDOWN_Z_FOCUS}
                className="rounded-xl"
                padding="compact"
            >
                {items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                        <div key={item.id}>
                            {item.dividerBefore ? <DropdownDivider /> : null}
                            <DropdownItem
                                className="rounded-lg"
                                variant={item.variant}
                                disabled={item.disabled}
                                onClick={item.onClick}
                            >
                                {ItemIcon ? (
                                    <ItemIcon className="size-4 shrink-0" aria-hidden />
                                ) : null}
                                {item.label}
                            </DropdownItem>
                        </div>
                    );
                })}
                {helpText ? (
                    <>
                        {items.length > 0 ? <DropdownDivider /> : null}
                        <p className="px-3 py-2 text-[0.7rem] leading-snug text-text-muted">{helpText}</p>
                    </>
                ) : null}
            </DropdownPanel>
        </Dropdown>
    );
}
