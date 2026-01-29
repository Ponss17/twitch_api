import { CommandGenerator } from '../../utils/commandGenerator.js';

export const COMMAND_CONFIG = {
    follow: {
        id: 'follow',
        containerId: 'command-card-followage',
        title: 'Comando !followage',
        icon: 'fa-solid fa-wrench',
        desc: 'Muestra cuánto tiempo lleva alguien siguiéndote',
        info: 'Genera el código para que tu bot responda con el tiempo exacto que un usuario te sigue.',
        templatePlaceholder: 'Ej: {user} lleva sufriendo {time}.',
        templateVars: 'Variables: {user}, {time}, {channel}',
        generate: (domain: string, login: string, tokenParam: string, bot: string, templateVal: string, queryParams: string) => {
            const botUtils = CommandGenerator.bots[bot] || CommandGenerator.bots.nightbot;
            const userArg = bot === 'wizebot' ? '$(user_name)' : botUtils.arg('user');

            if (templateVal) queryParams += `&template=${encodeURIComponent(templateVal)}`;
            queryParams += `&user=${userArg}`;

            const cmd = CommandGenerator.generate(bot, `${domain}/followage`, queryParams);
            return `!addcom !followage ${cmd}`;
        }
    },
    clip: {
        id: 'clip',
        containerId: 'command-card-clip',
        title: 'Comando !clip',
        icon: 'fa-solid fa-video',
        desc: 'Permite crear clips desde el chat',
        info: 'Tus moderadores podrán crear clips instantáneos escribiendo !clip. Requiere estar en vivo.',
        templatePlaceholder: 'Ej: ¡Mirad este clip de {user}! 👉 {url}',
        templateVars: 'Variables: {user}, {url}',
        generate: (domain: string, login: string, tokenParam: string, bot: string, templateVal: string, queryParams: string) => {
            const botUtils = CommandGenerator.bots[bot] || CommandGenerator.bots.nightbot;
            const userArg = bot === 'nightbot' ? '$(user)' : (bot === 'wizebot' ? '$(user_name)' : '${user}');
            const titleArg = botUtils.arg('query') || botUtils.arg('args') || '';

            if (titleArg) queryParams += `&title=${titleArg}`;

            const apiCall = CommandGenerator.generate(bot, `${domain}/create-clip`, queryParams);

            let cmd = '';
            if (templateVal) {
                cmd = templateVal.replace('{user}', userArg).replace('{url}', apiCall);
            } else {
                cmd = `🎬 Clip creado por ${userArg}: ${apiCall}`;
            }
            return `!addcom !clip ${cmd}`;
        }
    },
    shoutout: {
        id: 'shoutout',
        containerId: 'command-card-shoutout',
        title: 'Comando !so',
        icon: 'fa-solid fa-bullhorn',
        desc: 'Promociona a otro streamer',
        info: 'Genera un enlace para que tu bot haga un Shoutout con el juego y el enlace del canal.',
        templatePlaceholder: 'Ej: Echadle un follow a {user}, cracks jugando {game} 👉 {url}',
        templateVars: 'Variables disponibles: {user}, {game}, {url}',
        generate: (domain: string, login: string, tokenParam: string, bot: string, templateVal: string, queryParams: string) => {
            const botUtils = CommandGenerator.bots[bot];
            let targetArg = botUtils.arg('touser') || botUtils.arg('1');

            if (templateVal) queryParams += `&template=${encodeURIComponent(templateVal)}`;
            queryParams += `&touser=${targetArg}`;

            const cmd = CommandGenerator.generate(bot, `${domain}/shoutout`, queryParams);
            return `!addcom !so ${cmd}`;
        }
    },
    magic8: {
        id: 'magic8',
        containerId: 'command-card-magic8',
        title: 'Comando !8ball',
        icon: 'fa-solid fa-8',
        desc: 'Comando para que tus viewers pregunten a la IA',
        info: 'Genera el código para añadir el comando de la Bola 8 a tu bot de chat.',
        extraSelectors: [
            {
                id: 'mood',
                label: 'Personalidad',
                icon: 'fa-solid fa-masks-theater',
                options: [
                    { value: 'classic', label: 'Clásica' },
                    { value: 'sarcastic', label: 'Sarcástica' },
                    { value: 'toxic', label: 'Tóxica' },
                    { value: 'helpful', label: 'Servicial' }
                ]
            }
        ],
        generate: (domain: string, login: string, tokenParam: string, bot: string, templateVal: string, queryParams: string, extraValues: Record<string, string>) => {
            const botUtils = CommandGenerator.bots[bot];
            let mood = extraValues.mood || 'classic';

            if (templateVal) queryParams += `&template=${encodeURIComponent(templateVal)}`;
            queryParams += `&mood=${mood}`;

            const userArg = bot === 'wizebot' ? '$(user_name)' : botUtils.arg('user');
            queryParams += `&user=${userArg}`;

            const queryArg = botUtils.arg('query') || botUtils.arg('args') || '(?)';
            queryParams += `&question=${queryArg}`;

            const magicUrl = domain.includes('/minigames') ? `${domain}/magic8` : `${domain}/minigames/magic8`;
            const cmd = CommandGenerator.generate(bot, magicUrl, queryParams);
            return `!addcom !8ball ${cmd}`;
        }
    }
};
