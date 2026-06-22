/** Copia texto al portapapeles con fallback para contextos sin permiso de Clipboard API. */
export async function copyText(text: string): Promise<boolean> {
    const value = text.trim();
    if (!value) return false;

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(value);
            return true;
        } catch {
            /* fallback below */
        }
    }

    if (typeof document === 'undefined') return false;

    try {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        return ok;
    } catch {
        return false;
    }
}
