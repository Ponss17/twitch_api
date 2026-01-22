export const CommandGenerator = {
    masks: {
        apiKey: '**************',
        token: '**************'
    },

    bots: {
        nightbot: {
            urlfetch: (url) => `$(urlfetch ${url})`,
            arg: (idx) => `$(${idx === 'user' ? 'touser' : idx})`
        },
        streamelements: {
            urlfetch: (url) => `$(customapi ${url})`,
            arg: (idx) => `\${${idx}}`
        },
        fossabot: {
            urlfetch: (url) => `$(customapi ${url})`,
            arg: (idx) => `\${${idx}}`
        },
        wizebot: {
            urlfetch: (url) => `$(urlfetch ${url})`,
            arg: (idx) => `$(arg_${idx === 'user' ? '1' : idx})`
        }
    },

    generate(botName, url, queryParams) {
        const bot = this.bots[botName] || this.bots.nightbot;

        const fullUrl = `${url}?${queryParams}`;

        return bot.urlfetch(fullUrl);
    },

    maskSecrets(cmd, secrets = {}) {
        let masked = cmd;
        if (secrets.apiKey) masked = masked.replace(secrets.apiKey, this.masks.apiKey);
        if (secrets.token) masked = masked.replace(secrets.token, this.masks.token);
        return masked;
    }
};
