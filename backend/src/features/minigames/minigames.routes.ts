import express from 'express';
import * as minigamesController from './minigames.controller';
import { validate } from '../../core/middleware/validate';
import { askMagic8Schema, playRussianSchema, startDuelSchema, playSlotsSchema } from './minigames.schema';
import { globalRateLimiter } from '../../core/middleware/redisRateLimiter';

const router = express.Router();

router.get('/magic8', globalRateLimiter, validate(askMagic8Schema), /* codeql[js/missing-rate-limiting] */ minigamesController.askMagic8);
router.get('/russian', globalRateLimiter, validate(playRussianSchema), /* codeql[js/missing-rate-limiting] */ minigamesController.playRussian);
router.get('/duel', globalRateLimiter, validate(startDuelSchema), /* codeql[js/missing-rate-limiting] */ minigamesController.startDuel);
router.get('/slots', globalRateLimiter, validate(playSlotsSchema), /* codeql[js/missing-rate-limiting] */ minigamesController.playSlots);

export default router;
