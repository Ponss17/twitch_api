import { Globe, Languages, Palette, Search, ChevronDown, Check } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { btnPrimary } from '@/core/utils/tw';
import { Dropdown, DropdownTrigger, DropdownPanel, DropdownItem } from '@/shared/ui/Dropdown';
import { API_ENDPOINTS } from '@/core/config/config';
import { authHeaders, withApiCredentials } from '@/core/api/auth';
import { fetchWithRetry } from '@/core/api/fetchWithRetry';
import { useRequiredSession } from '@/core/session/useSession';
import { useToast } from '@/shared/ui/ToastProvider';
import { SettingsRow } from '@/features/dashboard/settings/SettingsGroup';
import { useTranslation } from '@/core/i18n/I18nContext';
import type { Locale } from '@/core/i18n/I18nContext';
import { useTheme, SUPPORTED_THEMES, THEME_DEFINITIONS } from '@/core/theme';
import { resolveSafeTimezone } from '@/features/dashboard/lib/dashboardStats';

interface SettingsPreferencesSectionProps {
    currentTimezone: string;
    onSettingsChanged: () => void;
}

const LOCALE_OPTIONS: { value: Locale; label: string }[] = [
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'English' },
    { value: 'pt', label: 'Português' },
];

export function SettingsPreferencesSection({ currentTimezone, onSettingsChanged }: SettingsPreferencesSectionProps) {
    const session = useRequiredSession();
    const { showToast } = useToast();
    const { t, locale, setLocale } = useTranslation();
    const tz = t.settings.preferences.timezone;
    const { theme, setTheme } = useTheme();

    const [saving, setSaving] = useState(false);
    
    const [timezones] = useState(() => {
        try {
            return Array.from(new Set(['UTC', ...Intl.supportedValuesOf('timeZone')]));
        } catch {
            return ['UTC'];
        }
    });

    const [selectedTz, setSelectedTz] = useState(resolveSafeTimezone(currentTimezone));
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setSelectedTz(resolveSafeTimezone(currentTimezone));
    }, [currentTimezone]);

    const filteredTimezones = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return timezones;
        return timezones.filter(tz => tz.toLowerCase().includes(query));
    }, [searchQuery, timezones]);

    const handleSave = async () => {
        if (selectedTz === currentTimezone) return;
        setSaving(true);
        try {
            const res = await fetchWithRetry(API_ENDPOINTS.SETTINGS, withApiCredentials({
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders(session)
                },
                body: JSON.stringify({ timezone: selectedTz })
            }));

            if (!res.ok) {
                showToast(t.settings.toasts.settingsError, 'error');
                return;
            }

            showToast(t.settings.toasts.settingsSaved, 'success');
            onSettingsChanged();
        } catch {
            showToast(t.settings.toasts.networkError, 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            {/* Timezone */}
            <SettingsRow
                title={tz.label}
                icon={Globe}
                description={
                    <span id="settings-timezone-label">
                        {tz.description}
                    </span>
                }
                control={
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                            <Dropdown className="relative w-full sm:w-auto">
                                <DropdownTrigger
                                    aria-labelledby="settings-timezone-label"
                                    className="flex w-full min-w-[200px] items-center justify-between gap-2 rounded-lg border border-border-subtle bg-bg-secondary px-3 py-2 text-sm font-medium text-text-main transition hover:border-primary/50 focus:border-primary/50 focus:outline-none sm:w-auto"
                                >
                                    <span className="truncate max-w-[180px] text-left">{selectedTz}</span>
                                    <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
                                </DropdownTrigger>
                                <DropdownPanel
                                    align="right"
                                    zIndex={1000}
                                    widthClassName="w-full sm:w-[280px]"
                                    className="p-1"
                                >
                                    <div className="shrink-0 border-b border-border-subtle px-2 pb-2 pt-2">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" aria-hidden="true" />
                                            <input
                                                type="text"
                                                placeholder={tz.searchPlaceholder}
                                                aria-label={tz.searchAriaLabel}
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full rounded-md border border-border-subtle bg-bg-secondary py-1.5 pl-8 pr-3 text-xs text-text-main placeholder:text-text-muted focus:border-primary/50 focus:outline-none"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    </div>
                                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 py-1">
                                        {filteredTimezones.length === 0 ? (
                                            <div className="py-4 text-center text-xs text-text-muted">{tz.noResults}</div>
                                        ) : (
                                            filteredTimezones.map(zone => (
                                                <DropdownItem
                                                    key={zone}
                                                    onClick={() => {
                                                        setSelectedTz(zone);
                                                        setSearchQuery('');
                                                    }}
                                                    className={`mb-0.5 rounded-md px-2.5 py-1.5 ${
                                                        selectedTz === zone ? 'bg-primary/10 text-brand-text font-semibold' : ''
                                                    }`}
                                                >
                                                    <div className="flex w-full items-center justify-between">
                                                        <span className="truncate">{zone.replace(/_/g, ' ')}</span>
                                                        {selectedTz === zone && <Check className="h-3.5 w-3.5 text-brand-text" />}
                                                    </div>
                                                </DropdownItem>
                                            ))
                                        )}
                                    </div>
                                </DropdownPanel>
                            </Dropdown>
                            <button 
                                disabled={saving || selectedTz === currentTimezone}
                                onClick={() => void handleSave()}
                                className={`${btnPrimary} !mt-0 py-2 px-5 text-sm font-semibold w-full sm:w-auto ${
                                    selectedTz === currentTimezone ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                {saving ? tz.saving : tz.save}
                            </button>
                    </div>
                }
            />

            {/* Language */}
            <SettingsRow
                title={t.settings.preferences.language.label}
                icon={Languages}
                description={
                    <span id="settings-language-label">
                        {t.settings.preferences.language.description}
                    </span>
                }
                control={
                    <div className="flex w-full sm:w-auto">
                        <Dropdown className="relative w-full sm:w-auto">
                            <DropdownTrigger
                                aria-labelledby="settings-language-label"
                                className="flex w-full min-w-[200px] items-center justify-between gap-2 rounded-lg border border-border-subtle bg-bg-secondary px-3 py-2 text-sm font-medium text-text-main transition hover:border-primary/50 sm:w-auto"
                            >
                                <span className="truncate max-w-[180px] text-left">
                                    {LOCALE_OPTIONS.find(opt => opt.value === locale)?.label || 'Español'}
                                </span>
                                <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
                            </DropdownTrigger>
                            <DropdownPanel
                                align="right"
                                zIndex={1000}
                                widthClassName="w-full sm:w-[200px]"
                                className="flex flex-col p-1"
                            >
                                <div className="max-h-[240px] overflow-y-auto px-1 py-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar]:w-1.5">
                                    {LOCALE_OPTIONS.map((opt) => (
                                        <DropdownItem
                                            key={opt.value}
                                            onClick={() => {
                                                setLocale(opt.value);
                                                showToast(t.settings.toasts.settingsSaved, 'success');
                                            }}
                                            className={`mb-0.5 rounded-md px-2.5 py-1.5 ${
                                                locale === opt.value ? 'bg-primary/10 text-brand-text font-semibold' : ''
                                            }`}
                                        >
                                            <div className="flex w-full items-center justify-between">
                                                <span className="truncate">{opt.label}</span>
                                                {locale === opt.value && <Check className="h-3.5 w-3.5 text-brand-text" />}
                                            </div>
                                        </DropdownItem>
                                    ))}
                                </div>
                            </DropdownPanel>
                        </Dropdown>
                    </div>
                }
            />

            <SettingsRow
                title={t.settings.preferences.theme?.label || "Tema Visual"}
                icon={Palette}
                description={
                    <span id="settings-theme-label">
                        {t.settings.preferences.theme?.description || "Elige entre Oscuro, Claro, Liga, Minimal o Neo Matrix."}
                    </span>
                }
                control={
                    <div className="flex w-full sm:w-auto">
                        <Dropdown className="relative w-full sm:w-auto">
                            <DropdownTrigger
                                aria-labelledby="settings-theme-label"
                                className="flex w-full min-w-[200px] items-center justify-between gap-2 rounded-lg border border-border-subtle bg-bg-secondary px-3 py-2 text-sm font-medium text-text-main transition hover:border-primary/50 focus:border-primary/50 focus:outline-none sm:w-auto"
                            >
                                <span className="flex items-center gap-2 truncate max-w-[180px] text-left">
                                    <span
                                        className="h-2.5 w-2.5 shrink-0 rounded-full border border-white/20 shadow-sm"
                                        style={{ backgroundColor: THEME_DEFINITIONS[theme]?.accentColor ?? '#9146ff' }}
                                        aria-hidden="true"
                                    />
                                    <span className="truncate">{t.settings.preferences.theme?.options[theme] ?? theme}</span>
                                </span>
                                <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
                            </DropdownTrigger>
                            <DropdownPanel
                                align="right"
                                zIndex={1000}
                                widthClassName="w-full sm:w-[200px]"
                                className="flex flex-col p-1"
                            >
                                <div className="max-h-[240px] overflow-y-auto px-1 py-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar]:w-1.5">
                                    {SUPPORTED_THEMES.map((opt) => (
                                        <DropdownItem
                                            key={opt}
                                            onClick={() => {
                                                setTheme(opt);
                                                showToast(t.settings.toasts.settingsSaved, 'success');
                                            }}
                                            className={`mb-0.5 rounded-md px-2.5 py-1.5 ${
                                                theme === opt ? 'bg-primary/10 text-brand-text font-semibold' : ''
                                            }`}
                                        >
                                            <div className="flex w-full items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 truncate">
                                                    <span
                                                        className="h-2.5 w-2.5 shrink-0 rounded-full border border-white/20 shadow-sm"
                                                        style={{ backgroundColor: THEME_DEFINITIONS[opt].accentColor }}
                                                        aria-hidden="true"
                                                    />
                                                    <span className="truncate">{t.settings.preferences.theme?.options[opt] ?? opt}</span>
                                                </div>
                                                {theme === opt && <Check className="h-3.5 w-3.5 text-brand-text shrink-0" />}
                                            </div>
                                        </DropdownItem>
                                    ))}
                                </div>
                            </DropdownPanel>
                        </Dropdown>
                    </div>
                }
            />
        </>
    );
}
