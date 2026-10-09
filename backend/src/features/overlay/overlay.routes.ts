import { Router } from 'express';
import * as overlayController from './overlay.controller';
import { csrfProtection } from '../../core/middleware/csrfProtection';
import { requireCookieSession } from '../../core/middleware/requireCookieSession';
import { globalRateLimiter } from '../../core/middleware/redisRateLimiter';
import { validate } from '../../core/middleware/validate';
import { overlayToolParamSchema, putOverlayStateSchema, overlayLinkSchema } from './overlay.schema';

/**
 * Overlay OBS — montado bajo `/dashboard` (mismas URLs canónicas):
 * `/overlay-state/:tool`, `/overlay-link`.
 */
const router = Router();

router.get(
    '/overlay-state/:tool',
    globalRateLimiter,
    validate(overlayToolParamSchema),
    /* codeql[js/missing-rate-limiting] */ overlayController.getOverlayState
);
router.put(
    '/overlay-state/:tool',
    requireCookieSession,
    globalRateLimiter,
    csrfProtection,
    validate(putOverlayStateSchema),
    /* codeql[js/missing-rate-limiting] */ overlayController.putOverlayState
);
router.post(
    '/overlay-link',
    requireCookieSession,
    globalRateLimiter,
    csrfProtection,
    validate(overlayLinkSchema),
    /* codeql[js/missing-rate-limiting] */ overlayController.createOverlayLink
);

export default router;
