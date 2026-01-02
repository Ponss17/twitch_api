"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIG = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
if (process.env.NODE_ENV !== 'production') {
    dotenv_1.default.config();
}
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    throw new Error('❌ Faltan variables de entorno críticas: TWITCH_CLIENT_ID y/o TWITCH_CLIENT_SECRET.');
}
exports.CONFIG = {
    PORT: process.env.PORT || 3000,
    TWITCH_CLIENT_ID: TWITCH_CLIENT_ID,
    TWITCH_CLIENT_SECRET: TWITCH_CLIENT_SECRET,
    TWITCH_REDIRECT_URI: process.env.TWITCH_REDIRECT_URI || 'https://losperris.site/api/twitch/auth/twitch/callback',
    NODE_ENV: process.env.NODE_ENV || 'development'
};
