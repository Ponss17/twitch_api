import { Edit, Check, Loader2, AlertTriangle, Copy, Play, Bot, FileCode, FlaskConical } from 'lucide-react';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
    btnCopy,
    btnPrimary,
    panelCard,
    codeBox,
    codeTextarea,
    fadeIn,
    formGrid,
    inputLabel,
    responseCard,
    textInput
} from '@/core/utils/tw';
import { SelectFieldRow } from '@/shared/ui/SelectField';
import { API_ENDPOINTS } from '@/core/config/config';
import { buildAuthQueryParam, buildAuthQueryParamForDisplay } from '@/core/api/authQuery';
import { fetchRevealApiKey } from '@/core/api/auth';
import { BOT_OPTIONS } from '@/features/commands/lib/commandGenerator';
import type { CommandConfigItem } from '@/features/commands/lib/config';
import { useRequiredSession } from '@/core/session/useSession';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { useToast } from '@/shared/ui/ToastProvider';
import { IconSm } from '@/shared/ui/Icon';
import { copyText } from '@/core/utils/clipboard';
import { useCommandConfig } from '@/features/commands/hooks/useCommandStore';
import { getCommandConfig } from '@/features/commands/lib/commandStore';
import { subtleIcon } from '@/features/dashboard/lib/subtleAccents';
import { useTranslation } from '@/core/i18n/I18nContext';

function CommandCardHeader({
    icon: Icon,
    title,
    description,
    info
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    info: string;
}) {
    return (
        <header className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3.5">
            <div className="flex min-w-0 items-center gap-3">
                <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${subtleIcon('primary')}`}
                >
                    <Icon className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0">
                    <h2 className="text-[0.9375rem] font-semibold tracking-tight text-text-main">{title}</h2>
                    <p className="mt-0.5 text-[0.75rem] leading-snug text-text-muted">{description}</p>
                </div>
            </div>
            <div className="shrink-0">
                <InfoTooltip text={info} placement="bottom" />
            </div>
        </header>
    );
}

function TemplateVarsHelp({ vars }: { vars: string }) {
    const { t } = useTranslation();
    const text = vars.replace(/^Variables(?:\s+disponibles)?:\s*/i, '').trim();
    const parts = text.split(',').map((v) => v.trim());
    return (
        <small className="mt-0.5 block text-[0.6875rem] leading-snug text-text-muted">
            <strong className="text-text-main">{t.commands.generator.variables}</strong>{' '}
            {parts.map((part, i) => {
                const match = part.match(/\{(\w+)\}/);
                const badge = match ? `{${match[1]}}` : part;
                return (
                    <span key={part}>
                        {i > 0 ? ', ' : ''}
                        <code className="mx-0.5 rounded border border-primary/30 bg-primary/15 px-1 py-px text-[0.8125rem] font-medium text-brand-text">
                            {badge}
                        </code>
                    </span>
                );
            })}
        </small>
    );
}

interface CommandGeneratorCardProps {
    config: CommandConfigItem;
    onExtraValuesChange?: (values: Record<string, string>) => void;
}

export function CommandGeneratorCard({ config, onExtraValuesChange }: CommandGeneratorCardProps) {
    const session = useRequiredSession();
    const { t } = useTranslation();
    const cmdT = t.commands.generator;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const configT: any = t.commands.config[config.id as keyof typeof t.commands.config] || {};

    const title = configT.title || config.title;
    const desc = configT.desc || config.desc;
    const info = configT.info || config.info;
    const templatePlaceholder = configT.templatePlaceholder || config.templatePlaceholder;
    const templateVars = configT.templateVars || config.templateVars;

    const { showToast } = useToast();
    const [stored, updateConfig] = useCommandConfig(config.id);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (!config.extraSelectors?.length) return;

        const defaults: Record<string, string> = {};
        config.extraSelectors.forEach((sel) => {
            defaults[sel.id] = sel.options[0]?.value ?? '';
        });

        const saved = getCommandConfig(config.id);
        const hasStoredExtras = config.extraSelectors.some((sel) => saved.extraValues[sel.id] !== undefined);
        if (!hasStoredExtras) {
            updateConfig({ extraValues: defaults });
        }
    }, [config.id, config.extraSelectors, updateConfig]);

    const { bot, template, format, extraValues } = stored;

    const botOptions = useMemo(
        () => BOT_OPTIONS.filter((opt) => !config.excludedBots?.includes(opt.value)),
        [config.excludedBots]
    );

    useEffect(() => {
        if (!botOptions.length) return;
        if (!botOptions.some((opt) => opt.value === bot)) {
            updateConfig({ bot: botOptions[0].value });
        }
    }, [bot, botOptions, updateConfig]);

    useEffect(() => {
        onExtraValuesChange?.(extraValues);
    }, [extraValues, onExtraValuesChange]);

    const generated = useMemo(() => {
        const { login } = session;
        if (!login) return { masked: '', full: '' };

        const domain = `${window.location.origin}${API_ENDPOINTS.BASE}`;
        const displayParam = buildAuthQueryParamForDisplay({});
        const displayQuery = `channel=${login}&${displayParam}`;

        const displayResult = config.generate(
            domain,
            login,
            displayParam,
            bot,
            template.trim(),
            displayQuery,
            extraValues
        );

        const masked = format === 'full' ? displayResult.full : displayResult.url;

        return { masked, full: masked };
    }, [session, bot, template, format, extraValues, config]);

    const copyCommand = async () => {
        try {
            const { login } = session;
            if (!login) {
                showToast(cmdT.toasts.noCommand, 'error');
                return;
            }
            const { apiKey } = await fetchRevealApiKey();
            const tokenParam = buildAuthQueryParam({ apiKey });
            const domain = `${window.location.origin}${API_ENDPOINTS.BASE}`;
            const queryParams = `channel=${login}&${tokenParam}`;
            const result = config.generate(
                domain,
                login,
                tokenParam,
                bot,
                template.trim(),
                queryParams,
                extraValues
            );
            const full = format === 'full' ? result.full : result.url;
            const ok = await copyText(full);
            if (ok) {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            }
            showToast(
                ok ? cmdT.toasts.copied : cmdT.toasts.copyError,
                ok ? 'success' : 'error'
            );
        } catch {
            showToast(cmdT.toasts.apiError, 'error');
        }
    };

    return (
        <div className={`${panelCard} ${fadeIn} relative z-10 mb-5 flex flex-col focus-within:z-20`}>
            <CommandCardHeader
                icon={config.icon}
                title={title}
                description={desc}
                info={info}
            />

            <div className="p-5 text-text-main">
                <SelectFieldRow
                    label={cmdT.botSelect}
                    icon={Bot}
                    controlId={`${config.id}-bot`}
                    value={bot}
                    onChange={(e) => updateConfig({ bot: e.target.value })}
                    options={botOptions}
                />

                {config.extraSelectors?.map((sel) => {
                    const selT = configT.extraSelectors?.[sel.id];
                    const label = selT?.label || sel.label;
                    const options = sel.options.map(opt => ({
                        value: opt.value,
                        label: selT?.options?.[opt.value] || opt.label
                    }));

                    return (
                        <SelectFieldRow
                            key={sel.id}
                            rowClassName="mt-2.5"
                            label={`${label}:`}
                            icon={sel.icon}
                            controlId={`${config.id}-extra-${sel.id}`}
                            value={extraValues[sel.id] ?? ''}
                            onChange={(e) =>
                                updateConfig({
                                    extraValues: { ...extraValues, [sel.id]: e.target.value }
                                })
                            }
                            options={options}
                        />
                    );
                })}

                {config.templatePlaceholder && (
                    <div className="mb-4 flex flex-col gap-1">
                        <label htmlFor={`${config.id}-template`} className={`${inputLabel} inline-flex items-center gap-1.5`}>
                            <IconSm icon={Edit} />
                            <span>{cmdT.customMsg}</span>
                        </label>
                        <input
                            id={`${config.id}-template`}
                            type="text"
                            value={template}
                            onChange={(e) => updateConfig({ template: e.target.value })}
                            placeholder={templatePlaceholder}
                            className={textInput}
                        />
                        {templateVars && <TemplateVarsHelp vars={templateVars} />}
                    </div>
                )}

                <SelectFieldRow
                    label={cmdT.copyFormat}
                    icon={FileCode}
                    controlId={`${config.id}-format`}
                    value={format}
                    onChange={(e) => updateConfig({ format: e.target.value as 'full' | 'url' })}
                    options={[
                        { value: 'full', label: cmdT.formatFull },
                        { value: 'url', label: cmdT.formatUrl }
                    ]}
                />

                <div className={codeBox}>
                    <textarea readOnly value={generated.masked} aria-label={cmdT.ariaGenerated} className={codeTextarea} />
                    <button
                        type="button"
                        onClick={() => void copyCommand()}
                        className={btnCopy}
                        disabled={!generated.full}
                    >
                        {isCopied ? <Check className="size-4 shrink-0" /> : <Copy className="size-4 shrink-0" />}
                        {isCopied ? cmdT.btnCopied : cmdT.btnCopy}
                    </button>
                </div>
            </div>
        </div>
    );
}

interface ApiTestCardProps {
    title: string;
    description: string;
    infoTooltip?: string;
    children: ReactNode;
    onTest: () => Promise<void>;
    result: { status: 'idle' | 'loading' | 'success' | 'error'; message: string };
    buttonLabel?: string;
}

export function ApiTestCard({
    title,
    description,
    infoTooltip,
    children,
    onTest,
    result,
    buttonLabel
}: ApiTestCardProps) {
    const { t } = useTranslation();
    const isActive = result.status === 'success' || result.status === 'error';
    const finalBtnLabel = buttonLabel || t.commands.apiTest.btnTest;

    return (
        <div className={`${panelCard} ${fadeIn} mb-5 flex flex-col [animation-delay:60ms]`}>
            <header className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                    <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${subtleIcon('primary')}`}
                    >
                        <FlaskConical className="h-4 w-4" aria-hidden />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-[0.9375rem] font-semibold tracking-tight text-text-main">{title}</h2>
                        <p className="mt-0.5 text-[0.75rem] leading-snug text-text-muted">{description}</p>
                    </div>
                </div>
                {infoTooltip ? (
                    <div className="shrink-0">
                        <InfoTooltip text={infoTooltip} placement="bottom" />
                    </div>
                ) : null}
            </header>

            <div className="p-5 text-text-main">
                <div className={formGrid}>{children}</div>

                <button
                    type="button"
                    onClick={() => void onTest()}
                    disabled={result.status === 'loading'}
                    className={btnPrimary}
                >
                    {result.status === 'loading' ? (
                        <Loader2 className="size-4 shrink-0 animate-spin" />
                    ) : (
                        <Play className="size-4 shrink-0" />
                    )}
                    {result.status === 'loading' ? t.commands.apiTest.btnTesting : finalBtnLabel}
                </button>

                <div
                    className={`${responseCard} ${
                        isActive ? 'flex animate-reveal-card' : 'hidden'
                    } ${
                        result.status === 'success'
                            ? 'border-success/30 bg-[rgba(16,185,129,0.15)]'
                            : result.status === 'error'
                              ? 'border-error/30 bg-error/15'
                              : ''
                    }`}
                >
                    {result.status === 'success' && (
                        <Check className="size-5 shrink-0 text-success" />
                    )}
                    {result.status === 'error' && (
                        <AlertTriangle className="size-5 shrink-0 text-error" />
                    )}
                    <div
                        className={`min-w-0 flex-1 whitespace-pre-wrap break-words ${
                            result.status === 'success'
                                ? 'text-[#ecfdf5]'
                                : result.status === 'error'
                                  ? 'text-[#fecaca]'
                                  : 'text-text-main'
                        }`}
                    >
                        {result.message}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function FormField({
    label,
    value,
    onChange,
    placeholder
}: {
    label?: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    return (
        <div className="flex flex-col gap-1">
            {label ? <span className={inputLabel}>{label}</span> : null}
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={textInput}
            />
        </div>
    );
}
