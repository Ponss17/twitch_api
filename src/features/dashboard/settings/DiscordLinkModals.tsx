import { useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, Loader2, Unlink, XCircle } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { btnDanger, btnSecondary, modalBtnPrimary } from '@/core/utils/tw';
import { DiscordIcon } from '@/shared/ui/icons/BrandIcons';

interface DiscordLinkConfirmModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

/** Aviso antes de ir a Discord OAuth — mismo tono que el modal de login. */
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
                        <DiscordIcon className="h-4 w-4" aria-hidden="true" />
                        Continuar con Discord
                    </button>
                    <button type="button" className={btnSecondary} onClick={onClose}>
                        Cancelar
                    </button>
                </>
            }
        >
            <p>
                Vincula tu Discord para usar los comandos del bot en nuestro servidor con tu cuenta de{' '}
                <strong>LosPerris</strong>.
            </p>
            <p>Al conectar, solo asociamos tu identidad de Discord para:</p>
            <ul>
                <li>
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#5865F2]" aria-hidden="true" />
                    Reconocerte en el servidor del bot.
                </li>
                <li>
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#5865F2]" aria-hidden="true" />
                    Activar comandos ligados a tu cuenta de LosPerris.
                </li>
                <li>
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#5865F2]" aria-hidden="true" />
                    Mostrar tu Discord en el perfil del panel.
                </li>
            </ul>
            <p className="text-sm opacity-80">
                No leemos mensajes ni accedemos a tus servidores. El acceso al panel sigue siendo con
                Twitch; Discord solo queda vinculado a tu perfil.
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
                                <Loader2 className="animate-spin" aria-hidden="true" />
                                Desvinculando...
                            </>
                        ) : (
                            <>
                                <Unlink className="h-4 w-4" aria-hidden="true" />
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
            <p>Qué cambia y qué no:</p>
            <ul>
                <li>
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    Dejas de usar los comandos del bot en Discord hasta volver a vincular.
                </li>
                <li>
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    Tu sesión de Twitch, API Key y panel <strong>no se ven afectados</strong>.
                </li>
                <li>
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    Puedes volver a conectar Discord cuando quieras.
                </li>
            </ul>
            <p className="text-sm opacity-80">Esta acción solo afecta al vínculo de Discord.</p>
        </Modal>
    );
}

export type DiscordResultKind =
    | 'linked'
    | 'unlinked'
    | 'error_taken'
    | 'error_auth'
    | 'error_config'
    | 'error';

interface DiscordResultModalProps {
    open: boolean;
    kind: DiscordResultKind | null;
    onClose: () => void;
}

type ResultCopy = {
    title: string;
    lead: string;
    points: string[];
    hint?: string;
    ok: boolean;
};

const RESULT_COPY: Record<DiscordResultKind, ResultCopy> = {
    linked: {
        title: 'Discord vinculado',
        lead: 'Tu cuenta de Discord ya está asociada a LosPerris.',
        points: [
            'Puedes usar `/cuenta`, `/limite`, `/status` y `/ayuda` en el servidor.',
            'Para una ayuda más personalizada, abre un ticket en Discord.',
            'El vínculo aparece en Ajustes → Conexiones.',
            'El panel sigue autenticándose solo con Twitch.'
        ],
        hint: 'Si no ves el estado actualizado, cierra este aviso: el perfil se refresca solo.',
        ok: true
    },
    unlinked: {
        title: 'Discord desvinculado',
        lead: 'Se quitó el vínculo de Discord de tu cuenta.',
        points: [
            'Los comandos del bot en Discord dejan de estar asociados a ti.',
            'Tu sesión de Twitch y tu API Key siguen igual.',
            'Puedes volver a vincular cuando quieras desde Ajustes.'
        ],
        ok: true
    },
    error_taken: {
        title: 'Discord ya en uso',
        lead: 'Esa cuenta de Discord ya está vinculada a otro usuario de LosPerris.',
        points: [
            'Usa otra cuenta de Discord, o desvincula la anterior primero.',
            'Si crees que es un error, pide ayuda en el servidor o a Ponss.'
        ],
        ok: false
    },
    error_auth: {
        title: 'Sesión requerida',
        lead: 'Debes iniciar sesión con Twitch para vincular Discord.',
        points: [
            'Cierra este aviso e inicia sesión de nuevo.',
            'Luego vuelve a Ajustes → Conexiones y pulsa Vincular Discord.'
        ],
        ok: false
    },
    error_config: {
        title: 'Discord no disponible',
        lead: 'La vinculación con Discord no está disponible ahora.',
        points: ['Inténtalo más tarde.', 'Si sigue fallando, avisa en el servidor de Discord.'],
        ok: false
    },
    error: {
        title: 'No se pudo vincular',
        lead: 'Algo falló al conectar Discord.',
        points: [
            'Cierra este aviso e inténtalo otra vez.',
            'Si el error se repite, revisa que tu sesión de Twitch siga activa.'
        ],
        ok: false
    }
};

/** Resultado tras OAuth o desvincular — estructura tipo modal de login. */
export function DiscordResultModal({ open, kind, onClose }: DiscordResultModalProps) {
    const copy = kind ? RESULT_COPY[kind] : RESULT_COPY.error;
    const useDiscordBrand = kind === 'linked' || kind === 'unlinked';
    const PointIcon = copy.ok ? Check : XCircle;
    const pointIconClass = copy.ok
        ? 'mt-0.5 h-4 w-4 shrink-0 text-[#5865F2]'
        : 'mt-0.5 h-4 w-4 shrink-0 text-error';

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
                <button
                    type="button"
                    className={modalBtnPrimary}
                    data-modal-primary
                    onClick={onClose}
                >
                    {copy.ok ? (
                        <>
                            <Check className="h-4 w-4" aria-hidden="true" />
                            Entendido
                        </>
                    ) : (
                        'Cerrar'
                    )}
                </button>
            }
        >
            <p>{copy.lead}</p>
            <ul>
                {copy.points.map((point) => (
                    <li key={point}>
                        <PointIcon className={pointIconClass} aria-hidden="true" />
                        {point}
                    </li>
                ))}
            </ul>
            {copy.hint ? <p className="text-sm opacity-80">{copy.hint}</p> : null}
        </Modal>
    );
}
