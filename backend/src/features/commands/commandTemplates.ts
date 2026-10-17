/** Comandos de moderación que Nightbot/SE ejecutarían si la respuesta empieza así. /me se deja pasar. */
const MOD_CHAT_COMMAND =
    /^(?:\/|\.)(?:ban|unban|timeout|untimeout|mod|unmod|vip|unvip|raid|unraid|host|unhost|clear|slow|slowoff|followers|followersoff|subscribers|subscribersoff|emoteonly|emoteonlyoff|r9kbeta|uniquechat|delete|purge|commercial|marker|disconnect)\b/i;

const TEMPLATE_MAX = 500;

/** Quita controles, saltos y overrides bidi para que un valor no parta el mensaje ni lo oculte. */
function stripChatControls(value: string): string {
    let out = '';
    const cap = Math.min(value.length, TEMPLATE_MAX);
    for (let i = 0; i < cap; i++) {
        const code = value.charCodeAt(i);
        if (code < 32 || code === 127) continue;
        if (code >= 0x202a && code <= 0x202e) continue;
        if (code >= 0x2066 && code <= 0x2069) continue;
        out += value[i];
    }
    return out;
}

/** Evita que el bot ejecute un comando de mod si la plantilla o un valor lo colocan al inicio. */
function neutralizeModCommand(message: string): string {
    const trimmed = message.trimStart();
    if (!MOD_CHAT_COMMAND.test(trimmed)) return message;
    const lead = message.slice(0, message.length - trimmed.length);
    return `${lead}\u2060${trimmed}`;
}

export const fillTemplate = (templateRaw: string, variables: Record<string, string>): string => {
    let output = stripChatControls(templateRaw);
    for (const [name, value] of Object.entries(variables)) {
        output = output.split(`{${name}}`).join(stripChatControls(value));
    }
    return neutralizeModCommand(output);
};
