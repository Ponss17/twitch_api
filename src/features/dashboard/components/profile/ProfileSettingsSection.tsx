import { Settings, Globe, Search, ChevronDown, Check } from 'lucide-react';
import { useState, useMemo } from 'react';
import { card, fadeIn, btnPrimary } from '@/core/ui/tw';
import { Dropdown, DropdownTrigger, DropdownPanel, DropdownItem } from '@/shared/ui/Dropdown';
import { API_ENDPOINTS } from '@/core/config/config';
import { authHeaders } from '@/core/api/auth';
import { fetchWithRetry } from '@/core/api/fetchWithRetry';
import { useRequiredSession } from '@/core/session/useSession';
import { useToast } from '@/shared/ui/ToastProvider';

interface ProfileSettingsSectionProps {
    currentTimezone: string;
    onSettingsChanged: () => void;
}

const cardShell = `${card} ${fadeIn} mb-3 opacity-0`;

export function ProfileSettingsSection({ currentTimezone, onSettingsChanged }: ProfileSettingsSectionProps) {
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

    const filteredTimezones = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return timezones;
        return timezones.filter(tz => tz.toLowerCase().includes(query));
    }, [searchQuery, timezones]);

    const handleSave = async () => {
        if (selectedTz === currentTimezone) return;
        setSaving(true);
        try {
            const res = await fetchWithRetry(API_ENDPOINTS.SETTINGS, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders(session)
                },
                body: JSON.stringify({ timezone: selectedTz })
            });

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
        <div className={`${cardShell} relative z-10 [animation-delay:80ms]`}>
            <div className="mb-2 flex items-center justify-between gap-3 border-b border-white/[0.08] pb-2">
                <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-[0.9rem] text-primary">
                        <Settings className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="mb-0.5 text-[0.95rem] font-bold">Ajustes del Perfil</h3>
                        <p className="text-[0.8rem] text-[#c4c4cc]">
                            Personaliza las preferencias de tu cuenta
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4 rounded-xl border border-white/[0.08] bg-black/20 p-4 pl-5 transition-colors hover:bg-black/30">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                        <h4 className="mb-1 text-[1.05rem] font-bold text-white flex items-center gap-2">
                            <Globe className="w-4 h-4 text-primary" />
                            Zona Horaria
                        </h4>
                        <p className="text-[0.85rem] text-[#c4c4cc]">
                            Tu zona horaria se utiliza para agrupar y mostrar correctamente los días en tus estadísticas y reportes.
                        </p>
                    </div>
                    
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                        <Dropdown className="relative w-full sm:w-auto">
                            <DropdownTrigger className="flex w-full min-w-[220px] items-center justify-between gap-2 rounded-lg border border-white/[0.08] bg-[#18181b] px-3 py-2 text-sm font-medium text-[#fafafa] transition hover:border-primary/50 hover:bg-white/[0.04] sm:w-auto">
                                <span className="truncate max-w-[180px] text-left">{selectedTz}</span>
                                <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
                            </DropdownTrigger>
                            <DropdownPanel align="right" widthClassName="w-full sm:w-[280px]" className="z-[1000] flex flex-col p-1">
                                <div className="px-2 pb-2 pt-2">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                                        <input
                                            type="text"
                                            placeholder="Buscar zona horaria..."
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
                </div>
            </div>
        </div>
    );
}
