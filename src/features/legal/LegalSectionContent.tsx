import { useTranslation } from '@/core/i18n/I18nContext';
import React, { ReactNode } from 'react';

const proseLink = 'text-primary underline underline-offset-2';

/** Función simple para procesar markdown básico (negrita y enlaces) a JSX */
function parseMarkdown(text: string): ReactNode[] {
    const parts = text.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('[') && part.includes('](')) {
            const match = part.match(/\[(.*?)\]\((.*?)\)/);
            if (match) {
                return (
                    <a key={index} href={match[2]} className={proseLink} target="_blank" rel="noopener noreferrer">
                        {match[1]}
                    </a>
                );
            }
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
    });
}

function SectionRenderer({ startIndex, endIndex }: { startIndex: number; endIndex: number }) {
    const { t } = useTranslation();
    const sections = t.legal.sections.slice(startIndex, endIndex);

    return (
        <>
            {sections.map((section, i) => (
                <React.Fragment key={i}>
                    <h2>{section.title}</h2>
                    <p>{section.content}</p>
                </React.Fragment>
            ))}
        </>
    );
}

export function TermsSectionContent() {
    const { t } = useTranslation();
    return (
        <>
            <p>{parseMarkdown(t.legal.introTerms)}</p>
            <SectionRenderer startIndex={0} endIndex={6} />
        </>
    );
}

export function PrivacySectionContent() {
    const { t } = useTranslation();
    return (
        <>
            <p>{parseMarkdown(t.legal.introPrivacy)}</p>
            <SectionRenderer startIndex={6} endIndex={17} />
        </>
    );
}

export function CookiesSectionContent() {
    const { t } = useTranslation();
    return (
        <>
            <p>{parseMarkdown(t.legal.introCookies)}</p>
            <SectionRenderer startIndex={17} endIndex={21} />
        </>
    );
}

