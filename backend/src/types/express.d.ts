declare global {
    namespace Express {
        interface Request {
            twitchToken?: string;
            userId?: string;
            login?: string;
            displayName?: string;
        }
    }
}

export {};
