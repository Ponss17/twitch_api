import express from 'express';
import * as gamesController from './games.controller';
import { validate } from '../../core/middleware/validate';
import { askMagic8Schema, playRussianSchema, startDuelSchema } from './games.schema';
import { globalRateLimiter } from '../../core/middleware/redisRateLimiter';

const router = express.Router();

router.get('/magic8', globalRateLimiter, validate(askMagic8Schema), /* codeql[js/missing-rate-limiting] */ gamesController.askMagic8);
router.get('/russian', globalRateLimiter, validate(playRussianSchema), /* codeql[js/missing-rate-limiting] */ gamesController.playRussian);
router.get('/duel', globalRateLimiter, validate(startDuelSchema), /* codeql[js/missing-rate-limiting] */ gamesController.startDuel);

export default router;
