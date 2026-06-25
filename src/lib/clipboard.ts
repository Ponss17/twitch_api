/** Copia texto al portapapeles (requiere contexto seguro o permiso de Clipboard API). */
export async function copyText(text: string): Promise<boolean> {
    const value = text.trim();
    if (!value) return false;

    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
        return false;
    }

    try {
        await navigator.clipboard.writeText(value);
        return true;
    } catch {
        return false;
    }
}
