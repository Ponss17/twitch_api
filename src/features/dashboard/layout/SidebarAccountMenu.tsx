import { appPath, saveDocsReturnPath } from '@/core/config/paths';
import type { Translations } from '@/core/i18n/locales/es';
import {
    DropdownDivider,
    DropdownItem,
    DropdownLink,
    useDropdown
} from '@/shared/ui/Dropdown';

const PAYPAL_URL = 'https://www.paypal.me/Ponssjean';

const panelShell =
    'overflow-hidden rounded-xl border border-border-strong bg-bg-modal p-1.5 text-text-main shadow-[0_8px_24px_rgba(0,0,0,0.35)]';

type SidebarAccountMenuProps = {
    railCollapsed: boolean;
    twitchProfileUrl: string;
    t: Translations;
    onSettings: () => void;
    onClose: () => void;
    onLogout: () => void;
};

export function SidebarAccountMenu({
    railCollapsed,
    twitchProfileUrl,
    t,
    onSettings,
    onClose,
    onLogout
}: SidebarAccountMenuProps) {
    const { open, panelRef } = useDropdown();

    if (!open) return null;

    const placementClass = railCollapsed
        ? 'absolute left-full bottom-0 z-30 ml-2 w-[13.5rem] origin-left motion-safe:animate-dropdown-in-right motion-reduce:animate-none'
        : 'absolute bottom-full left-0 right-0 z-30 mb-1.5 origin-bottom motion-safe:animate-dropdown-in-up motion-reduce:animate-none';

    return (
        <div ref={panelRef} role="menu" className={`${panelShell} ${placementClass}`.trim()}>
            <DropdownItem
                className="rounded-lg"
                onClick={() => {
                    onSettings();
                    onClose();
                }}
            >
                {t.header.settings}
            </DropdownItem>
            <DropdownLink
                className="rounded-lg"
                href={twitchProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
            >
                {t.header.twitchProfile}
            </DropdownLink>
            <DropdownDivider />
            <DropdownLink
                className="rounded-lg"
                href={appPath('/docs')}
                onClick={saveDocsReturnPath}
            >
                {t.sidebar.docs}
            </DropdownLink>
            <DropdownLink
                className="rounded-lg"
                href="https://discord.gg/PJbExZe7Tp"
                target="_blank"
                rel="noopener noreferrer"
            >
                {t.sidebar.discord}
            </DropdownLink>
            <DropdownLink
                className="rounded-lg"
                href={PAYPAL_URL}
                target="_blank"
                rel="noopener noreferrer"
            >
                {t.header.supportProject}
            </DropdownLink>
            <DropdownDivider />
            <DropdownItem className="rounded-lg" variant="danger" onClick={onLogout}>
                {t.header.logout}
            </DropdownItem>
        </div>
    );
}
