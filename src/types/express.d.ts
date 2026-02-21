import { TwitchUser } from './twitch';

declare global {
    namespace Express {
        interface Request {
            twitchToken?: string;
            twitchUser?: TwitchUser;
            userId?: string;
            login?: string;
            displayName?: string;
        }
    }
}
