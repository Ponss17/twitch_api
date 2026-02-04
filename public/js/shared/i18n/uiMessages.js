export const UIMessages = {
    Clipboard: {
        copied: '¡Copiado!',
        error: 'Error al copiar'
    },
    ChatSim: {
        welcome: '¡Bienvenido al chat!',
        placeholder: 'Enviar un mensaje',
        btnText: 'Chat',
        followage: (user, channel, time) => `@${user} sigue a @${channel} desde hace ${time}.`,
        clip: (user, url) => `🎬 Clip creado por <span style="color:#FF69B4">@${user}</span>: ${url}`,
        shoutout: (user, game) => `¡Vayan a seguir a <span style="color:#bf94ff">@${user}</span>! Estaba jugando ${game}`
    }
};
