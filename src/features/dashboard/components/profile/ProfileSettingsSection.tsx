import { Settings, Globe } from 'lucide-react';
import { useState } from 'react';
import { card, fadeIn, btnPrimary } from '@/core/ui/tw';
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
        <div className={`${cardShell} [animation-delay:80ms]`}>
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/[0.08] pb-2">
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

            <div className="space-y-4">
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm font-medium text-zinc-300">Zona Horaria</span>
                    </div>
                    
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                        <select 
                            value={selectedTz}
                            onChange={(e) => setSelectedTz(e.target.value)}
                            className="w-full min-w-[200px] rounded-lg border border-white/[0.08] bg-[#18181b] px-3 py-1.5 text-sm text-[#fafafa] outline-none transition-colors focus:border-primary/50 focus:bg-bg-tertiary sm:w-auto"
                        >
                            {timezones.map(tz => (
                                <option key={tz} value={tz}>{tz}</option>
                            ))}
                        </select>
                        <button 
                            disabled={saving || selectedTz === currentTimezone}
                            onClick={() => void handleSave()}
                            className={`${btnPrimary} py-1.5 px-3 text-xs w-full sm:w-auto ${
                                selectedTz === currentTimezone ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </div>
                
                <p className="text-xs text-zinc-500">
                    Tu zona horaria se utiliza para agrupar y mostrar correctamente los días en tus estadísticas y reportes.
                </p>
            </div>
        </div>
    );
}
