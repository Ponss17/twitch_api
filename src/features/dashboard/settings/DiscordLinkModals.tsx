import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Unlink, XCircle } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { btnDanger, btnPrimary, btnSecondary } from '@/core/utils/tw';
import { DiscordIcon } from '@/shared/ui/icons/BrandIcons';

interface DiscordLinkConfirmModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

/** Aviso antes de ir a Discord OAuth. */
export function DiscordLinkConfirmModal({ open, onClose, onConfirm }: DiscordLinkConfirmModalProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Vincular Discord"
            titleIconNode={<DiscordIcon className="h-5 w-5 text-[#5865F2]" />}
            footer={
                <>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#5865F2] px-3 py-2 text-[0.8125rem] font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-110"
                    >
                        <DiscordIcon className="h-4 w-4" />
                        Continuar con Discord
                    </button>
                    <button type="button" className={btnSecondary} onClick={onClose}>
                        Cancelar
                    </button>
                </>
            }
        >
            <p>
                Te llevaremos a Discord para autorizar la conexión. Solo pedimos el permiso{' '}
                <strong>identify</strong>.
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[0.9rem] text-[#c4c4cc]">
                <li>
                    Guardamos tu <strong>ID de Discord</strong> (imprescindible).
                </li>
                <li>
                    Username y avatar se guardan solo como <strong>caché para el panel</strong>.
                </li>
                <li>
                    <strong>No</strong> guardamos email, servidores, mensajes ni el token de Discord.
                </li>
            </ul>
            <p className="mt-3 text-sm opacity-80">
                El login del panel sigue siendo Twitch. Discord solo se adjunta a tu cuenta.
            </p>
        </Modal>
    );
}

interface DiscordUnlinkConfirmModalProps {
    open: boolean;
    busy?: boolean;
    username?: string | null;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
}

/** Confirmación antes de desvincular. */
export function DiscordUnlinkConfirmModal({
    open,
    busy = false,
    username,
    onClose,
    onConfirm
}: DiscordUnlinkConfirmModalProps) {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const disabled = loading || busy;

    return (
        <Modal
            open={open}
            onClose={disabled ? () => {} : onClose}
            title="¿Desvincular Discord?"
            titleIcon={AlertTriangle}
            closeOnBackdrop={!disabled}
            footer={
                <>
                    <button
                        type="button"
                        className={btnDanger}
                        disabled={disabled}
                        onClick={() => void handleConfirm()}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" />
                                Desvinculando...
                            </>
                        ) : (
                            <>
                                <Unlink className="w-4 h-4" />
                                Sí, desvincular
                            </>
                        )}
                    </button>
                    <button type="button" className={btnSecondary} disabled={disabled} onClick={onClose}>
                        Cancelar
                    </button>
                </>
            }
        >
            <p>
                {username ? (
                    <>
                        Se quitará el vínculo con <strong>@{username}</strong>.
                    </>
                ) : (
                    <>Se quitará el vínculo de Discord de tu cuenta.</>
                )}
            </p>
            <p className="mt-2">
                El bot dejará de reconocerte hasta que vuelvas a vincular. Tu cuenta Twitch y API Key no
                se afectan.
            </p>
        </Modal>
    );
}

export type DiscordResultKind = 'linked' | 'unlinked' | 'error_taken' | 'error_auth' | 'error_config' | 'error';

interface DiscordResultModalProps {
    open: boolean;
    kind: DiscordResultKind | null;
    onClose: () => void;
}

const RESULT_COPY: Record<
    DiscordResultKind,
    { title: string; body: string; ok: boolean }
> = {
    linked: {
        title: 'Discord vinculado',
        body: 'Tu cuenta de Discord quedó conectada. Ya puedes usar el bot con tu perfil de LosPerris.',
        ok: true
    },
    unlinked: {
        title: 'Discord desvinculado',
        body: 'Se eliminó el vínculo. Puedes volver a conectar Discord cuando quieras.',
        ok: true
    },
    error_taken: {
        title: 'Discord ya en uso',
        body: 'Esa cuenta de Discord ya está vinculada a otro usuario de LosPerris.',
        ok: false
    },
    error_auth: {
        title: 'Sesión requerida',
        body: 'Debes iniciar sesión con Twitch para vincular Discord.',
        ok: false
    },
    error_config: {
        title: 'Discord no configurado',
        body: 'OAuth de Discord aún no está listo en el servidor. Intenta más tarde.',
        ok: false
    },
    error: {
        title: 'No se pudo vincular',
        body: 'Algo falló al conectar Discord. Cierra e inténtalo de nuevo.',
        ok: false
    }
};

/** Resultado tras OAuth o desvincular (más claro que solo un toast). */
export function DiscordResultModal({ open, kind, onClose }: DiscordResultModalProps) {
    const copy = kind ? RESULT_COPY[kind] : RESULT_COPY.error;
    const useDiscordBrand = kind === 'linked' || kind === 'unlinked';

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={copy.title}
            titleIcon={copy.ok ? CheckCircle2 : XCircle}
            titleIconNode={
                useDiscordBrand ? <DiscordIcon className="h-5 w-5 text-[#5865F2]" /> : undefined
            }
            footer={
                <button type="button" className={btnPrimary} onClick={onClose}>
                    Entendido
                </button>
            }
        >
            <p>{copy.body}</p>
        </Modal>
    );
}
