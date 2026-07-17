import { Globe, Search, ChevronDown, Check } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { btnPrimary } from '@/core/utils/tw';
import { Dropdown, DropdownTrigger, DropdownPanel, DropdownItem } from '@/shared/ui/Dropdown';
import { API_ENDPOINTS } from '@/core/config/config';
import { authHeaders, withApiCredentials } from '@/core/api/auth';
import { fetchWithRetry } from '@/core/api/fetchWithRetry';
import { useRequiredSession } from '@/core/session/useSession';
import { useToast } from '@/shared/ui/ToastProvider';
import { SettingsRow } from '@/features/dashboard/settings/SettingsGroup';

interface SettingsPreferencesSectionProps {
    currentTimezone: string;
    onSettingsChanged: () => void;
}

export function SettingsPreferencesSection({ currentTimezone, onSettingsChanged }: SettingsPreferencesSectionProps) {
    const session = useRequiredSession();
    const { showToast } = useToast();
    const [saving, setSaving] = useState(false);
    
    // We get all supported timezones from the browser
    const [timezones] = useState(() => {
        try {
            return Intl.supportedValuesOf('timeZone');
        } catch {
            return [currentTimezone || 'UTC'];
        }
    });

    const [selectedTz, setSelectedTz] = useState(currentTimezone || 'UTC');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (currentTimezone) {
            setSelectedTz(currentTimezone);
        }
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
                showToast('Error al guardar los ajustes.', 'error');
                return;
            }

            showToast('Ajustes guardados correctamente.', 'success');
            onSettingsChanged();
        } catch {
            showToast('Error de red al guardar los ajustes.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SettingsRow
            title="Zona Horaria"
            icon={Globe}
            description={
                <span id="settings-timezone-label">
                    Tu zona horaria se utiliza para agrupar y mostrar correctamente los días en tus estadísticas y reportes.
                </span>
            }
            control={
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                        <Dropdown className="relative w-full sm:w-auto">
                            <DropdownTrigger
                                aria-labelledby="settings-timezone-label"
                                className="flex w-full min-w-[200px] items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-bg-main px-3 py-2 text-sm font-medium text-[#fafafa] transition hover:border-primary/50 sm:w-auto"
                            >
                                <span className="truncate max-w-[180px] text-left">{selectedTz}</span>
                                <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
                            </DropdownTrigger>
                            <DropdownPanel
                                align="right"
                                placement="top"
                                zIndex={1000}
                                widthClassName="w-full sm:w-[280px]"
                                className="flex flex-col p-1"
                            >
                                <div className="px-2 pb-2 pt-2">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
                                        <input
                                            type="text"
                                            placeholder="Buscar zona horaria..."
                                            aria-label="Buscar zona horaria"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full rounded-md border border-white/10 bg-black/40 py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-zinc-500 focus:border-primary/50 focus:outline-none"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </div>
                                <div className="max-h-[240px] overflow-y-auto px-1 pb-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar]:w-1.5">
                                    {filteredTimezones.length === 0 ? (
                                        <div className="py-4 text-center text-xs text-zinc-500">No se encontraron resultados</div>
                                    ) : (
                                        filteredTimezones.map(tz => (
                                            <DropdownItem
                                                key={tz}
                                                onClick={() => {
                                                    setSelectedTz(tz);
                                                    setSearchQuery('');
                                                }}
                                                className={`mb-0.5 rounded-md px-2.5 py-1.5 ${
                                                    selectedTz === tz ? 'bg-primary/20 text-white' : ''
                                                }`}
                                            >
                                                <div className="flex w-full items-center justify-between">
                                                    <span className="truncate">{tz.replace(/_/g, ' ')}</span>
                                                    {selectedTz === tz && <Check className="h-3.5 w-3.5 text-primary" />}
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
                            {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                </div>
            }
        />
    );
}
