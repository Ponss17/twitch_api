import express from 'express';
import * as authController from './auth.controller';
import { validate } from '../../core/middleware/validate';
import { loginSchema, callbackSchema, exchangeSchema, overlayExchangeSchema } from './auth.schema';
import { csrfProtection } from '../../core/middleware/csrfProtection';
import { authRateLimiter } from '../../core/middleware/redisRateLimiter';

const router = express.Router();

router.use(authRateLimiter);

router.get('/twitch', validate(loginSchema), /* codeql[js/missing-rate-limiting] */ authController.login);
router.get('/twitch/callback', validate(callbackSchema), /* codeql[js/missing-rate-limiting] */ authController.callback);
router.get('/exchange', validate(exchangeSchema), /* codeql[js/missing-rate-limiting] */ authController.exchange);
router.post('/logout', csrfProtection, /* codeql[js/missing-rate-limiting] */ authController.logout);
router.get('/overlay-exchange', validate(overlayExchangeSchema), /* codeql[js/missing-rate-limiting] */ authController.overlayExchange);

router.get('/discord', /* codeql[js/missing-rate-limiting] */ authController.discordLinkStart);
router.get('/discord/callback', /* codeql[js/missing-rate-limiting] */ authController.discordLinkCallback);
router.post('/discord/unlink', csrfProtection, /* codeql[js/missing-rate-limiting] */ authController.discordUnlink);

export default router;
