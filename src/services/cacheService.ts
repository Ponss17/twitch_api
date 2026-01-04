import NodeCache from 'node-cache';

const userCache = new NodeCache({ stdTTL: 3600 });

export const getCachedUserId = (username: string): string | undefined => {
    return userCache.get<string>(username.toLowerCase());
};

export const setCachedUserId = (username: string, id: string): void => {
    userCache.set(username.toLowerCase(), id);
};

export default userCache;
