import { Layers } from 'lucide-react';
import { useState } from 'react';
import { OverlaySetupModal } from '@/features/overlay/components/OverlaySetupModal';
import type { OverlayTool } from '@/features/overlay/lib/types';
import { hoverSubtleBorderedRow } from '@/core/utils/tw';
import { useTranslation } from '@/core/i18n/I18nContext';

export function OverlayUrlButton({
    tool,
    compact = false
}: {
    tool: OverlayTool;
    compact?: boolean;
}) {
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
                className={
                    compact
                        ? `inline-flex h-8 items-center gap-1.5 rounded-lg border border-border-subtle bg-transparent px-2 text-[0.75rem] font-semibold text-text-muted ${hoverSubtleBorderedRow}`
                        : `inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-transparent px-2.5 py-1.5 text-[0.75rem] font-semibold text-text-muted ${hoverSubtleBorderedRow}`
                }
            >
                <Layers className="size-3.5 shrink-0" aria-hidden />
                <span className={compact ? 'hidden sm:inline' : undefined}>{bT.label}</span>
            </button>
            <OverlaySetupModal open={open} onClose={() => setOpen(false)} tool={tool} />
        </>
    );
}
