import { useMemo } from 'react';
import { appUrl } from '@/core/config/paths';
import { docsUrl } from '@/core/ui/docsTw';

interface DocsApiUrlProps {
    path: string;
}

/** Muestra la URL absoluta del API en docs (sin placeholder `{baseURL}`). */
export function DocsApiUrl({ path }: DocsApiUrlProps) {
    const absolute = useMemo(() => {
        const normalized = path.startsWith('/') ? path : `/${path}`;
        return appUrl(normalized);
    }, [path]);

    return (
        <span className={docsUrl} suppressHydrationWarning>
            {absolute}
        </span>
    );
}
