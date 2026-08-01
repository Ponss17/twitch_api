import { Layers } from 'lucide-react';
import { useState } from 'react';
import { OverlaySetupModal } from '@/features/overlay/components/OverlaySetupModal';
import type { OverlayTool } from '@/features/overlay/lib/types';
import { hoverSubtleBorderedRow } from '@/core/utils/tw';
import { useTranslation } from '@/core/i18n/I18nContext';

export function OverlayUrlButton({ tool }: { tool: OverlayTool }) {
    const [open, setOpen] = useState(false);
    const { t } = useTranslation();
    const bT = t.overlay.button;

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                title={bT.title}
                aria-label={bT.aria}
                className={`inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[0.75rem] font-semibold text-[#c4c4cc] ${hoverSubtleBorderedRow}`}
            >
                <Layers className="size-3.5 shrink-0" aria-hidden />
                {bT.label}
            </button>
            <OverlaySetupModal open={open} onClose={() => setOpen(false)} tool={tool} />
        </>
    );
}
