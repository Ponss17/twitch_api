import express from 'express';
import * as authController from './auth.controller';
import { validate } from '../../core/middleware/validate';
import { loginSchema, callbackSchema, exchangeSchema, overlayExchangeSchema } from './auth.schema';
import { csrfProtection } from '../../core/middleware/csrfProtection';
import { requireCookieSession } from '../../core/middleware/requireCookieSession';
import { authRateLimiter } from '../../core/middleware/redisRateLimiter';

const router = express.Router();


// codeql[js/missing-rate-limiting]
router.get('/twitch', authRateLimiter, validate(loginSchema), authController.login);
// codeql[js/missing-rate-limiting]
router.get('/twitch/callback', authRateLimiter, validate(callbackSchema), authController.callback);
// codeql[js/missing-rate-limiting]
router.get('/exchange', authRateLimiter, validate(exchangeSchema), authController.exchange);
// codeql[js/missing-rate-limiting]
router.post('/exchange', authRateLimiter, csrfProtection, validate(exchangeSchema), authController.exchange);
// codeql[js/missing-rate-limiting]
router.post('/logout', authRateLimiter, csrfProtection, authController.logout);
// codeql[js/missing-rate-limiting]
router.get('/overlay-exchange', authRateLimiter, validate(overlayExchangeSchema), authController.overlayExchange);

router.get(
    '/discord',
    requireCookieSession,
    authRateLimiter,
    // codeql[js/missing-rate-limiting]
    authController.discordLinkStart
);
// codeql[js/missing-rate-limiting]
router.get('/discord/callback', authRateLimiter, authController.discordLinkCallback);
router.post(
    '/discord/unlink',
    requireCookieSession,
    authRateLimiter,
    csrfProtection,
    // codeql[js/missing-rate-limiting]
    authController.discordUnlink
);

export default router;
