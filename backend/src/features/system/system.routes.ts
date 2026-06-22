import express from 'express';
import * as systemController from './system.controller';

import checkToken from '../../core/middleware/authMiddleware';
import { validate } from '../../core/middleware/validate';
import { submitFeedbackSchema } from './system.schema';

import { csrfProtection } from '../../core/middleware/csrfProtection';

const router = express.Router();

router.get('/validate', checkToken, systemController.validateToken);
router.post('/regenerate-key', checkToken, csrfProtection, systemController.regenerateKey);
router.post(
    '/feedback',
    checkToken,
    csrfProtection,
    validate(submitFeedbackSchema),
    systemController.submitFeedback
);
router.get('/health', checkToken, systemController.getHealth);
router.get('/realtime-token', checkToken, systemController.generateRealtimeToken);

export default router;
