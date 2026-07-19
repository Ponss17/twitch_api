export type SettingsDangerModal = {
    title: string;
    desc: string;
    word: string;
    confirmLabel?: string;
    action: () => Promise<void>;
};
