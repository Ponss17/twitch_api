if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: (req) => {
        const ua = req.get('User-Agent') || '';
        if (
            ua.includes('Nightbot') ||
            ua.includes('StreamElements') ||
            ua.includes('Mozilla') ||
            ua.includes('Chrome') ||
            ua.includes('Safari')
        ) {
            return 100;
        }
        return 20;
    },
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.get('/status', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'app_status.html'));
});

app.get('/status.html', (req, res) => {
    res.redirect('/status');
});

let lastCheckTime = 0;
let cachedStatus = null;
const CACHE_DURATION = 30000;

app.get('/health', (req, res) => {
    const now = Date.now();

    if (cachedStatus && (now - lastCheckTime < CACHE_DURATION)) {
        return res.json(cachedStatus);
    }

    const token = require('./utils/tokenStore').getToken();
    const authStatus = token ? 'operational' : 'degraded';
    const apiStatus = 'operational';

    const memory = process.memoryUsage();

    cachedStatus = {
        status: (authStatus === 'operational' && apiStatus === 'operational') ? 'ok' : 'issues',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
            rss: Math.round(memory.rss / 1024 / 1024),
            heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
            heapUsed: Math.round(memory.heapUsed / 1024 / 1024)
        },
        services: {
            api_gateway: apiStatus,
            auth_service: authStatus
        },
        version: process.version
    };

    lastCheckTime = now;
    res.json(cachedStatus);
});

app.listen(PORT, () => {
    console.log(`Servidor (Modular) corriendo en http://localhost:${PORT}`);
});

module.exports = app;
