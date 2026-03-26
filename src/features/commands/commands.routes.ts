import { Router } from 'express';
import { createClip, followage, sendMessage, getShoutout } from './commands.controller';
import checkToken from '../../core/middleware/authMiddleware';
import { validate } from '../../core/middleware/validate';
import {
    createClipSchema,
    followageSchema,
    shoutoutSchema,
    sendMessageSchema
} from './commands.schema';

const router = Router();

router.get('/create-clip', checkToken, validate(createClipSchema), createClip);
router.get('/followage', checkToken, validate(followageSchema), followage);
router.get('/shoutout', checkToken, validate(shoutoutSchema), getShoutout);
router.post('/send-message', checkToken, validate(sendMessageSchema), sendMessage);

export default router;
