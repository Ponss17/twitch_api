import express from 'express';
import * as authController from './auth.controller';
import { validate } from '../../core/middleware/validate';
import { loginSchema, callbackSchema, exchangeSchema, overlayExchangeSchema } from './auth.schema';
import { csrfProtection } from '../../core/middleware/csrfProtection';

const router = express.Router();

router.get('/twitch', validate(loginSchema), authController.login);
router.get('/twitch/callback', validate(callbackSchema), authController.callback);
router.get('/exchange', validate(exchangeSchema), authController.exchange);
router.post('/logout', csrfProtection, authController.logout);
router.get('/overlay-exchange', validate(overlayExchangeSchema), authController.overlayExchange);

export default router;
