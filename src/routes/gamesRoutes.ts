import express from 'express';
import * as gamesController from '../controllers/games/gamesController';
import checkToken from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { magic8Schema } from '../schemas/requestSchemas';

const router = express.Router();

router.get('/magic8', checkToken, validate(magic8Schema), gamesController.askMagic8);
router.get('/russian', checkToken, gamesController.playRussian);
router.get('/duel', checkToken, gamesController.startDuel);

export default router;
