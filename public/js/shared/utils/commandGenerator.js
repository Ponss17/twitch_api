var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
const CommandGenerator = {
  masks: {
    apiKey: "**************",
    token: "**************"
  },
  bots: {
    nightbot: {
      urlfetch: /* @__PURE__ */ __name((url) => `$(urlfetch ${url})`, "urlfetch"),
      arg: /* @__PURE__ */ __name((name) => {
        if (name === "user") return "$(touser)";
        if (name === "query") return "$(querystring)";
        return `$(${name})`;
      }, "arg")
    },
    streamelements: {
      urlfetch: /* @__PURE__ */ __name((url) => `$(customapi ${url})`, "urlfetch"),
      arg: /* @__PURE__ */ __name((name) => `\${${name}}`, "arg")
    },
    fossabot: {
      urlfetch: /* @__PURE__ */ __name((url) => `$(customapi ${url})`, "urlfetch"),
      arg: /* @__PURE__ */ __name((name) => {
        if (name === "user") return "{{user.name}}";
        return `{{${name}}}`;
      }, "arg")
    },
    wizebot: {
      urlfetch: /* @__PURE__ */ __name((url) => `$(urlfetch ${url})`, "urlfetch"),
      arg: /* @__PURE__ */ __name((name) => `$(arg_${name === "user" ? "1" : name})`, "arg")
    }
  },
  generate(botName, url, queryParams) {
    const bot = this.bots[botName] || this.bots.nightbot;
    const fullUrl = `${url}?${queryParams}`;
    return bot.urlfetch(fullUrl);
  },
  maskSecrets(cmd, secrets = {}) {
    let masked = cmd;
    if (secrets.apiKey) masked = masked.split(secrets.apiKey).join(this.masks.apiKey);
    if (secrets.token) masked = masked.split(secrets.token).join(this.masks.token);
    return masked;
  }
};
export {
  CommandGenerator
};
