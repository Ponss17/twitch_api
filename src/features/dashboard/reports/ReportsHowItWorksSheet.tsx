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
            <div className="space-y-6">
                {rT.howItWorksFaq.map((item) => (
                    <div key={item.q}>
                        <p className="text-[0.9rem] font-semibold text-text-main">{item.q}</p>
                        <p className="mt-1.5 text-[0.875rem] leading-relaxed text-text-muted">{item.a}</p>
                    </div>
                ))}
            </div>
        </Sheet>
    );
}
