import { useEffect, useState } from 'react';
import { startTwitchLogin } from '@/core/api/auth';
import { legalPath } from '@/core/config/paths';
import { btnSecondary, modalBtnPrimary } from '@/core/utils/tw';
import { Modal } from '@/shared/ui/Modal';
import { Loader2, Check, Shield } from 'lucide-react';
import { TwitchIcon } from '@/shared/ui/icons/BrandIcons';


interface LoginDisclaimerModalProps {
    open: boolean;
    onClose: () => void;
}

export function LoginDisclaimerModal({ open, onClose }: LoginDisclaimerModalProps) {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) setLoading(false);
    }, [open]);

    const handleConfirm = () => {
        setLoading(true);
        startTwitchLogin();
    };

    return (
        <Modal
            open={open}
            onClose={() => { if (!loading) onClose(); }}
            title="Aviso de Privacidad"
            titleIcon={Shield}
            closeOnBackdrop={!loading}
            footer={
                <>
                    <button type="button" className={btnSecondary} disabled={loading} onClick={onClose}>
                        Cancelar
                    </button>
                    <button type="button" className={modalBtnPrimary} disabled={loading} onClick={handleConfirm}>
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" />
                                Validando datos...
                            </>
                        ) : (
                            <>
                                <TwitchIcon className="w-5" aria-hidden="true" />
                                Aceptar y Conectar
                            </>
                        )}
                    </button>
                </>
            }
        >
            <p>
                Para que los comandos funcionen correctamente, necesitamos acceder a cierta{' '}
                <strong>información pública</strong> de tu canal (como tu nombre de usuario, estado del
                stream, etc.).
            </p>
            <p>Al conectar tu cuenta, aceptas que usemos estos datos únicamente para:</p>
            <ul>
                <li>
                    <Check className="w-4 h-4" />
                    Verificar tu identidad.
                </li>
                <li>
                    <Check className="w-4 h-4" />
                    Ejecutar los comandos que configures.
                </li>
                <li>
                    <Check className="w-4 h-4" />
                    Generar estadísticas de uso (anonimizadas).
                </li>
            </ul>
            <p className="text-sm opacity-80">
                No almacenamos contraseñas ni tenemos acceso a acciones críticas como borrar clips o banear
                usuarios sin tu permiso explícito.
            </p>
            <p className="text-sm">
                <a
                    href={legalPath('privacidad')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary underline underline-offset-2"
                >
                    Leer política de privacidad completa
                </a>
                {' · '}
                <a
                    href={legalPath('terminos')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2"
                >
                    Términos de uso
                </a>
            </p>
        </Modal>
    );
}
