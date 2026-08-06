import { THEME_STORAGE_KEY, DEFAULT_THEME, THEME_META_COLORS } from './theme.config';

/**
 * Genera el script inline en crudo para inyectar en el `<head>` del HTML.
 * Se ejecuta síncronamente antes del primer renderizado para garantizar 0ms de FOUC (Flash of Unstyled Content).
 */
export function getThemeInitScript(): string {
    const metaColorsJson = JSON.stringify(THEME_META_COLORS);
    return `(function(){try{var k='${THEME_STORAGE_KEY}';var d='${DEFAULT_THEME}';var m=${metaColorsJson};var s=localStorage.getItem(k)||d;var r=document.documentElement;if(s!=='dark'){r.setAttribute('data-theme',s);}else{r.removeAttribute('data-theme');}var c=m[s]||m[d]||'#09090b';var el=document.querySelector('meta[name="theme-color"]');if(el){el.setAttribute('content',c);}}catch(e){}})();`;
}
