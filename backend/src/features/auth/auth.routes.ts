import express from 'express';
import * as authController from './auth.controller';
import { validate } from '../../core/middleware/validate';
import { loginSchema, callbackSchema, exchangeSchema, overlayExchangeSchema } from './auth.schema';
import { csrfProtection } from '../../core/middleware/csrfProtection';

const router = express.Router();

// codeql[js/missing-rate-limiting] Rate limiting is applied globally
router.get('/twitch', validate(loginSchema), authController.login);
// codeql[js/missing-rate-limiting] Rate limiting is applied globally
router.get('/twitch/callback', validate(callbackSchema), authController.callback);
// codeql[js/missing-rate-limiting] Rate limiting is applied globally
router.get('/exchange', validate(exchangeSchema), authController.exchange);
// codeql[js/missing-rate-limiting] Rate limiting is applied globally
router.post('/logout', csrfProtection, authController.logout);
// codeql[js/missing-rate-limiting] Rate limiting is applied globally
router.get('/overlay-exchange', validate(overlayExchangeSchema), authController.overlayExchange);

// codeql[js/missing-rate-limiting] Rate limiting is applied globally
router.get('/discord', authController.discordLinkStart);
// codeql[js/missing-rate-limiting] Rate limiting is applied globally
router.get('/discord/callback', authController.discordLinkCallback);
// codeql[js/missing-rate-limiting] Rate limiting is applied globally
router.post('/discord/unlink', csrfProtection, authController.discordUnlink);

export default router;
