"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByApiKey = exports.getUser = exports.saveUser = void 0;
const kv_1 = require("@vercel/kv");
const USERS_KEY = 'twitch_users';
const saveUser = async (user) => {
    await kv_1.kv.hset(USERS_KEY, { [user.userId]: user });
};
exports.saveUser = saveUser;
const getUser = async (userId) => {
    const user = await kv_1.kv.hget(USERS_KEY, userId);
    return user || null;
};
exports.getUser = getUser;
const getUserByApiKey = async (apiKey) => {
    const allUsers = await kv_1.kv.hgetall(USERS_KEY);
    if (!allUsers)
        return null;
    return Object.values(allUsers).find(u => u.apiKey === apiKey) || null;
};
exports.getUserByApiKey = getUserByApiKey;
