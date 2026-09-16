import { Modal, ModalCloseButton } from '@/shared/ui/modals/Modal';
import { modalBtnSecondary } from '@/core/utils/tw';
import { useTranslation } from '@/core/i18n/I18nContext';
import { Archive, BarChart3, CalendarClock, ShieldCheck } from 'lucide-react';

interface ReportsHowItWorksModalProps {
    open: boolean;
    onClose: () => void;
}

const STEPS = [
    { key: 'archive', icon: Archive },
    { key: 'timing', icon: CalendarClock },
    { key: 'reset', icon: ShieldCheck },
    { key: 'analytics', icon: BarChart3 }
] as const;

export function ReportsHowItWorksModal({ open, onClose }: ReportsHowItWorksModalProps) {
    const { t } = useTranslation();
    const rT = t.reports;
    const steps = rT.howItWorksSteps;

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={rT.howItWorks}
            footer={
                <ModalCloseButton className={modalBtnSecondary}>{rT.howItWorksClose}</ModalCloseButton>
            }
        >
            <p className="mb-4 text-[0.8125rem] leading-relaxed text-text-muted">{rT.howItWorksDesc}</p>
            <ol className="space-y-2.5">
                {STEPS.map(({ key, icon: Icon }) => {
                    const title = steps[`${key}Title` as keyof typeof steps];
                    const body = steps[`${key}Body` as keyof typeof steps];
                    return (
                        <li
                            key={key}
                            className="flex gap-3 rounded-lg border border-border-subtle bg-bg-secondary px-3.5 py-3"
                        >
                            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-bg-card text-brand-text">
                                <Icon className="size-4" aria-hidden />
                            </span>
                            <div className="min-w-0">
                                <p className="text-[0.875rem] font-semibold text-text-main">{title}</p>
                                <p className="mt-1 text-[0.8rem] leading-relaxed text-text-muted">{body}</p>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </Modal>
    );
}
