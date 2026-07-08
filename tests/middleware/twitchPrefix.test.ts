import { Request, Response, NextFunction } from 'express';
import { stripTwitchPrefix } from '../../backend/src/core/middleware/twitchPrefix';

describe('stripTwitchPrefix', () => {
    it('rewrites /twitch/followage to /followage', () => {
        const req = {
            path: '/twitch/followage',
            url: '/twitch/followage?apiKey=abc'
        } as Request;
        const next = jest.fn() as NextFunction;

        stripTwitchPrefix(req, {} as Response, next);

        expect(req.url).toBe('/followage?apiKey=abc');
        expect(next).toHaveBeenCalled();
    });

    it('rewrites /twitch to /', () => {
        const req = { path: '/twitch', url: '/twitch' } as Request;
        const next = jest.fn() as NextFunction;

        stripTwitchPrefix(req, {} as Response, next);

        expect(req.url).toBe('/');
    });

    it('leaves /api paths unchanged', () => {
        const req = { path: '/api/followage', url: '/api/followage' } as Request;
        const next = jest.fn() as NextFunction;

        stripTwitchPrefix(req, {} as Response, next);

        expect(req.url).toBe('/api/followage');
    });
});
