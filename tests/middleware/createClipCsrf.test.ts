import { NextFunction, Request, Response } from 'express';
import { rejectCookieClipGet } from '../../backend/src/features/commands/commands.routes';

const response = (authSource: string) =>
    ({
        locals: { authSource },
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis()
    }) as unknown as Response;

describe('create-clip GET CSRF guard', () => {
    it('rechaza sesiones cookie y dirige al POST protegido', () => {
        const res = response('cookie');
        const next = jest.fn() as NextFunction;

        rejectCookieClipGet({} as Request, res, next);

        expect(res.setHeader).toHaveBeenCalledWith('Allow', 'POST');
        expect(res.status).toHaveBeenCalledWith(405);
        expect(next).not.toHaveBeenCalled();
    });

    it.each(['apiKey', 'bearer'])('mantiene clientes %s en GET', (authSource) => {
        const next = jest.fn() as NextFunction;
        rejectCookieClipGet({} as Request, response(authSource), next);
        expect(next).toHaveBeenCalled();
    });
});
