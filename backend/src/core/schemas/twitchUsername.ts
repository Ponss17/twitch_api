import { z } from 'zod';

const twitchUsernameBase = z
    .string()
    .trim()
    .min(1)
    .max(25)
    .regex(/^[a-zA-Z0-9_]+$/, 'Nombre de usuario Twitch inválido');

/** Username tal cual (sin @). */
export const twitchUsername = twitchUsernameBase;

/** Username con strip opcional de @ al inicio (comandos/minijuegos). */
export const twitchUsernameWithAtStrip = z
    .string()
    .trim()
    .transform((v) => (v.startsWith('@') ? v.slice(1) : v))
    .pipe(twitchUsernameBase);
