import { Router } from 'express';
import { csrfProtection } from '../../core/middleware/csrfProtection';
import { globalRateLimiter, heavyRateLimiter, clipDownloadRateLimiter } from '../../core/middleware/redisRateLimiter';
import { validate } from '../../core/middleware/validate';
import { getClips, getChatters, trackToolUsage, getClipDownload } from './tools.controller';
import { getClipsSchema, getChattersSchema, trackUsageSchema, getClipDownloadSchema } from './tools.schema';

import {
    addQuestion,
    clearQuestions,
    deleteQuestion,
    listQuestions,
    updateQuestion
} from './questions.controller';
import {
    addQuestionSchema,
    clearQuestionsSchema,
    deleteQuestionSchema,
    listQuestionsSchema,
    updateQuestionSchema
} from './questions.schema';

/**
 * Herramientas del panel. Montadas bajo `/dashboard` (URLs canónicas):
 * `/api/dashboard/get-clips|chatters|track-usage|questions`.
 */
const router = Router();

router.get('/get-clips', heavyRateLimiter, validate(getClipsSchema), /* codeql[js/missing-rate-limiting] */ getClips);
router.get(
    '/clip-download',
    globalRateLimiter,
    clipDownloadRateLimiter,
    heavyRateLimiter,
    validate(getClipDownloadSchema),
    /* codeql[js/missing-rate-limiting] */ getClipDownload
);
router.get('/chatters', heavyRateLimiter, validate(getChattersSchema), /* codeql[js/missing-rate-limiting] */ getChatters);
router.post(
    '/track-usage',
    globalRateLimiter,
    csrfProtection,
    validate(trackUsageSchema),
    /* codeql[js/missing-rate-limiting] */ trackToolUsage
);

router.get(
    '/questions',
    globalRateLimiter,
    validate(listQuestionsSchema),
    /* codeql[js/missing-rate-limiting] */ listQuestions
);
router.post(
    '/questions',
    globalRateLimiter,
    csrfProtection,
    validate(addQuestionSchema),
    /* codeql[js/missing-rate-limiting] */ addQuestion
);
router.patch(
    '/questions/:id',
    globalRateLimiter,
    csrfProtection,
    validate(updateQuestionSchema),
    /* codeql[js/missing-rate-limiting] */ updateQuestion
);
router.delete(
    '/questions/:id',
    globalRateLimiter,
    csrfProtection,
    validate(deleteQuestionSchema),
    /* codeql[js/missing-rate-limiting] */ deleteQuestion
);
router.delete(
    '/questions',
    globalRateLimiter,
    csrfProtection,
    validate(clearQuestionsSchema),
    /* codeql[js/missing-rate-limiting] */ clearQuestions
);

export default router;
