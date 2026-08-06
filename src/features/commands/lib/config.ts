import { CommandGenerator } from './commandGenerator';
import { UserRoundCheck, Video, Megaphone, Theater, Flame, Swords } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { MAGIC8_ICON, RUSSIAN_ICON } from '@/features/dashboard/lib/dashboardTabs';

export interface ExtraSelector {
    id: string;
    label: string;
    icon: LucideIcon;
    options: { value: string; label: string }[];
}

export interface CommandConfigItem {
    id: string;
    title: string;
    icon: LucideIcon;
    desc: string;
    info: string;
    /** Bots sin soporte para este comando (p. ej. Wizebot ya trae !clip nativo). */
    excludedBots?: string[];
    templatePlaceholder?: string;
    templateVars?: string;
    extraSelectors?: ExtraSelector[];
    supportsLanguage?: boolean;
    generate: (
        domain: string,
        login: string,
        tokenParam: string,
        bot: string,
        templateVal: string,
        queryParams: string,
        extraValues?: Record<string, string>
    ) => { full: string; url: string };
}

const appendLangParam = (params: string, extraValues?: Record<string, string>) => {
    const lang = extraValues?.lang;
    return lang && lang !== 'es' ? `${params}&lang=${encodeURIComponent(lang)}` : params;
};

export const COMMAND_CONFIG: Record<string, CommandConfigItem> = {
    follow: {
        id: 'follow',
        title: 'Comando !followage',
        icon: UserRoundCheck,
        desc: 'Muestra cuánto tiempo lleva alguien siguiéndote',
        info: 'Genera el código para que tu bot responda con el tiempo exacto que un usuario te sigue.',
        templatePlaceholder: 'Ej: {user} lleva sufriendo {time}.',
        templateVars: 'Variables: {user}, {time}, {channel}',
        supportsLanguage: true,
        generate: (domain, login, tokenParam, bot, templateVal, _queryParams, extraValues = {}) => {
            const botUtils = CommandGenerator.bots[bot] || CommandGenerator.bots.nightbot;
            const userArg = botUtils.arg('touser');
            let params = `channel=${login}&user=${userArg}&${tokenParam}`;
            params = appendLangParam(params, extraValues);
            if (templateVal) params += `&template=${encodeURIComponent(templateVal)}`;
            const cmd = CommandGenerator.generate(bot, `${domain}/followage`, params);
            return { full: botUtils.addcmd('!followage', cmd), url: cmd };
        }
    },
    clip: {
        id: 'clip',
        title: 'Comando !clip',
        icon: Video,
        desc: 'Permite crear clips desde el chat',
        info: 'Tus moderadores podrán crear clips instantáneos escribiendo !clip. Requiere estar en vivo. Wizebot y Fossabot ya incluyen !clip nativo, no hace falta integrar la API.',
        excludedBots: ['wizebot', 'fossabot'],
        templatePlaceholder: 'Ej: ¡Miren este clip de {user}! 👉 {url}',
        templateVars: 'Variables: {user}, {url}',
        generate: (domain, login, tokenParam, bot, templateVal, _queryParams) => {
            const botUtils = CommandGenerator.bots[bot] || CommandGenerator.bots.nightbot;
            const userArg = botUtils.arg('user');
            const titleArg = botUtils.arg('query') || botUtils.arg('args') || '';
            let params = `channel=${login}&${tokenParam}`;
            if (titleArg) params += `&title=${titleArg}`;
            params += `&user=${userArg}`;
            const apiCall = CommandGenerator.generate(bot, `${domain}/create-clip`, params);
            const cmd = templateVal
                ? templateVal.replace('{user}', userArg).replace('{url}', apiCall)
                : `VoHiYo Clip creado por ${userArg}: ${apiCall}`;
            return { full: botUtils.addcmd('!clip', cmd), url: cmd };
        }
    },
    shoutout: {
        id: 'shoutout',
        title: 'Comando !so',
        icon: Megaphone,
        desc: 'Promociona a otro streamer',
        info: 'Genera un enlace para que tu bot haga un Shoutout con el juego y el enlace del canal.',
        templatePlaceholder: 'Ej: Dale follow a {user}, jugando {game} 👉 {url}',
        templateVars: 'Variables disponibles: {user}, {game}, {url}',
        generate: (domain, login, tokenParam, bot, templateVal, _queryParams) => {
            const botUtils = CommandGenerator.bots[bot];
            const targetArg = botUtils.arg('touser') || botUtils.arg('1');
            let params = `channel=${login}&touser=${targetArg}&${tokenParam}`;
            if (templateVal) params += `&template=${encodeURIComponent(templateVal)}`;
            const cmd = CommandGenerator.generate(bot, `${domain}/shoutout`, params);
            return { full: botUtils.addcmd('!so', cmd), url: cmd };
        }
    },
    magic8: {
        id: 'magic8',
        title: 'Comando !8ball',
        icon: MAGIC8_ICON,
        desc: 'Comando para que tus viewers pregunten a la IA',
        info: 'Genera el código para añadir el comando de la Bola 8 a tu bot de chat.',
        extraSelectors: [
            {
                id: 'mood',
                label: 'Personalidad',
                icon: Theater,
                options: [
                    { value: 'classic', label: 'Clásica' },
                    { value: 'sarcastic', label: 'Sarcástica' },
                    { value: 'toxic', label: 'Tóxica' },
                    { value: 'helpful', label: 'Servicial' }
                ]
            }
        ],
        generate: (domain, login, tokenParam, bot, templateVal, _queryParams, extraValues = {}) => {
            const botUtils = CommandGenerator.bots[bot];
            const mood = extraValues.mood || 'classic';
            const userArg = botUtils.arg('user');
            const queryArg = botUtils.arg('query') || botUtils.arg('args') || '(?)';
            let params = `channel=${login}&question=${queryArg}&user=${userArg}&mood=${mood}&${tokenParam}`;
            params = appendLangParam(params, extraValues);
            if (templateVal) params += `&template=${encodeURIComponent(templateVal)}`;
            const cmd = CommandGenerator.generate(bot, `${domain}/minigames/magic8`, params);
            return { full: botUtils.addcmd('!8ball', cmd), url: cmd };
        }
    },
    russian: {
        id: 'russian',
        title: 'Comando !ruleta',
        icon: RUSSIAN_ICON,
        desc: 'Juego de Ruleta Rusa para el chat',
        info: 'Tus viewers podrán jugar a la Ruleta Rusa escribiendo !ruleta.',
        extraSelectors: [
            {
                id: 'hardcore',
                label: 'Modo Hardcore',
                icon: Flame,
                options: [
                    { value: 'false', label: 'Desactivado' },
                    { value: 'true', label: 'Activado (60s timeout)' }
                ]
            }
        ],
        supportsLanguage: true,
        generate: (domain, login, tokenParam, bot, _templateVal, _queryParams, extraValues = {}) => {
            const botUtils = CommandGenerator.bots[bot];
            const userArg = botUtils.arg('user');
            let params = `channel=${login}&user=${userArg}&hardcore=${extraValues.hardcore === 'true'}&${tokenParam}`;
            params = appendLangParam(params, extraValues);
            const cmd = CommandGenerator.generate(bot, `${domain}/minigames/russian`, params);
            return { full: botUtils.addcmd('!ruleta', cmd), url: cmd };
        }
    },
    duel: {
        id: 'duel',
        title: 'Comando !duelo',
        icon: Swords,
        desc: 'Duelo 1vs1 narrado (Nightbot: 3 mensajes)',
        info: 'Con Nightbot el bot cuenta el duelo en 3 mensajes. En otros bots sale en una sola línea.',
        supportsLanguage: true,
        generate: (domain, login, tokenParam, bot, _templateVal, _queryParams, extraValues = {}) => {
            const botUtils = CommandGenerator.bots[bot];
            const challengerArg = botUtils.arg('user');
            const targetArg = botUtils.arg('touser') || botUtils.arg('1');
            let params = `channel=${login}&challenger=${challengerArg}&target=${targetArg}&${tokenParam}`;
            params = appendLangParam(params, extraValues);
            const cmd = CommandGenerator.generate(bot, `${domain}/minigames/duel`, params);
            return { full: botUtils.addcmd('!duelo', cmd), url: cmd };
        }
    }
};
