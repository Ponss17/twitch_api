import { Router } from 'express';
import {
    bitsRouletteConfigRateLimiter,
    globalRateLimiter
} from '../../core/middleware/redisRateLimiter';
import { requireCookieSession } from '../../core/middleware/requireCookieSession';
import { csrfProtection } from '../../core/middleware/csrfProtection';
import { validate } from '../../core/middleware/validate';
import {
    announceBitsWinnerHandler,
    bitsAlertAnnounceSchema,
    bitsAlertTestSchema,
    bitsAlertToggleSchema,
    getBitsAlertHandler,
    putBitsAlertHandler,
    testBitsAlertHandler
} from './bitsRoulette.controller';

const router = Router();

router.get('/bits-roulette', requireCookieSession, globalRateLimiter, getBitsAlertHandler);

router.put(
    '/bits-roulette',
    requireCookieSession,
    globalRateLimiter,
    bitsRouletteConfigRateLimiter,
    csrfProtection,
    validate(bitsAlertToggleSchema),
    putBitsAlertHandler
);

router.post(
    '/bits-roulette/announce',
    globalRateLimiter,
    bitsRouletteConfigRateLimiter,
    csrfProtection,
    validate(bitsAlertAnnounceSchema),
    announceBitsWinnerHandler
);

router.post(
    '/bits-roulette/test-spin',
    requireCookieSession,
    globalRateLimiter,
    bitsRouletteConfigRateLimiter,
    csrfProtection,
    validate(bitsAlertTestSchema),
    testBitsAlertHandler
);

export default router;
