import express from 'express';
import * as gamesController from './games.controller';
import { validate } from '../../core/middleware/validate';
import { askMagic8Schema, playRussianSchema, startDuelSchema } from './games.schema';

const router = express.Router();

router.get('/magic8', validate(askMagic8Schema), /* codeql[js/missing-rate-limiting] */ gamesController.askMagic8);
router.get('/russian', validate(playRussianSchema), /* codeql[js/missing-rate-limiting] */ gamesController.playRussian);
router.get('/duel', validate(startDuelSchema), /* codeql[js/missing-rate-limiting] */ gamesController.startDuel);

export default router;
