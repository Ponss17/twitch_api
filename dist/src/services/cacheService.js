"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCachedUserId = exports.getCachedUserId = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
const userCache = new node_cache_1.default({ stdTTL: 3600 });
const getCachedUserId = (username) => {
    return userCache.get(username.toLowerCase());
};
exports.getCachedUserId = getCachedUserId;
const setCachedUserId = (username, id) => {
    userCache.set(username.toLowerCase(), id);
};
exports.setCachedUserId = setCachedUserId;
exports.default = userCache;
