import express from 'express';
import * as authController from '../controllers/auth/authController';

const router = express.Router();

router.get('/twitch', authController.login);
router.get('/twitch/callback', authController.callback);

export default router;
