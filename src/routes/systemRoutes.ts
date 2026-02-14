import express from 'express';
import * as systemController from '../controllers/system/systemController';
import checkToken from '../middleware/authMiddleware';

const router = express.Router();

router.get('/validate', checkToken, systemController.validateToken);
router.post('/regenerate-key', checkToken, systemController.regenerateKey);
router.post('/feedback', checkToken, systemController.submitFeedback);

export default router;
