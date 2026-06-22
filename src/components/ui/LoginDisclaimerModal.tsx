import { useEffect, useRef, useState } from 'react';
import { startTwitchLogin } from '@/lib/auth';
import { appPath } from '@/lib/paths';
import {
    btnIcon,
    modalBtnPrimary,
    btnSecondary,
    dialogBase,
    modalBody,
    modalFooter,
    modalHeader,
    modalPanel,
    modalTitle,
    modalTitleIcon
} from '@/lib/tw';

interface LoginDisclaimerModalProps {
    open: boolean;
    onClose: () => void;
}

export function LoginDisclaimerModal({ open, onClose }: LoginDisclaimerModalProps) {
    const [loading, setLoading] = useState(false);
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        if (!open) setLoading(false);
    }, [open]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        else if (!open && dialog.open) dialog.close();
    }, [open]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const onCancel = (e: Event) => {
            e.preventDefault();
            if (!loading) onClose();
        };
        dialog.addEventListener('cancel', onCancel);
        return () => dialog.removeEventListener('cancel', onCancel);
    }, [loading, onClose]);

    const handleConfirm = () => {
        setLoading(true);
        startTwitchLogin();
    };

    return (
        <dialog
            ref={dialogRef}
            className={dialogBase}
            onClick={(e) => {
                if (e.target === dialogRef.current && !loading) onClose();
            }}
        >
            <div className={modalPanel}>
                <div className={modalHeader}>
                    <h3 className={modalTitle}>
                        <i className={`fa-solid fa-shield-halved ${modalTitleIcon}`} aria-hidden />
                        Aviso de Privacidad
                    </h3>
                    <button
                        type="button"
                        className={btnIcon}
                        aria-label="Cerrar"
                        disabled={loading}
                        onClick={onClose}
                    >
                        <i className="fa-solid fa-xmark" aria-hidden />
                    </button>
                </div>

                <div className={modalBody}>
                    <p>
                        Para que los comandos funcionen correctamente, necesitamos acceder a cierta{' '}
                        <strong>información pública</strong> de tu canal (como tu nombre de usuario, estado del
                        stream, etc.).
                    </p>
                    <p>Al conectar tu cuenta, aceptas que usemos estos datos únicamente para:</p>
                    <ul>
                        <li>
                            <i className="fa-solid fa-check" aria-hidden />
                            Verificar tu identidad.
                        </li>
                        <li>
                            <i className="fa-solid fa-check" aria-hidden />
                            Ejecutar los comandos que configures.
                        </li>
                        <li>
                            <i className="fa-solid fa-check" aria-hidden />
                            Generar estadísticas de uso (anonimizadas).
                        </li>
                    </ul>
                    <p className="text-sm opacity-80">
                        No almacenamos contraseñas ni tenemos acceso a acciones críticas como borrar clips o banear
                        usuarios sin tu permiso explícito.
                    </p>
                    <p className="text-sm">
                        <a
                            href={appPath('/privacidad')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary underline underline-offset-2"
                        >
                            Leer política de privacidad completa
                        </a>
                        {' · '}
                        <a
                            href={appPath('/terminos')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline underline-offset-2"
                        >
                            Términos de uso
                        </a>
                    </p>
                </div>

                <div className={modalFooter}>
                    <button type="button" className={modalBtnPrimary} disabled={loading} onClick={handleConfirm}>
                        {loading ? (
                            <>
                                <i className="fa-solid fa-spinner fa-spin" aria-hidden />
                                Validando datos...
                            </>
                        ) : (
                            <>
                                <i className="fa-brands fa-twitch" aria-hidden />
                                Aceptar y Conectar
                            </>
                        )}
                    </button>
                    <button type="button" className={btnSecondary} disabled={loading} onClick={onClose}>
                        Cancelar
                    </button>
                </div>
            </div>
        </dialog>
    );
}
