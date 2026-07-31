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
            <ul className="space-y-2 my-4">
                <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#9146ff] shrink-0 mt-1" />
                    Verificar tu identidad.
                </li>
                <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#9146ff] shrink-0 mt-1" />
                    Ejecutar los comandos que configures.
                </li>
                <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#9146ff] shrink-0 mt-1" />
                    Generar estadísticas de uso (anonimizadas).
                </li>
            </ul>
            <p className="text-sm opacity-80">
                Solo realizaremos acciones de moderación (como timeouts en minijuegos) o interactuaremos con tu canal si tú configuras y activas esos comandos explícitamente. No almacenamos tus contraseñas.
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
