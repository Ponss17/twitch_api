import express, { Request, Response, NextFunction } from 'express';

const router = express.Router();

const lazyRouter = (loader: () => Promise<{ default: express.Router }>) => {
    let cached: express.Router | null = null;
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!cached) {
            const mod = await loader();
            cached = mod.default;
        }
        cached(req, res, next);
    };
};

router.use(
    '/minigames',
    lazyRouter(() => import('../features/games/games.routes'))
);
router.use(
    '/dashboard',
    lazyRouter(() => import('../features/dashboard/dashboard.routes'))
);
router.use(
    '/system',
    lazyRouter(() => import('../features/system/system.routes'))
);
router.use(
    '/',
    lazyRouter(() => import('../features/commands/commands.routes'))
);

export default router;
