export const fillTemplate = (templateRaw: string, variables: Record<string, string>): string => {
    let output = templateRaw.replace(/[\r\n]/g, '');
    for (const [name, value] of Object.entries(variables)) {
        output = output.split(`{${name}}`).join(value);
    }
    return output;
};
