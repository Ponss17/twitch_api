declare module 'tmi.js' {
    export interface Options {
        channels?: string[];
        connection?: { secure?: boolean; reconnect?: boolean };
        identity?: { username: string; password?: string };
        options?: {
            skipUpdatingEmotesets?: boolean;
            messages?: { emotes?: boolean };
        };
    }

    export interface ChatUserstate {
        username?: string;
        'display-name'?: string;
        [key: string]: unknown;
    }

    export class Client {
        constructor(opts: Options);
        connect(): Promise<[string, number]>;
        disconnect(): Promise<[string, number]>;
        on(
            event: 'message',
            handler: (
                channel: string,
                tags: ChatUserstate,
                message: string,
                self: boolean
            ) => void
        ): void;
        say(channel: string, message: string): Promise<[string]>;
    }
}
