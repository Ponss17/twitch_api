import express from 'express';
import * as gamesController from './games.controller';
import checkToken from '../../core/middleware/authMiddleware';
import { validate } from '../../core/middleware/validate';
import { magic8Schema, russianSchema, duelSchema } from '../../schemas/requestSchemas';

const router = express.Router();

router.get('/magic8', checkToken, validate(magic8Schema), gamesController.askMagic8);
router.get('/russian', checkToken, validate(russianSchema), gamesController.playRussian);
router.get('/duel', checkToken, validate(duelSchema), gamesController.startDuel);

export default router;
