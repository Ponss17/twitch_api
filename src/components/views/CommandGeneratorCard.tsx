import { Edit, Check, Loader2, AlertTriangle, Copy, Play, Bot, FileCode, FlaskConical } from 'lucide-react';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { SlotText } from 'slot-text/react';
import 'slot-text/style.css';
import {
    btnCopy,
    btnPrimary,
    card,
    codeBox,
    codeTextarea,
    fadeIn,
    formGrid,
    inputLabel,
    responseCard,
    textInput
} from '@/lib/tw';
import { SelectFieldRow } from '@/components/ui/SelectField';
import { API_ENDPOINTS } from '@/lib/config';
import { buildAuthQueryParam } from '@/lib/authQuery';
import { BOT_OPTIONS } from '@/lib/commandGenerator';
import type { CommandConfigItem } from '@/lib/commands/config';
import { useRequiredSession } from '@/hooks/useSession';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { useToast } from '@/components/ui/ToastProvider';
import { CardHeaderIcon, IconSm } from '@/components/ui/Icon';
import { copyText } from '@/lib/clipboard';
import { useCommandConfig } from '@/lib/hooks/useCommandStore';
import { getCommandConfig } from '@/lib/commandStore';

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
        <div className="mb-2 flex items-center justify-between gap-3 border-b border-white/[0.08] pb-2">
            <div className="flex items-center gap-3">
                <CardHeaderIcon icon={Icon} />
                <div>
                    <h3 className="mb-0.5 text-[0.95rem] font-bold">{title}</h3>
                    <p className="text-[0.8rem] text-[#a1a1aa]">{description}</p>
                </div>
            </div>
            <InfoTooltip text={info} />
        </div>
    );
}

function TemplateVarsHelp({ vars }: { vars: string }) {
    const text = vars.replace(/^Variables(?:\s+disponibles)?:\s*/i, '').trim();
    const parts = text.split(',').map((v) => v.trim());
    return (
        <small className="mt-0.5 block text-[0.6875rem] leading-snug text-[#52525b]">
            <strong className="text-[#fafafa]">Variables:</strong>{' '}
            {parts.map((part, i) => {
                const match = part.match(/\{(\w+)\}/);
                const badge = match ? `{${match[1]}}` : part;
                return (
                    <span key={part}>
                        {i > 0 ? ', ' : ''}
                        <code className="mx-0.5 rounded border border-primary/30 bg-primary/15 px-1 py-px text-[0.8125rem] text-[#c4b5fd]">
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

    useEffect(() => {
        onExtraValuesChange?.(extraValues);
    }, [extraValues, onExtraValuesChange]);

    const generated = useMemo(() => {
        const { login, apiKey, token } = session;
        if (!login) return { masked: '', full: '' };

        const domain = `${window.location.origin}${API_ENDPOINTS.BASE}`;
        const tokenParam = buildAuthQueryParam({ apiKey, token });
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

        const realCmd = format === 'full' ? result.full : result.url;
        const secret = apiKey || token || '';
        const masked = secret ? realCmd.split(secret).join('**************') : realCmd;

        return { masked, full: realCmd };
    }, [session, bot, template, format, extraValues, config]);

    const copyCommand = async () => {
        if (!generated.full) {
            showToast('No hay comando para copiar', 'error');
            return;
        }
        const ok = await copyText(generated.full);
        if (ok) {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
        showToast(
            ok ? 'Comando copiado al portapapeles' : 'No se pudo copiar',
            ok ? 'success' : 'error'
        );
    };

    return (
        <div className={`${card} ${fadeIn} mb-3`}>
            <CommandCardHeader
                icon={config.icon}
                title={config.title}
                description={config.desc}
                info={config.info}
            />

            <div className="text-[#fafafa]">
                <SelectFieldRow
                    label="Selecciona tu bot:"
                    icon={Bot}
                    controlId={`${config.id}-bot`}
                    value={bot}
                    onChange={(e) => updateConfig({ bot: e.target.value })}
                    options={BOT_OPTIONS}
                />

                {config.extraSelectors?.map((sel) => (
                    <SelectFieldRow
                        key={sel.id}
                        rowClassName="mt-2.5"
                        label={`${sel.label}:`}
                        icon={sel.icon}
                        controlId={`${config.id}-extra-${sel.id}`}
                        value={extraValues[sel.id] ?? ''}
                        onChange={(e) =>
                            updateConfig({
                                extraValues: { ...extraValues, [sel.id]: e.target.value }
                            })
                        }
                        options={sel.options}
                    />
                ))}

                {config.templatePlaceholder && (
                    <div className="mb-4 flex flex-col gap-1">
                        <label htmlFor={`${config.id}-template`} className={`${inputLabel} inline-flex items-center gap-1.5`}>
                            <IconSm icon={Edit} />
                            <span>Mensaje Personalizado (Opcional)</span>
                        </label>
                        <input
                            id={`${config.id}-template`}
                            type="text"
                            value={template}
                            onChange={(e) => updateConfig({ template: e.target.value })}
                            placeholder={config.templatePlaceholder}
                            className={textInput}
                        />
                        {config.templateVars && <TemplateVarsHelp vars={config.templateVars} />}
                    </div>
                )}

                <SelectFieldRow
                    label="Formato de copiado:"
                    icon={FileCode}
                    controlId={`${config.id}-format`}
                    value={format}
                    onChange={(e) => updateConfig({ format: e.target.value as 'full' | 'url' })}
                    options={[
                        { value: 'full', label: 'Comando completo (!addcom / !command add)' },
                        { value: 'url', label: 'Solo URL' }
                    ]}
                />

                <div className={codeBox}>
                    <textarea readOnly value={generated.masked} className={codeTextarea} />
                    <button
                        type="button"
                        onClick={() => void copyCommand()}
                        className={btnCopy}
                        disabled={!generated.full}
                    >
                        {isCopied ? <Check className="size-4 shrink-0" /> : <Copy className="size-4 shrink-0" />}
                        <SlotText text={isCopied ? "Copiado" : "Copiar"} />
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
    buttonLabel = 'Probar Respuesta'
}: ApiTestCardProps) {
    const isActive = result.status === 'success' || result.status === 'error';

    return (
        <div className={`${card} ${fadeIn} mb-3 [animation-delay:60ms]`}>
            <div className="mb-2 flex items-center justify-between gap-3 border-b border-white/[0.08] pb-2">
                <div className="flex items-center gap-3">
                    <CardHeaderIcon icon={FlaskConical} />
                    <div>
                        <h3 className="mb-0.5 text-[0.95rem] font-bold">{title}</h3>
                        <p className="text-[0.8rem] text-[#a1a1aa]">{description}</p>
                    </div>
                </div>
                {infoTooltip && <InfoTooltip text={infoTooltip} />}
            </div>

            <div className="text-[#fafafa]">
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
                    {result.status === 'loading' ? 'Probando...' : buttonLabel}
                </button>

                <div
                    className={`${responseCard} ${
                        isActive ? 'flex animate-reveal-card' : 'hidden'
                    } ${
                        result.status === 'success'
                            ? 'border-primary/30 border-l-4 border-l-primary bg-gradient-to-br from-primary/10 to-indigo-500/[0.05]'
                            : result.status === 'error'
                              ? 'border-l-4 border-l-[#ef4444] border-[#ef4444]/30 bg-gradient-to-br from-[#ef4444]/10 to-[#991b1b]/[0.05]'
                              : ''
                    }`}
                >
                    {result.status === 'success' && (
                        <Check className="text-lg drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                    )}
                    {result.status === 'error' && (
                        <AlertTriangle className="text-lg drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                    )}
                    <div className="min-w-0 flex-1">{result.message}</div>
                </div>
            </div>
        </div>
    );
}

export function FormField({
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
