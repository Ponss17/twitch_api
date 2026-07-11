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
    templatePlaceholder?: string;
    templateVars?: string;
    extraSelectors?: ExtraSelector[];
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

export const COMMAND_CONFIG: Record<string, CommandConfigItem> = {
    follow: {
        id: 'follow',
        title: 'Comando !followage',
        icon: UserRoundCheck,
        desc: 'Muestra cuánto tiempo lleva alguien siguiéndote',
        info: 'Genera el código para que tu bot responda con el tiempo exacto que un usuario te sigue.',
        templatePlaceholder: 'Ej: {user} lleva sufriendo {time}.',
        templateVars: 'Variables: {user}, {time}, {channel}',
        generate: (domain, _login, _tokenParam, bot, templateVal, queryParams) => {
            const botUtils = CommandGenerator.bots[bot] || CommandGenerator.bots.nightbot;
            const userArg = botUtils.arg('user');
            if (templateVal) queryParams += `&template=${encodeURIComponent(templateVal)}`;
            queryParams += `&user=${userArg}`;
            const cmd = CommandGenerator.generate(bot, `${domain}/followage/`, queryParams);
            return { full: botUtils.addcmd('!followage', cmd), url: cmd };
        }
    },
    clip: {
        id: 'clip',
        title: 'Comando !clip',
        icon: Video,
        desc: 'Permite crear clips desde el chat',
        info: 'Tus moderadores podrán crear clips instantáneos escribiendo !clip. Requiere estar en vivo.',
        templatePlaceholder: 'Ej: ¡Miren este clip de {user}! 👉 {url}',
        templateVars: 'Variables: {user}, {url}',
        generate: (domain, _login, _tokenParam, bot, templateVal, queryParams) => {
            const botUtils = CommandGenerator.bots[bot] || CommandGenerator.bots.nightbot;
            const userArg = botUtils.arg('user');
            const titleArg = botUtils.arg('query') || '';
            if (titleArg) queryParams += `&title=${titleArg}`;
            queryParams += `&user=${userArg}`;

            // BotRix no evalúa $(urlfetch) mezclado con texto plano — plantilla va en la API.
            if (bot === 'botrix') {
                if (templateVal) {
                    queryParams += `&template=${encodeURIComponent(templateVal)}`;
                }
                const cmd = CommandGenerator.generate(bot, `${domain}/create-clip/`, queryParams);
                return { full: botUtils.addcmd('!clip', cmd), url: cmd };
            }

            const apiCall = CommandGenerator.generate(bot, `${domain}/create-clip/`, queryParams);
            const cmd = templateVal
                ? templateVal.replace('{user}', userArg).replace('{url}', apiCall)
                : apiCall;
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
        generate: (domain, _login, _tokenParam, bot, templateVal, queryParams) => {
            const botUtils = CommandGenerator.bots[bot];
            const targetArg = botUtils.arg('touser') || botUtils.arg('1');
            if (templateVal) queryParams += `&template=${encodeURIComponent(templateVal)}`;
            queryParams += `&touser=${targetArg}`;
            const cmd = CommandGenerator.generate(bot, `${domain}/shoutout/`, queryParams);
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
        generate: (domain, _login, _tokenParam, bot, templateVal, queryParams, extraValues = {}) => {
            const botUtils = CommandGenerator.bots[bot];
            const mood = extraValues.mood || 'classic';
            if (templateVal) queryParams += `&template=${encodeURIComponent(templateVal)}`;
            queryParams += `&mood=${mood}`;
            const userArg = botUtils.arg('user');
            queryParams += `&user=${userArg}`;
            const queryArg = botUtils.arg('query') || '(?)';
            queryParams += `&question=${queryArg}`;
            const magicUrl = `${domain}/minigames/magic8/`;
            const cmd = CommandGenerator.generate(bot, magicUrl, queryParams);
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
        generate: (domain, _login, _tokenParam, bot, _templateVal, queryParams, extraValues = {}) => {
            const botUtils = CommandGenerator.bots[bot];
            const userArg = botUtils.arg('user');
            queryParams += `&user=${userArg}&hardcore=${extraValues.hardcore === 'true'}`;
            const cmd = CommandGenerator.generate(bot, `${domain}/minigames/russian/`, queryParams);
            return { full: botUtils.addcmd('!ruleta', cmd), url: cmd };
        }
    },
    duel: {
        id: 'duel',
        title: 'Comando !duelo',
        icon: Swords,
        desc: 'Juego de Duelo 1vs1 para el chat',
        info: 'Tus viewers podrán retarse a duelos narrativos escribiendo !duelo @usuario.',
        generate: (domain, _login, _tokenParam, bot, _templateVal, queryParams) => {
            const botUtils = CommandGenerator.bots[bot];
            const challengerArg = botUtils.arg('user');
            const targetArg = botUtils.arg('touser');
            queryParams += `&challenger=${challengerArg}&target=${targetArg}`;
            const cmd = CommandGenerator.generate(bot, `${domain}/minigames/duel/`, queryParams);
            return { full: botUtils.addcmd('!duelo', cmd), url: cmd };
        }
    }
};
