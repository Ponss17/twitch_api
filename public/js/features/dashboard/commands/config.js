var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { CommandGenerator } from "../../../shared/utils/commandGenerator.js";
const COMMAND_CONFIG = {
  follow: {
    id: "follow",
    containerId: "command-card-followage",
    title: "Comando !followage",
    icon: "fa-solid fa-wrench",
    desc: "Muestra cu\xE1nto tiempo lleva alguien sigui\xE9ndote",
    info: "Genera el c\xF3digo para que tu bot responda con el tiempo exacto que un usuario te sigue.",
    templatePlaceholder: "Ej: {user} lleva sufriendo {time}.",
    templateVars: "Variables: {user}, {time}, {channel}",
    generate: /* @__PURE__ */ __name((domain, login, tokenParam, bot, templateVal, queryParams) => {
      const botUtils = CommandGenerator.bots[bot] || CommandGenerator.bots.nightbot;
      const userArg = bot === "wizebot" ? "$(user_name)" : botUtils.arg("user");
      if (templateVal) queryParams += `&template=${encodeURIComponent(templateVal)}`;
      queryParams += `&user=${userArg}`;
      const cmd = CommandGenerator.generate(bot, `${domain}/followage`, queryParams);
      return {
        full: `!addcom !followage ${cmd}`,
        url: cmd
      };
    }, "generate")
  },
  clip: {
    id: "clip",
    containerId: "command-card-clip",
    title: "Comando !clip",
    icon: "fa-solid fa-video",
    desc: "Permite crear clips desde el chat",
    info: "Tus moderadores podr\xE1n crear clips instant\xE1neos escribiendo !clip. Requiere estar en vivo.",
    templatePlaceholder: "Ej: \xA1Miren este clip de {user}! \u{1F449} {url}",
    templateVars: "Variables: {user}, {url}",
    generate: /* @__PURE__ */ __name((domain, login, tokenParam, bot, templateVal, queryParams) => {
      const botUtils = CommandGenerator.bots[bot] || CommandGenerator.bots.nightbot;
      const userArg = bot === "nightbot" ? "$(user)" : bot === "wizebot" ? "$(user_name)" : "${user}";
      const titleArg = botUtils.arg("query") || botUtils.arg("args") || "";
      if (titleArg) queryParams += `&title=${titleArg}`;
      const apiCall = CommandGenerator.generate(bot, `${domain}/create-clip`, queryParams);
      let cmd = "";
      if (templateVal) {
        cmd = templateVal.replace("{user}", userArg).replace("{url}", apiCall);
      } else {
        cmd = `\u{1F3AC} Clip creado por ${userArg}: ${apiCall}`;
      }
      return {
        full: `!addcom !clip ${cmd}`,
        url: cmd
      };
    }, "generate")
  },
  shoutout: {
    id: "shoutout",
    containerId: "command-card-shoutout",
    title: "Comando !so",
    icon: "fa-solid fa-bullhorn",
    desc: "Promociona a otro streamer",
    info: "Genera un enlace para que tu bot haga un Shoutout con el juego y el enlace del canal.",
    templatePlaceholder: "Ej: Dale follow a {user}, jugando {game} \u{1F449} {url}",
    templateVars: "Variables disponibles: {user}, {game}, {url}",
    generate: /* @__PURE__ */ __name((domain, login, tokenParam, bot, templateVal, queryParams) => {
      const botUtils = CommandGenerator.bots[bot];
      const targetArg = botUtils.arg("touser") || botUtils.arg("1");
      if (templateVal) queryParams += `&template=${encodeURIComponent(templateVal)}`;
      queryParams += `&touser=${targetArg}`;
      const cmd = CommandGenerator.generate(bot, `${domain}/shoutout`, queryParams);
      return {
        full: `!addcom !so ${cmd}`,
        url: cmd
      };
    }, "generate")
  },
  magic8: {
    id: "magic8",
    containerId: "command-card-magic8",
    title: "Comando !8ball",
    icon: "fa-solid fa-8",
    desc: "Comando para que tus viewers pregunten a la IA",
    info: "Genera el c\xF3digo para a\xF1adir el comando de la Bola 8 a tu bot de chat.",
    extraSelectors: [
      {
        id: "mood",
        label: "Personalidad",
        icon: "fa-solid fa-masks-theater",
        options: [
          { value: "classic", label: "Cl\xE1sica" },
          { value: "sarcastic", label: "Sarc\xE1stica" },
          { value: "toxic", label: "T\xF3xica" },
          { value: "helpful", label: "Servicial" }
        ]
      }
    ],
    generate: /* @__PURE__ */ __name((domain, login, tokenParam, bot, templateVal, queryParams, extraValues) => {
      const botUtils = CommandGenerator.bots[bot];
      const mood = extraValues.mood || "classic";
      if (templateVal) queryParams += `&template=${encodeURIComponent(templateVal)}`;
      queryParams += `&mood=${mood}`;
      const userArg = bot === "wizebot" ? "$(user_name)" : botUtils.arg("user");
      queryParams += `&user=${userArg}`;
      const queryArg = botUtils.arg("query") || botUtils.arg("args") || "(?)";
      queryParams += `&question=${queryArg}`;
      const magicUrl = domain.includes("/minigames") ? `${domain}/magic8` : `${domain}/minigames/magic8`;
      const cmd = CommandGenerator.generate(bot, magicUrl, queryParams);
      return {
        full: `!addcom !8ball ${cmd}`,
        url: cmd
      };
    }, "generate")
  },
  russian: {
    id: "russian",
    containerId: "command-card-russian",
    title: "Comando !ruleta",
    icon: "fa-solid fa-skull-crossbones",
    desc: "Juego de Ruleta Rusa para el chat",
    info: "Tus viewers podr\xE1n jugar a la Ruleta Rusa escribiendo !ruleta. \xA1Cuidado con la bala!",
    extraSelectors: [
      {
        id: "hardcore",
        label: "Modo Hardcore",
        icon: "fa-solid fa-skull",
        options: [
          { value: "false", label: "Desactivado" },
          { value: "true", label: "Activado (60s timeout)" }
        ]
      }
    ],
    generate: /* @__PURE__ */ __name((domain, login, tokenParam, bot, templateVal, queryParams, extraValues) => {
      const botUtils = CommandGenerator.bots[bot];
      const userArg = bot === "wizebot" ? "$(user_name)" : botUtils.arg("user");
      const isHardcore = extraValues.hardcore === "true";
      queryParams += `&user=${userArg}&hardcore=${isHardcore}`;
      const russianUrl = domain.includes("/minigames") ? `${domain}/russian` : `${domain}/minigames/russian`;
      const cmd = CommandGenerator.generate(bot, russianUrl, queryParams);
      return {
        full: `!addcom !ruleta ${cmd}`,
        url: cmd
      };
    }, "generate")
  },
  duel: {
    id: "duel",
    containerId: "command-card-duel",
    title: "Comando !duelo",
    icon: "fa-solid fa-khanda",
    desc: "Juego de Duelo 1vs1 para el chat",
    info: "Tus viewers podr\xE1n retarse a duelos narrativos escribiendo !duelo @usuario.",
    generate: /* @__PURE__ */ __name((domain, login, tokenParam, bot, templateVal, queryParams) => {
      const botUtils = CommandGenerator.bots[bot];
      const challengerArg = bot === "wizebot" ? "$(user_name)" : botUtils.arg("user");
      const targetArg = botUtils.arg("touser") || botUtils.arg("1");
      queryParams += `&challenger=${challengerArg}&target=${targetArg}`;
      const duelUrl = domain.includes("/minigames") ? `${domain}/duel` : `${domain}/minigames/duel`;
      const cmd = CommandGenerator.generate(bot, duelUrl, queryParams);
      return {
        full: `!addcom !duelo ${cmd}`,
        url: cmd
      };
    }, "generate")
  }
};
export {
  COMMAND_CONFIG
};
