const CommandsMessages = {
  clipResponse: (user, url) => `\u{1F3AC} Clip creado por ${user}: ${url}`,
  followageResponse: "Procesando followage...",
  missingCreds: "Faltan credenciales",
  completeFields: "Por favor, completa ambos campos.",
  testing: '<i class="fa-solid fa-spinner fa-spin"></i> Probando...',
  connectionError: '<span class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Error de conexi\xF3n</span>',
  success: (text) => `<span class="text-success"><i class="fa-solid fa-check"></i> ${text}</span>`,
  error: (text) => `<span class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Error: ${text}</span>`,
  form: {
    customMessage: "Mensaje Personalizado (Opcional)",
    variables: "Variables:",
    selectBot: "Selecciona tu bot:",
    copyBtn: "Copiar"
  }
};
export {
  CommandsMessages
};
