import { Router } from 'express';
import {
    createClip,
    followage,
    sendMessage,
    getShoutout
} from '../controllers/twitch/commandsController';
import checkToken from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { createClipSchema, followageSchema, shoutoutSchema } from '../schemas/requestSchemas';

const router = Router();

router.get('/create-clip', checkToken, validate(createClipSchema), createClip);
router.get('/followage', checkToken, validate(followageSchema), followage);
router.get('/shoutout', checkToken, validate(shoutoutSchema), getShoutout);
router.post('/send-message', checkToken, sendMessage);

export default router;
