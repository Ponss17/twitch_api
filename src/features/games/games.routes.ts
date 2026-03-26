import express from 'express';
import * as gamesController from './games.controller';
import checkToken from '../../core/middleware/authMiddleware';
import { validate } from '../../core/middleware/validate';
import { askMagic8Schema, playRussianSchema, startDuelSchema } from './games.schema';

const router = express.Router();

router.get('/magic8', checkToken, validate(askMagic8Schema), gamesController.askMagic8);
router.get('/russian', checkToken, validate(playRussianSchema), gamesController.playRussian);
router.get('/duel', checkToken, validate(startDuelSchema), gamesController.startDuel);

export default router;
