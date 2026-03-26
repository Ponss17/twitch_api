import express from 'express';
import * as authController from './auth.controller';
import { validate } from '../../core/middleware/validate';
import { loginSchema, callbackSchema } from './auth.schema';

const router = express.Router();

router.get('/twitch', validate(loginSchema), authController.login);
router.get('/twitch/callback', validate(callbackSchema), authController.callback);

export default router;
