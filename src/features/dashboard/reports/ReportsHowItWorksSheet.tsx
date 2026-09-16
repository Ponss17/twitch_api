import { Sheet } from '@/shared/ui/Sheet';
import { useTranslation } from '@/core/i18n/I18nContext';

interface ReportsHowItWorksSheetProps {
    open: boolean;
    onClose: () => void;
}

export function ReportsHowItWorksSheet({ open, onClose }: ReportsHowItWorksSheetProps) {
    const { t } = useTranslation();
    const rT = t.reports;

    return (
        <Sheet open={open} onClose={onClose} title={rT.howItWorks} description={rT.howItWorksDesc}>
            <div className="space-y-4 text-[0.875rem] leading-relaxed text-text-muted">
                {rT.howItWorksBody.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                ))}
            </div>
        </Sheet>
    );
}
