const apiService = require('../services/apiService');

const createClip = async (req, res) => {
    const { channel } = req.query;
    if (!channel) return res.status(400).send('Falta el parámetro channel.');

    try {
        const result = await apiService.createClip(channel, req.twitchToken);
        return res.send(`🎬 Clip creado con éxito! ${result}`);
    } catch (error) {
        if (error.status) return res.status(error.status).send(error.message);
        console.error('Error creando clip:', error.response?.data || error.message);
        return res.send('Error interno creando el clip.');
    }
};

const getClips = async (req, res) => {
    const { channel, limit } = req.query;
    const limitNum = limit || 5;
    if (!channel) return res.status(400).json({ error: 'Falta channel' });

    try {
        const clips = await apiService.getClips(channel, limitNum, req.twitchToken);
        res.json(clips);
    } catch (error) {
        if (error.status) return res.status(error.status).json({ error: error.message });
        console.error('Error fetching clips:', error.response?.data || error.message);
        res.status(500).json({ error: 'Error obteniendo clips' });
    }
};

const followage = async (req, res) => {
    const { channel, user } = req.query;

    if (!channel || !user) {
        return res.status(400).send('Faltan parámetros: channel y user son requeridos.');
    }

    try {
        const result = await apiService.getFollowAge(channel, user, req.twitchToken);
        return res.send(result);
    } catch (error) {
        console.error('Error General:', error.response?.data || error.message);
        res.status(500).send('Error interno del servidor.');
    }
};

module.exports = {
    createClip,
    getClips,
    followage
};
