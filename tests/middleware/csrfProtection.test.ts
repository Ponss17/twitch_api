import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { csrfProtection } from '../../backend/src/core/middleware/csrfProtection';

jest.mock('../../backend/src/core/config/origins', () => ({
    ALLOWED_ORIGINS: ['https://www.losperris.dev', 'http://localhost:4321']
}));

function mockRes() {
    const res = {
        statusCode: 200,
        body: undefined as unknown,
        status(code: number) {
            this.statusCode = code;
            return this;
        },
        json(payload: unknown) {
            this.body = payload;
            return this;
        }
    };
    return res as Response & { statusCode: number; body: unknown };
}

describe('csrfProtection', () => {
    let next: jest.Mock;

    beforeEach(() => {
        next = jest.fn();
    });

    it('allows GET without origin checks', () => {
        const req = { method: 'GET', headers: {} } as Request;
        csrfProtection(req, mockRes(), next as NextFunction);
        expect(next).toHaveBeenCalled();
    });

    it('allows POST with allowed Origin', () => {
        const req = {
            method: 'POST',
            headers: { origin: 'https://www.losperris.dev' }
        } as Request;
        csrfProtection(req, mockRes(), next as NextFunction);
        expect(next).toHaveBeenCalled();
    });

    it('blocks POST from unknown origins without bearer token', () => {
        const req = {
            method: 'POST',
            query: {},
            headers: { origin: 'https://evil.example' }
        } as Request;
        const res = mockRes();
        csrfProtection(req, res, next as NextFunction);
        expect(next).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(403);
    });

    it('blocks POST with Bearer token when origin is missing (sin bypass CSRF)', () => {
        const req = {
            method: 'POST',
            query: {},
            headers: { authorization: 'Bearer oauth-token' }
        } as Request;
        const res = mockRes();
        csrfProtection(req, res, next as NextFunction);
        expect(next).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(403);
    });

    it('allows POST with x-overlay-token without origin (OBS)', () => {
        const req = {
            method: 'POST',
            query: {},
            headers: { 'x-overlay-token': 'overlay_read_token' }
        } as Request;
        csrfProtection(req, mockRes(), next as NextFunction);
        expect(next).toHaveBeenCalled();
    });
});
