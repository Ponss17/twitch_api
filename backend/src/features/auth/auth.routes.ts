import express from 'express';
import * as authController from './auth.controller';
import { validate } from '../../core/middleware/validate';
import { loginSchema, callbackSchema, exchangeSchema, overlayExchangeSchema } from './auth.schema';

const router = express.Router();

router.get('/twitch', validate(loginSchema), authController.login);
router.get('/twitch/callback', validate(callbackSchema), authController.callback);
router.get('/exchange', validate(exchangeSchema), authController.exchange);
router.get('/overlay-exchange', validate(overlayExchangeSchema), authController.overlayExchange);

export default router;
