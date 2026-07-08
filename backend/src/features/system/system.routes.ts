import express from 'express';
import * as systemController from './system.controller';

import { validate } from '../../core/middleware/validate';
import { regenerateKeySchema, submitFeedbackSchema } from './system.schema';

import { csrfProtection } from '../../core/middleware/csrfProtection';

const router = express.Router();

router.get('/validate', systemController.validateToken);
router.post(
    '/regenerate-key',
    csrfProtection,
    validate(regenerateKeySchema),
    systemController.regenerateKey
);
router.post(
    '/feedback',
    csrfProtection,
    validate(submitFeedbackSchema),
    systemController.submitFeedback
);
router.get('/health', systemController.getHealth);
router.get('/realtime-token', systemController.generateRealtimeToken);

export default router;
