var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// frontend/shared/i18n/uiMessages.ts
var UIMessages = {
  Clipboard: {
    copied: "\xA1Copiado!",
    error: "Error al copiar"
  },
  ChatSim: {
    welcome: "\xA1Bienvenido al chat!",
    placeholder: "Enviar un mensaje",
    btnText: "Chat",
    followage: /* @__PURE__ */ __name((user, channel, time) => `@${user} sigue a @${channel} desde hace ${time}.`, "followage"),
    clip: /* @__PURE__ */ __name((user, url) => `\u{1F3AC} Clip creado por <span style="color:#FF69B4">@${user}</span>: ${url}`, "clip"),
    shoutout: /* @__PURE__ */ __name((user, game) => `\xA1Vayan a seguir a <span style="color:#bf94ff">@${user}</span>! Estaba jugando ${game}`, "shoutout")
  }
};
export {
  UIMessages
};
