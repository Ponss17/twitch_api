import express from 'express';
import * as systemController from './system.controller';

import { validate } from '../../core/middleware/validate';
import { regenerateKeySchema, submitFeedbackSchema } from './system.schema';

import { csrfProtection } from '../../core/middleware/csrfProtection';
import { globalRateLimiter } from '../../core/middleware/redisRateLimiter';

const router = express.Router();

router.use(globalRateLimiter);

router.get('/validate', /* codeql[js/missing-rate-limiting] */ systemController.validateToken);
router.post(
    '/regenerate-key',
    csrfProtection,
    validate(regenerateKeySchema),
    /* codeql[js/missing-rate-limiting] */ systemController.regenerateKey
);
router.post(
    '/feedback',
    csrfProtection,
    validate(submitFeedbackSchema),
    /* codeql[js/missing-rate-limiting] */ systemController.submitFeedback
);
router.get('/health', /* codeql[js/missing-rate-limiting] */ systemController.getHealth);
router.get('/realtime-token', /* codeql[js/missing-rate-limiting] */ systemController.generateRealtimeToken);

export default router;
