/** Sufijo canónico para `<title>` de todas las páginas Astro. */
export const SITE_NAME = 'LosPerris';

/** Formato: «Nombre de página | LosPerris» */
export function pageTitle(page: string): string {
    return `${page} | ${SITE_NAME}`;
}
