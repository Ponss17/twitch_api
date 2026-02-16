export const CommandsMessages = {
    clipResponse: (user: string, url: string) => `🎬 Clip creado por ${user}: ${url}`,
    followageResponse: 'Procesando followage...',
    missingCreds: 'Faltan credenciales',
    completeFields: '⚠️ Por favor, ingresa el Canal y el Usuario para probar.',
    testing: '<i class="fa-solid fa-spinner fa-spin"></i> Probando...',
    connectionError:
        '<span class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Error de conexión</span>',
    success: (text: string) =>
        `<span class="text-success"><i class="fa-solid fa-check"></i> ${text}</span>`,
    error: (text: string) =>
        `<span class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Error: ${text}</span>`,
    form: {
        customMessage: 'Mensaje Personalizado (Opcional)',
        variables: 'Variables:',
        selectBot: 'Selecciona tu bot:',
        copyBtn: 'Copiar'
    }
};
