"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: (req) => {
        const ua = req.get('User-Agent') || '';
        if (ua.includes('Nightbot') ||
            ua.includes('StreamElements') ||
            ua.includes('Mozilla') ||
            ua.includes('Chrome') ||
            ua.includes('Safari')) {
            return 100;
        }
        return 20;
    },
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.default = limiter;
