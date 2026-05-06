export const UIMessages = {
    Clipboard: {
        copied: '¡Copiado!',
        error: 'Error al copiar'
    },
    ChatSim: {
        welcome: '¡Bienvenido al chat!',
        placeholder: 'Enviar un mensaje',
        btnText: 'Chat',
        followage: (user: string, channel: string, time: string) =>
            `@${user} sigue a @${channel} desde hace ${time}.`,
        clip: (user: string, url: string) =>
            `🎬 Clip creado por <span style="color:#FF69B4">@${user}</span>: ${url}`,
        shoutout: (user: string, game: string) =>
            `¡Vayan a seguir a <span style="color:#bf94ff">@${user}</span>! Estaba jugando ${game}`
    }
};
