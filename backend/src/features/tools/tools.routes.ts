import { Router } from 'express';
import { csrfProtection } from '../../core/middleware/csrfProtection';
import { globalRateLimiter, heavyRateLimiter } from '../../core/middleware/redisRateLimiter';
import { validate } from '../../core/middleware/validate';
import { getClips, getChatters, trackToolUsage } from './tools.controller';
import { getClipsSchema, getChattersSchema, trackUsageSchema } from './tools.schema';

/**
 * Herramientas del panel. Montadas bajo `/dashboard` (URLs canónicas):
 * `/api/dashboard/get-clips|chatters|track-usage`.
 */
const router = Router();

router.get('/get-clips', heavyRateLimiter, validate(getClipsSchema), /* codeql[js/missing-rate-limiting] */ getClips);
router.get('/chatters', heavyRateLimiter, validate(getChattersSchema), /* codeql[js/missing-rate-limiting] */ getChatters);
router.post(
    '/track-usage',
    globalRateLimiter,
    csrfProtection,
    validate(trackUsageSchema),
    /* codeql[js/missing-rate-limiting] */ trackToolUsage
);

export default router;
