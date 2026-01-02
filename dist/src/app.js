"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const helmet_1 = __importDefault(require("helmet"));
const env_1 = require("./config/env");
const rateLimiter_1 = __importDefault(require("./middleware/rateLimiter"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const apiRoutes_1 = __importDefault(require("./routes/apiRoutes"));
const app = (0, express_1.default)();
app.set('trust proxy', 1);
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        useDefaults: false,
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com", "https://*.twitch.tv", "https://*.jtvnw.net", "blob:"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https://*.jtvnw.net", "https://*.twitch.tv", "blob:"],
            connectSrc: ["'self'", "https://id.twitch.tv", "https://api.twitch.tv", "https://*.twitch.tv", "wss://*.twitch.tv", "blob:"],
            objectSrc: ["'none'"],
            frameSrc: ["'self'", "https://id.twitch.tv", "https://*.twitch.tv", "blob:"],
            workerSrc: ["'self'", "blob:"],
            childSrc: ["'self'", "blob:"]
        }
    },
    crossOriginEmbedderPolicy: false
}));
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(rateLimiter_1.default);
app.use((req, res, next) => {
    if (req.url.startsWith('/api/twitch')) {
        req.url = req.url.replace('/api/twitch', '') || '/';
    }
    next();
});
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
app.get('/docs', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public/docs.html'));
});
app.use('/auth', authRoutes_1.default);
app.use('/api', apiRoutes_1.default);
app.get('/health', (req, res) => {
    const isConfigured = !!(env_1.CONFIG.TWITCH_CLIENT_ID && env_1.CONFIG.TWITCH_CLIENT_SECRET);
    res.json({
        status: isConfigured ? 'ok' : 'maintenance',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '2.0.0 (TS)'
    });
});
exports.default = app;
