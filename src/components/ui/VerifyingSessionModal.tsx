import { useEffect, useRef } from 'react';
import { dialogBase, modalBody, modalPanel } from '@/lib/tw';
import { AppLogo } from '@/components/ui/AppLogo';

interface VerifyingSessionModalProps {
    open: boolean;
}

export function VerifyingSessionModal({ open }: VerifyingSessionModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        else if (!open && dialog.open) dialog.close();
    }, [open]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const onCancel = (e: Event) => e.preventDefault();
        dialog.addEventListener('cancel', onCancel);
        return () => dialog.removeEventListener('cancel', onCancel);
    }, []);

    return (
        <dialog ref={dialogRef} className={`${dialogBase} overflow-hidden outline-none`}>
            {/* Contenedor estilo tarjeta de Landing */}
            <div className={`${modalPanel} text-center outline-none !border-[#9146ff]/40`}>
                <div className={`${modalBody} flex flex-col items-center justify-center py-10 px-8`}>
                    
                    <div className="mb-6 flex items-center justify-center">
                        <AppLogo 
                            alt="Loading" 
                            className="h-20 w-20 object-contain rounded-2xl" 
                            draggable={false} 
                        />
                    </div>
                    
                    <h3 className="mb-2 text-[1.3rem] font-bold text-white tracking-tight">
                        Verificando sesión...
                    </h3>
                    
                    <p className="mx-auto max-w-[260px] text-[0.9rem] leading-relaxed text-[#a1a1aa]">
                        Espera un momento, estamos validando tus datos con Twitch.
                    </p>
                    
                    <div className="mt-8 text-[#9146ff]">
                        <i className="fa-solid fa-circle-notch fa-spin text-3xl" />
                    </div>

                </div>
            </div>
        </dialog>
    );
}
