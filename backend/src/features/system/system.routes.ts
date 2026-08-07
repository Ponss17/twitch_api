import express from 'express';
import * as systemController from './system.controller';

import { validate } from '../../core/middleware/validate';
import { regenerateKeySchema, submitFeedbackSchema } from './system.schema';

import { csrfProtection } from '../../core/middleware/csrfProtection';

const router = express.Router();

// codeql[js/missing-rate-limiting] Rate limiting is applied globally via app.use in startup/routes.ts
router.get('/validate', systemController.validateToken);
// codeql[js/missing-rate-limiting] Rate limiting is applied globally via app.use in startup/routes.ts
router.post(
    '/regenerate-key',
    csrfProtection,
    validate(regenerateKeySchema),
    systemController.regenerateKey
);
// codeql[js/missing-rate-limiting] Rate limiting is applied globally
router.post(
    '/feedback',
    csrfProtection,
    validate(submitFeedbackSchema),
    systemController.submitFeedback
);
// codeql[js/missing-rate-limiting] Rate limiting is applied globally
router.get('/health', systemController.getHealth);
// codeql[js/missing-rate-limiting] Rate limiting is applied globally
router.get('/realtime-token', systemController.generateRealtimeToken);

export default router;
