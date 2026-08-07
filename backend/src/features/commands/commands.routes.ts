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

router.get('/create-clip', validate(createClipSchema), /* codeql[js/missing-rate-limiting] */ createClip);
router.get('/followage', validate(followageSchema), /* codeql[js/missing-rate-limiting] */ followage);
router.get('/shoutout', validate(shoutoutSchema), /* codeql[js/missing-rate-limiting] */ getShoutout);
router.post('/send-message', csrfProtection, validate(sendMessageSchema), /* codeql[js/missing-rate-limiting] */ sendMessage);

export default router;
