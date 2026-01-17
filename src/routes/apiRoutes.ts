import express from 'express';
import * as commandsController from '../controllers/commandsController';
import * as dashboardController from '../controllers/dashboardController';
import * as systemController from '../controllers/systemController';
import * as aiController from '../controllers/aiController';
import checkToken from '../middleware/authMiddleware';

const router = express.Router();

// IA
router.post('/ai/chat', checkToken, aiController.generateCommand);

// Comandos
router.get('/create-clip', checkToken, commandsController.createClip);
router.get('/followage', checkToken, commandsController.followage);
router.get('/shoutout', checkToken, commandsController.getShoutout);
router.post('/send-message', checkToken, commandsController.sendMessage);

// Dashboard
router.get('/get-clips', checkToken, dashboardController.getClips);
router.get('/analytics', checkToken, dashboardController.getAnalytics);
router.get('/chatters', checkToken, dashboardController.getChatters);
router.get('/user-info', checkToken, dashboardController.getUserInfo);

// Sistema
router.get('/validate', checkToken, systemController.validateToken);
router.post('/regenerate-key', checkToken, systemController.regenerateKey);
router.post('/feedback', checkToken, systemController.submitFeedback);

export default router;
