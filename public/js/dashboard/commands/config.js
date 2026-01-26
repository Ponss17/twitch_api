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
        generate: (domain, login, tokenParam, bot, templateVal, queryParams) => {
            const { CommandGenerator } = window.CommandUtils || {};
            if (!CommandGenerator)
                return '';
            const botUtils = CommandGenerator.bots[bot] || CommandGenerator.bots.nightbot;
            const userArg = bot === 'wizebot' ? '$(user_name)' : botUtils.arg('user');
            if (templateVal)
                queryParams += `&template=${encodeURIComponent(templateVal)}`;
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
        generate: (domain, login, tokenParam, bot, templateVal, queryParams) => {
            const { CommandGenerator } = window.CommandUtils || {};
            if (!CommandGenerator)
                return '';
            const botUtils = CommandGenerator.bots[bot] || CommandGenerator.bots.nightbot;
            const userArg = bot === 'nightbot' ? '$(user)' : (bot === 'wizebot' ? '$(user_name)' : '${user}');
            const apiCall = CommandGenerator.generate(bot, `${domain}/create-clip`, queryParams);
            let cmd = '';
            if (templateVal) {
                cmd = templateVal.replace('{user}', userArg).replace('{url}', apiCall);
            }
            else {
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
        generate: (domain, login, tokenParam, bot, templateVal, queryParams) => {
            const { CommandGenerator } = window.CommandUtils || {};
            if (!CommandGenerator)
                return '';
            const botUtils = CommandGenerator.bots[bot];
            let targetArg = botUtils.arg('touser') || botUtils.arg('1');
            if (templateVal)
                queryParams += `&template=${encodeURIComponent(templateVal)}`;
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
        generate: (domain, login, tokenParam, bot, templateVal, queryParams, extraValues) => {
            const { CommandGenerator } = window.CommandUtils || {};
            if (!CommandGenerator)
                return '';
            const botUtils = CommandGenerator.bots[bot];
            const mood = extraValues.mood || 'classic';
            const qVar = botUtils.arg('query');
            const uVar = botUtils.arg('user');
            const domain8 = domain.split('/api/twitch').join('/api/twitch/minigames/magic8');
            const magicParams = `${tokenParam}&question=${qVar}&mood=${mood}&user=${uVar}`;
            return `!addcom !8ball ${botUtils.urlfetch(`${domain8}?${magicParams}`)}`;
        }
    }
};
