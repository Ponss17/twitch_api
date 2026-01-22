import express from 'express';
import * as commandsController from '../controllers/commandsController';
import * as dashboardController from '../controllers/dashboardController';
import * as systemController from '../controllers/systemController';
import * as gamesController from '../controllers/gamesController';
import checkToken from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { createClipSchema, magic8Schema } from '../schemas/requestSchemas';

const router = express.Router();

// Minijuegos
router.get('/minigames/magic8', checkToken, validate(magic8Schema), gamesController.askMagic8);


// Comandos
router.get('/create-clip', checkToken, validate(createClipSchema), commandsController.createClip);
router.get('/followage', checkToken, commandsController.followage);
router.get('/shoutout', checkToken, commandsController.getShoutout);
router.post('/send-message', checkToken, commandsController.sendMessage);

// Dashboard
router.get('/dashboard/get-clips', checkToken, dashboardController.getClips);
router.get('/dashboard/analytics', checkToken, dashboardController.getAnalytics);
router.get('/dashboard/chatters', checkToken, dashboardController.getChatters);
router.get('/dashboard/user-info', checkToken, dashboardController.getUserInfo);

// Sistema
router.get('/system/validate', checkToken, systemController.validateToken);
router.post('/system/regenerate-key', checkToken, systemController.regenerateKey);
router.post('/system/feedback', checkToken, systemController.submitFeedback);

export default router;
