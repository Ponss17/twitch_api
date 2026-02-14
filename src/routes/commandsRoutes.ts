import express from 'express';
import * as commandsController from '../controllers/twitch/commandsController';
import checkToken from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { createClipSchema } from '../schemas/requestSchemas';

const router = express.Router();

router.get('/create-clip', checkToken, validate(createClipSchema), commandsController.createClip);
router.get('/followage', checkToken, commandsController.followage);
router.get('/shoutout', checkToken, commandsController.getShoutout);
router.post('/send-message', checkToken, commandsController.sendMessage);

export default router;
