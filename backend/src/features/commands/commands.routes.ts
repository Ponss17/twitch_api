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

const router = Router();

export const rejectCookieClipGet = (_req: Request, res: Response, next: NextFunction) => {
    if (res.locals.authSource !== 'cookie') return next();
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Usa POST para crear clips desde el panel.');
};

router.get('/create-clip', globalRateLimiter, rejectCookieClipGet, validate(createClipSchema), /* codeql[js/missing-rate-limiting] */ createClip);
router.post('/create-clip', globalRateLimiter, csrfProtection, validate(createClipPostSchema), /* codeql[js/missing-rate-limiting] */ createClip);
router.get('/followage', globalRateLimiter, validate(followageSchema), /* codeql[js/missing-rate-limiting] */ followage);
router.get('/shoutout', globalRateLimiter, validate(shoutoutSchema), /* codeql[js/missing-rate-limiting] */ getShoutout);
router.post('/send-message', globalRateLimiter, csrfProtection, validate(sendMessageSchema), /* codeql[js/missing-rate-limiting] */ sendMessage);
router.get('/watchtime', globalRateLimiter, validate(watchtimeSchema), /* codeql[js/missing-rate-limiting] */ watchtime);

export default router;
