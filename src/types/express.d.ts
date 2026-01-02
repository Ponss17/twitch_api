import { TwitchUser } from './twitch';

declare global {
    namespace Express {
        interface Request {
            twitchToken?: string;
            twitchUser?: TwitchUser;
        }
    }
}
