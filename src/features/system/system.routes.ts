import express from 'express';
import * as systemController from './system.controller';
import * as healthCron from './health.cron';
import checkToken from '../../core/middleware/authMiddleware';
import { validate } from '../../core/middleware/validate';
import { submitFeedbackSchema } from './system.schema';

const router = express.Router();

router.get('/validate', checkToken, systemController.validateToken);
router.post('/regenerate-key', checkToken, systemController.regenerateKey);
router.post(
    '/feedback',
    checkToken,
    validate(submitFeedbackSchema),
    systemController.submitFeedback
);
router.get('/health', checkToken, systemController.getHealth);
router.get('/health-cron', healthCron.runHealthCron);

export default router;
