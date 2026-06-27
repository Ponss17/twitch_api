import { Router } from 'express';
import { createClip, followage, sendMessage, getShoutout } from './commands.controller';
import { validate } from '../../core/middleware/validate';
import {
    createClipSchema,
    followageSchema,
    shoutoutSchema,
    sendMessageSchema
} from './commands.schema';

import { csrfProtection } from '../../core/middleware/csrfProtection';

const router = Router();

router.get('/create-clip', validate(createClipSchema), createClip);
router.get('/followage', validate(followageSchema), followage);
router.get('/shoutout', validate(shoutoutSchema), getShoutout);
router.post('/send-message', csrfProtection, validate(sendMessageSchema), sendMessage);

export default router;
