import express from 'express';
import * as authController from './auth.controller';
import { validate } from '../../core/middleware/validate';
import { loginSchema, callbackSchema, exchangeSchema, overlayExchangeSchema } from './auth.schema';
import { csrfProtection } from '../../core/middleware/csrfProtection';
import { authRateLimiter } from '../../core/middleware/redisRateLimiter';

const router = express.Router();


router.get('/twitch', authRateLimiter, validate(loginSchema), /* codeql[js/missing-rate-limiting] */ authController.login);
router.get('/twitch/callback', authRateLimiter, validate(callbackSchema), /* codeql[js/missing-rate-limiting] */ authController.callback);
router.get('/exchange', authRateLimiter, validate(exchangeSchema), /* codeql[js/missing-rate-limiting] */ authController.exchange);
router.post('/logout', authRateLimiter, csrfProtection, /* codeql[js/missing-rate-limiting] */ authController.logout);
router.get('/overlay-exchange', authRateLimiter, validate(overlayExchangeSchema), /* codeql[js/missing-rate-limiting] */ authController.overlayExchange);

router.get('/discord', authRateLimiter, /* codeql[js/missing-rate-limiting] */ authController.discordLinkStart);
router.get('/discord/callback', authRateLimiter, /* codeql[js/missing-rate-limiting] */ authController.discordLinkCallback);
router.post('/discord/unlink', authRateLimiter, csrfProtection, /* codeql[js/missing-rate-limiting] */ authController.discordUnlink);

export default router;
