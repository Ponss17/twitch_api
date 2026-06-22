import express from 'express';
import * as gamesController from './games.controller';
import { validate } from '../../core/middleware/validate';
import { askMagic8Schema, playRussianSchema, startDuelSchema } from './games.schema';

const router = express.Router();

router.get('/magic8', validate(askMagic8Schema), gamesController.askMagic8);
router.get('/russian', validate(playRussianSchema), gamesController.playRussian);
router.get('/duel', validate(startDuelSchema), gamesController.startDuel);

export default router;
