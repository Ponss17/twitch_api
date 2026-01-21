import { Request, Response } from 'express';
import * as apiService from '../services/apiService';

interface AuthenticatedRequest extends Request {
    twitchToken?: string;
    userId?: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================
// MINIJUEGOS
// ==========================================

// Aquí irán los nuevos minijuegos
