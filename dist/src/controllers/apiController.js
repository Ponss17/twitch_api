"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.followage = exports.getClips = exports.createClip = void 0;
const axios_1 = __importDefault(require("axios"));
const apiService = __importStar(require("../services/apiService"));
const createClip = async (req, res) => {
    const { channel } = req.query;
    if (!channel)
        return res.status(400).send('Falta el parámetro channel.');
    const token = req.twitchToken || req.query.token;
    if (!token)
        return res.status(401).send('Token no proporcionado.');
    try {
        const result = await apiService.createClip(channel, token);
        return res.send(`🎬 Clip creado con éxito! ${result}`);
    }
    catch (error) {
        let status = 500;
        let msg = 'Error interno del servidor';
        if (axios_1.default.isAxiosError(error)) {
            status = error.response?.status || 500;
            msg = error.response?.data?.message || error.message;
        }
        else {
            const err = error;
            if (err.status && err.message) {
                status = err.status;
                msg = err.message;
            }
            else if (error instanceof Error) {
                msg = error.message;
            }
        }
        if (status === 401) {
            return res.send('⛔ Error: Token inválido o expirado. Por favor, vuelve a iniciar sesión en el panel para generar uno nuevo.');
        }
        if (status === 404)
            return res.send(msg);
        console.error('Error creando clip:', msg);
        return res.send(`❌ Error: ${msg}`);
    }
};
exports.createClip = createClip;
const getClips = async (req, res) => {
    const { channel, limit } = req.query;
    const limitNum = parseInt(limit) || 5;
    if (!channel)
        return res.status(400).json({ error: 'Falta channel' });
    const token = req.twitchToken || req.query.token;
    if (!token)
        return res.status(401).json({ error: 'Token no requerido' });
    try {
        const clips = await apiService.getClips(channel, limitNum, token);
        res.json(clips);
    }
    catch (error) {
        let status = 500;
        let msg = 'Error obteniendo clips';
        if (axios_1.default.isAxiosError(error)) {
            status = error.response?.status || 500;
            msg = error.response?.data?.message || error.message;
        }
        if (status === 401) {
            return res.status(401).json({ error: 'Token inválido o expirado. Relogueate.' });
        }
        console.error('Error fetching clips:', msg);
        res.status(status).json({ error: msg });
    }
};
exports.getClips = getClips;
const followage = async (req, res) => {
    const { channel, user } = req.query;
    if (!channel || !user) {
        return res.status(400).send('Faltan parámetros: channel y user son requeridos.');
    }
    const token = req.twitchToken || req.query.token;
    if (!token)
        return res.status(401).send('Token no proporcionado.');
    try {
        const result = await apiService.getFollowAge(channel, user, token);
        return res.send(result);
    }
    catch (error) {
        let status = 500;
        let msg = 'Error interno del servidor';
        if (axios_1.default.isAxiosError(error)) {
            status = error.response?.status || 500;
            msg = error.response?.data?.message || error.message;
        }
        else {
            const err = error;
            if (err.status)
                status = err.status;
            if (err.message)
                msg = err.message;
        }
        if (status === 401) {
            return res.send('⛔ Error: Token expirado. Vuelve a loguearte en el panel.');
        }
        console.error('Error General:', msg);
        res.send('❌ Error interno del servidor.');
    }
};
exports.followage = followage;
