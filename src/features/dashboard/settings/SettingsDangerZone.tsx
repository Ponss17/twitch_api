import { forwardRef } from 'react';
import { AlertTriangle, Trash2, RotateCcw } from 'lucide-react';
import { SettingsGroup, SettingsRow } from '@/features/dashboard/settings/SettingsGroup';

interface SettingsDangerZoneProps {
    visible: boolean;
    onClearData: () => void;
    onDeleteAccount: () => void;
}

export const SettingsDangerZone = forwardRef<HTMLDivElement, SettingsDangerZoneProps>(
    function SettingsDangerZone({ visible, onClearData, onDeleteAccount }, ref) {
        if (!visible) return null;

        return (
            <SettingsGroup
                ref={ref}
                title="Zona de Peligro"
                description="Acciones irreversibles — procede con precaución"
                accent="error"
                delay={240}
            >
                <SettingsRow
                    icon={RotateCcw}
                    accent="error"
                    iconAccent="error"
                    title="Reiniciar Estadísticas"
                    description="Borra todo el historial de comandos, clips, latencia y gráficas de analytics. Tu API Key seguirá activa."
                    control={
                        <button
                            type="button"
                            onClick={onClearData}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-error/20 bg-error/[0.06] px-5 py-2 text-sm font-bold text-error transition hover:border-error/40 hover:bg-error/[0.14] sm:w-auto"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Limpiar Datos
                        </button>
                    }
                />
                <SettingsRow
                    icon={AlertTriangle}
                    accent="error"
                    iconAccent="error"
                    title="Eliminar Cuenta"
                    description={
                        <>
                            Borra permanentemente tu perfil y todos los datos asociados.{' '}
                            <strong className="text-error/80">Esta acción es irreversible.</strong>
                        </>
                    }
                    control={
                        <button
                            type="button"
                            onClick={onDeleteAccount}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-error/80 px-5 py-2 text-sm font-bold text-white transition hover:bg-error sm:w-auto"
                        >
                            <Trash2 className="h-4 w-4" />
                            Eliminar Cuenta
                        </button>
                    }
                />
            </SettingsGroup>
        );
    }
);
