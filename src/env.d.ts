/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference path="../node_modules/@astrojs/starlight/virtual-internal.d.ts" />

/** Permite que el IDE tipifique HTML en archivos .astro */
declare namespace JSX {
    interface IntrinsicElements extends astroHTML.JSX.DefinedIntrinsicElements {
        [name: string]: Record<string, unknown>;
    }
}

interface ImportMetaEnv {
    /** Vite/Astro built-in: true in `astro dev`. */
    readonly DEV: boolean;
    /** Vite/Astro built-in: true in production builds. */
    readonly PROD: boolean;
    readonly MODE: string;
    readonly SSR: boolean;
    readonly SUPABASE_URL?: string;
    readonly SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare module '@vercel/speed-insights/astro' {
    const SpeedInsights: any;
    export default SpeedInsights;
}
