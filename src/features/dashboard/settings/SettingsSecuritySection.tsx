import { Key, EyeOff, Eye, Check, RotateCw, Copy } from 'lucide-react';
import { useState } from 'react';
import { SettingsRow } from '@/features/dashboard/settings/SettingsGroup';
import { useTranslation } from '@/core/i18n/I18nContext';

interface SettingsSecuritySectionProps {
    apiKey: string;
    keyVisible: boolean;
    keyLoading?: boolean;
    onToggleKey: () => void;
    onCopyKey: () => void;
    onRegenKey: () => void;
}

export function SettingsSecuritySection({
    apiKey,
    keyVisible,
    keyLoading = false,
    onToggleKey,
    onCopyKey,
    onRegenKey
}: SettingsSecuritySectionProps) {
    const { t } = useTranslation();
    const pT = t.settings.panels;
    const [isKeyCopied, setIsKeyCopied] = useState(false);

    const handleCopyKey = () => {
        onCopyKey();
        setIsKeyCopied(true);
        setTimeout(() => setIsKeyCopied(false), 2000);
    };

    return (
        <SettingsRow
            title={pT.apiKeyPrivate}
            icon={Key}
            info={pT.apiKeyInfo}
            description={pT.apiKeyWarning}
        >
            <div className="flex flex-wrap items-stretch gap-2">
                <input
                    id="profile-api-key"
                    readOnly
                    type="text"
                    value={keyVisible ? apiKey : '••••••••••••••••••••••••••••••••'}
                    aria-label={pT.apiKeyPrivate}
                    className="min-w-0 flex-1 rounded-lg border border-border-strong bg-bg-secondary px-3 py-2 font-[Consolas,monospace] text-[0.9rem] text-text-main outline-none transition-colors focus:border-primary focus:bg-primary/[0.02]"
                />
                <div className="flex shrink-0 overflow-hidden rounded-lg border border-border-subtle bg-bg-secondary">
                    <button
                        type="button"
                        onClick={onToggleKey}
                        disabled={keyLoading}
                        title={pT.toggleVisibility}
                        aria-label={pT.toggleVisibility}
                        className="flex items-center justify-center px-3 text-text-muted transition hover:bg-white/[0.02] hover:text-text-main"
                    >
                        {keyVisible ? (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={handleCopyKey}
                        disabled={keyLoading}
                        title={pT.copyKey}
                        aria-label={pT.copyKey}
                        className="flex items-center justify-center gap-1.5 border-l border-border-subtle px-3 text-[0.82rem] text-text-muted transition hover:bg-white/[0.02] hover:text-text-main"
                    >
                        {isKeyCopied ? (
                            <Check className="h-4 w-4" aria-hidden="true" />
                        ) : (
                            <Copy className="h-4 w-4" aria-hidden="true" />
                        )}
                        {isKeyCopied ? t.common.copied : pT.copyKey}
                    </button>
                    <button
                        type="button"
                        onClick={onRegenKey}
                        title={pT.regenKey}
                        aria-label={pT.regenKey}
                        className="flex items-center justify-center border-l border-border-subtle px-3 text-text-muted transition hover:bg-white/[0.02] hover:text-text-main"
                    >
                        <RotateCw className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-[0.75rem] font-medium text-brand-text">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary"></span>
                    </span>
                    {pT.activeKey}
                </span>
                <span className="text-[0.75rem] text-text-muted">
                    {pT.activeKeyDesc}
                </span>
            </div>
        </SettingsRow>
    );
}
