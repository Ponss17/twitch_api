import { useLayoutEffect, useMemo, useState } from 'react';
import { SlotText } from 'slot-text/react';
import { copyText } from '@/core/ui/clipboard';
import { useToast } from '@/shared/ui/ToastProvider';
import { Check, Copy } from 'lucide-react';
import {
    docsCopyBtn,
    docsCopyBtnSuccess,
    docsFormatBtn,
    docsFormatSelector,
    docsTabBtn,
    docsTabContainer,
    docsTabContent,
    docsTabCodeArea,
    docsTabHeader,
    docsBotSelector
} from '@/core/ui/docsTw';

export type Bot = 'nightbot' | 'streamelements' | 'fossabot';

const BOT_LABELS: Record<Bot, string> = {
    nightbot: 'Nightbot',
    streamelements: 'StreamElements',
    fossabot: 'Fossabot'
};

const COMMAND_PREFIXES: Record<Bot, string> = {
    nightbot: '!addcom {trigger} ',
    streamelements: '!command add {trigger} ',
    fossabot: '!addcmd {trigger} '
};

/** SSR-safe: keeps {baseURL} placeholder so server and client HTML match. */
function buildCodeTemplate(bot: Bot, path: string, format: 'chat' | 'panel', trigger?: string): string {
    let code = path.includes('{baseURL}') ? path : `$(urlfetch {baseURL}${path})`;
    if (format === 'chat' && trigger) {
        code = COMMAND_PREFIXES[bot].replace('{trigger}', trigger) + code;
    }
    return code;
}

/** Client-only: sustituye {baseURL} por el origen actual (sin leer sesión ni API keys). */
function resolveBaseUrl(template: string): string {
    if (typeof window === 'undefined') return template;
    return template.replace(/\{baseURL\}/g, window.location.origin);
}

interface DocsCodeTabsProps {
    snippets: Record<Bot, string>;
    trigger?: string;
}

export function DocsCodeTabs({ snippets, trigger }: DocsCodeTabsProps) {
    const { showToast } = useToast();
    const [bot, setBot] = useState<Bot>('nightbot');
    const [format, setFormat] = useState<'chat' | 'panel'>('chat');
    const [copied, setCopied] = useState(false);

    const template = useMemo(
        () => buildCodeTemplate(bot, snippets[bot], format, trigger),
        [bot, format, snippets, trigger]
    );

    const [code, setCode] = useState(template);

    useLayoutEffect(() => {
        setCode(resolveBaseUrl(template));
    }, [template]);

    const copy = async () => {
        const ok = await copyText(code);
        if (!ok) {
            showToast('No se pudo copiar', 'error');
            return;
        }
        setCopied(true);
        showToast('Copiado al portapapeles', 'success');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={docsTabContainer}>
            <div className={docsTabHeader}>
                <div className={docsBotSelector}>
                    {(Object.keys(BOT_LABELS) as Bot[]).map((b) => (
                        <button
                            key={b}
                            type="button"
                            className={docsTabBtn(bot === b)}
                            onClick={() => setBot(b)}
                        >
                            {BOT_LABELS[b]}
                        </button>
                    ))}
                </div>
                <div className={docsFormatSelector}>
                    <button
                        type="button"
                        className={docsFormatBtn(format === 'chat')}
                        onClick={() => setFormat('chat')}
                    >
                        Chat
                    </button>
                    <button
                        type="button"
                        className={docsFormatBtn(format === 'panel')}
                        onClick={() => setFormat('panel')}
                    >
                        Panel
                    </button>
                </div>
            </div>
            <div className={docsTabContent}>
                <div className={docsTabCodeArea}>
                    <code suppressHydrationWarning>{code}</code>
                    <button
                        type="button"
                        className={`${docsCopyBtn} flex items-center gap-1.5${copied ? ` ${docsCopyBtnSuccess}` : ''}`}
                        onClick={() => void copy()}
                        aria-label="Copiar código"
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <SlotText text={copied ? "Copiado" : "Copiar"} />
                    </button>
                </div>
            </div>
        </div>
    );
}
