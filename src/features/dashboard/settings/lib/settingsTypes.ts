export type ClearDataScopes = {
    stats: boolean;
    questions: boolean;
};

export type SettingsDangerModal = {
    title: string;
    desc: string;
    word: string;
    confirmLabel?: string;
    action: () => Promise<void>;
    /** Selective wipe options for “Reiniciar Estadísticas”. */
    clearScopes?: ClearDataScopes;
    onClearScopesChange?: (scopes: ClearDataScopes) => void;
};
