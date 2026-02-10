export interface CommandSelector {
    id: string;
    label: string;
    icon: string;
    options: { value: string; label: string }[];
}

export interface CommandConfigItem {
    id: string;
    containerId: string;
    title: string;
    icon: string;
    desc: string;
    info: string;
    templatePlaceholder?: string;
    templateVars?: string;
    extraSelectors?: CommandSelector[];
    generate: (
        domain: string,
        login: string,
        tokenParam: string,
        bot: string,
        templateVal: string,
        queryParams: string,
        extraValues: Record<string, string>
    ) => { full: string; url: string };
}
