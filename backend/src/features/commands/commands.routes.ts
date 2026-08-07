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
import { globalRateLimiter } from '../../core/middleware/redisRateLimiter';

const router = Router();

router.get('/create-clip', globalRateLimiter, validate(createClipSchema), createClip);
router.get('/followage', globalRateLimiter, validate(followageSchema), followage);
router.get('/shoutout', globalRateLimiter, validate(shoutoutSchema), getShoutout);
router.post('/send-message', globalRateLimiter, csrfProtection, validate(sendMessageSchema), sendMessage);

export default router;
