import crypto from 'crypto';
import {
    bitsWinnerChatMessage,
    isEventSubTimestampFresh,
    matchesBitsThreshold,
    normalizePrizeOptions,
    verifyEventSubSignature
} from '../../backend/src/features/alerts/bitsRoulette.logic';

describe('bitsRoulette.logic', () => {
    it('matches exact and min thresholds', () => {
        expect(matchesBitsThreshold(100, 100, 'exact')).toBe(true);
        expect(matchesBitsThreshold(101, 100, 'exact')).toBe(false);
        expect(matchesBitsThreshold(100, 100, 'min')).toBe(true);
        expect(matchesBitsThreshold(250, 100, 'min')).toBe(true);
        expect(matchesBitsThreshold(50, 100, 'min')).toBe(false);
    });

    it('normalizes prize options', () => {
        expect(normalizePrizeOptions(['  a ', '', 'b'])).toEqual(['a', 'b']);
        expect(normalizePrizeOptions(['solo'])).toHaveLength(3);
    });

    it('verifies EventSub HMAC signature', () => {
        const secret = 'test_secret_value';
        const messageId = 'msg-1';
        const timestamp = '2026-01-01T00:00:00Z';
        const body = '{"challenge":"abc"}';
        const expected =
            'sha256=' +
            crypto.createHmac('sha256', secret).update(messageId + timestamp + body).digest('hex');
        expect(verifyEventSubSignature(secret, messageId, timestamp, body, expected)).toBe(true);
        expect(verifyEventSubSignature(secret, messageId, timestamp, body, 'sha256=deadbeef')).toBe(
            false
        );
    });

    it('rejects EventSub timestamps outside 10 minutes', () => {
        const now = Date.parse('2026-09-22T20:00:00.000Z');
        expect(isEventSubTimestampFresh('2026-09-22T20:00:00.000Z', now)).toBe(true);
        expect(isEventSubTimestampFresh('2026-09-22T19:51:00.000Z', now)).toBe(true);
        expect(isEventSubTimestampFresh('2026-09-22T19:49:00.000Z', now)).toBe(false);
        expect(isEventSubTimestampFresh('not-a-date', now)).toBe(false);
    });

    it('builds a chat line without commands or line breaks', () => {
        expect(bitsWinnerChatMessage('es', 'pons', 'VIP', 100)).toBe(
            '@pons ganó «VIP» en la ruleta de bits (100 bits)'
        );
        expect(bitsWinnerChatMessage('en', '/slash', 'premio\n2', 50)).toBe(
            '@slash won "premio 2" on the bits wheel (50 bits)'
        );
        expect(bitsWinnerChatMessage('es', '   ', 'VIP', 100)).toBeNull();
    });
});
