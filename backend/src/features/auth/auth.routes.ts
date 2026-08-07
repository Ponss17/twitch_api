import express from 'express';
import * as authController from './auth.controller';
import { validate } from '../../core/middleware/validate';
import { loginSchema, callbackSchema, exchangeSchema, overlayExchangeSchema } from './auth.schema';
import { csrfProtection } from '../../core/middleware/csrfProtection';
import { authRateLimiter } from '../../core/middleware/redisRateLimiter';

const router = express.Router();


router.get('/twitch', authRateLimiter, validate(loginSchema), authController.login);
router.get('/twitch/callback', authRateLimiter, validate(callbackSchema), authController.callback);
router.get('/exchange', authRateLimiter, validate(exchangeSchema), authController.exchange);
router.post('/logout', authRateLimiter, csrfProtection, authController.logout);
router.get('/overlay-exchange', authRateLimiter, validate(overlayExchangeSchema), authController.overlayExchange);

router.get('/discord', authRateLimiter, authController.discordLinkStart);
router.get('/discord/callback', authRateLimiter, authController.discordLinkCallback);
router.post('/discord/unlink', authRateLimiter, csrfProtection, authController.discordUnlink);

export default router;
