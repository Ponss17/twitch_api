import express from 'express';
import * as apiController from '../controllers/apiController';
import checkToken from '../middleware/authMiddleware';

const router = express.Router();

router.get('/create-clip', checkToken, apiController.createClip);
router.get('/get-clips', checkToken, apiController.getClips);
router.get('/followage', checkToken, apiController.followage);
router.get('/validate', checkToken, apiController.validateToken);
router.post('/regenerate-key', checkToken, apiController.regenerateKey);
router.get('/analytics', checkToken, apiController.getAnalytics);
router.get('/chatters', checkToken, apiController.getChatters);
router.get('/user-info', checkToken, apiController.getUserInfo);
router.post('/send-message', checkToken, apiController.sendMessage);

export default router;
