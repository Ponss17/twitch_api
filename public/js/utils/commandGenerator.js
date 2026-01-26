export const CommandGenerator = {
    masks: {
        apiKey: '**************',
        token: '**************'
    },
    bots: {
        nightbot: {
            urlfetch: (url) => `$(urlfetch ${url})`,
            arg: (name) => {
                if (name === 'user')
                    return '$(touser)';
                if (name === 'query')
                    return '$(querystring)';
                return `$(${name})`;
            }
        },
        streamelements: {
            urlfetch: (url) => `$(customapi ${url})`,
            arg: (name) => `\${${name}}`
        },
        fossabot: {
            urlfetch: (url) => `$(customapi ${url})`,
            arg: (name) => {
                if (name === 'user')
                    return '{{user.name}}';
                return `{{${name}}}`;
            }
        },
        wizebot: {
            urlfetch: (url) => `$(urlfetch ${url})`,
            arg: (name) => `$(arg_${name === 'user' ? '1' : name})`
        }
    },
    generate(botName, url, queryParams) {
        const bot = this.bots[botName] || this.bots.nightbot;
        const fullUrl = `${url}?${queryParams}`;
        return bot.urlfetch(fullUrl);
    },
    maskSecrets(cmd, secrets = {}) {
        let masked = cmd;
        if (secrets.apiKey)
            masked = masked.replace(secrets.apiKey, this.masks.apiKey);
        if (secrets.token)
            masked = masked.replace(secrets.token, this.masks.token);
        return masked;
    }
};
