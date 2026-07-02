export interface ChatLogItem {
    user: string;
    text: string;
    time: Date;
}

const MAX_LOG = 500;
let messageLog: ChatLogItem[] = [];

export const chatLogStore = {
    add(user: string, text: string) {
        messageLog.unshift({ user: user.toLowerCase(), text, time: new Date() });
        if (messageLog.length > MAX_LOG) messageLog.pop();
    },

    getByUser(login: string): ChatLogItem[] {
        const q = login.toLowerCase();
        return messageLog.filter((l) => l.user === q);
    },

    clear() {
        messageLog = [];
    }
};
