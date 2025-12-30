const config = require('./src/config/env');
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimiter = require('./src/middleware/rateLimiter');
const authRoutes = require('./src/routes/authRoutes');
const apiRoutes = require('./src/routes/apiRoutes');
const app = express();

app.set('trust proxy', 1);
app.use(rateLimiter);
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
app.get('/status', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'app_status.html'));
});

app.get('/status.html', (req, res) => {
    res.redirect('status');
});

let lastCheckTime = 0;
let cachedStatus = null;
const CACHE_DURATION = 30000;

app.get('/health', (req, res) => {
    const now = Date.now();

    if (cachedStatus && (now - lastCheckTime < CACHE_DURATION)) {
        return res.json(cachedStatus);
    }

    const isConfigured = config.TWITCH_CLIENT_ID && config.TWITCH_CLIENT_SECRET;
    const authStatus = isConfigured ? 'operational' : 'maintenance';
    const apiStatus = 'operational';

    const memory = process.memoryUsage();

    cachedStatus = {
        status: (apiStatus === 'operational') ? 'ok' : 'issues',
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

if (require.main === module) {
    app.listen(config.PORT, () => {
        console.log(`Servidor (Modular) corriendo en http://localhost:${config.PORT}`);
    });
}

module.exports = app;
