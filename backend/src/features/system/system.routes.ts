import express from 'express';
import * as systemController from './system.controller';

import { validate } from '../../core/middleware/validate';
import { regenerateKeySchema, submitFeedbackSchema } from './system.schema';

import { csrfProtection } from '../../core/middleware/csrfProtection';
import { globalRateLimiter } from '../../core/middleware/redisRateLimiter';

const router = express.Router();


router.get('/validate', globalRateLimiter, systemController.validateToken);
router.post(
    '/regenerate-key',
    globalRateLimiter,
    csrfProtection,
    validate(regenerateKeySchema),
    systemController.regenerateKey
);
router.post(
    '/feedback',
    globalRateLimiter,
    csrfProtection,
    validate(submitFeedbackSchema),
    systemController.submitFeedback
);
router.get('/health', globalRateLimiter, systemController.getHealth);
router.get('/realtime-token', globalRateLimiter, systemController.generateRealtimeToken);

export default router;
