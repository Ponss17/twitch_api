import express from 'express';
import * as systemController from './system.controller';

import { validate } from '../../core/middleware/validate';
import { regenerateKeySchema, submitFeedbackSchema } from './system.schema';

import { csrfProtection } from '../../core/middleware/csrfProtection';
import { globalRateLimiter } from '../../core/middleware/redisRateLimiter';

const router = express.Router();


router.get('/validate', globalRateLimiter, /* codeql[js/missing-rate-limiting] */ systemController.validateToken);
router.post(
    '/regenerate-key',
    globalRateLimiter,
    csrfProtection,
    validate(regenerateKeySchema),
    /* codeql[js/missing-rate-limiting] */ systemController.regenerateKey
);
router.post(
    '/feedback',
    globalRateLimiter,
    csrfProtection,
    validate(submitFeedbackSchema),
    /* codeql[js/missing-rate-limiting] */ systemController.submitFeedback
);
router.get('/health', globalRateLimiter, /* codeql[js/missing-rate-limiting] */ systemController.getHealth);
router.get('/realtime-token', globalRateLimiter, /* codeql[js/missing-rate-limiting] */ systemController.generateRealtimeToken);

export default router;
