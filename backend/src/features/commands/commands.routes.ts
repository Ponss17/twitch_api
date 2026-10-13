import { NextFunction, Request, Response, Router } from 'express';
import { createClip, followage, sendMessage, getShoutout, watchtime } from './commands.controller';
import { validate } from '../../core/middleware/validate';
import {
    createClipSchema,
    createClipPostSchema,
    followageSchema,
    shoutoutSchema,
    sendMessageSchema,
    watchtimeSchema
} from './commands.schema';

import { csrfProtection } from '../../core/middleware/csrfProtection';
import { globalRateLimiter } from '../../core/middleware/redisRateLimiter';
import { timed } from '../../core/utils/timing';

const timedGlobalRL = timed('globalRateLimiter', globalRateLimiter);

const router = Router();

export const rejectCookieClipGet = (_req: Request, res: Response, next: NextFunction) => {
    if (res.locals.authSource !== 'cookie') return next();
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Usa POST para crear clips desde el panel.');
};

router.get('/create-clip', timedGlobalRL, rejectCookieClipGet, validate(createClipSchema), /* codeql[js/missing-rate-limiting] */ createClip);
router.post('/create-clip', timedGlobalRL, csrfProtection, validate(createClipPostSchema), /* codeql[js/missing-rate-limiting] */ createClip);
router.get('/followage', timedGlobalRL, validate(followageSchema), /* codeql[js/missing-rate-limiting] */ followage);
router.get('/shoutout', timedGlobalRL, validate(shoutoutSchema), /* codeql[js/missing-rate-limiting] */ getShoutout);
router.post('/send-message', timedGlobalRL, csrfProtection, validate(sendMessageSchema), /* codeql[js/missing-rate-limiting] */ sendMessage);
router.get('/watchtime', timedGlobalRL, validate(watchtimeSchema), /* codeql[js/missing-rate-limiting] */ watchtime);

export default router;
