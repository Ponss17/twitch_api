import express from 'express';
import * as systemController from './system.controller';
import checkToken from '../../core/middleware/authMiddleware';

const router = express.Router();

router.get('/validate', checkToken, systemController.validateToken);
router.post('/regenerate-key', checkToken, systemController.regenerateKey);
router.post('/feedback', checkToken, systemController.submitFeedback);
router.get('/health', checkToken, systemController.getHealth);

export default router;
