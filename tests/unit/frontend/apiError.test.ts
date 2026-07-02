import { extractApiErrorMessage, formatApiErrorForUi, parseHttpErrorBody } from '@/core/api/apiError';

describe('apiError (frontend)', () => {
    describe('extractApiErrorMessage', () => {
        it('reads unified API error', () => {
            expect(
                extractApiErrorMessage({
                    success: false,
                    error: { message: 'No autorizado', code: 'UNAUTHORIZED' }
                })
            ).toBe('No autorizado');
        });

        it('reads validation details', () => {
            expect(
                extractApiErrorMessage({
                    success: false,
                    error: {
                        message: 'Error de validación',
                        code: 'VALIDATION_ERROR',
                        details: [{ path: 'body.confirm', message: 'Confirmación incorrecta' }]
                    }
                })
            ).toBe('Confirmación incorrecta');
        });

        it('reads legacy error string', () => {
            expect(extractApiErrorMessage({ error: 'Legacy' })).toBe('Legacy');
        });
    });

    describe('formatApiErrorForUi', () => {
        it('prefixes plain messages', () => {
            expect(formatApiErrorForUi('Fallo')).toBe('⚠️ Fallo');
        });

        it('does not double-prefix', () => {
            expect(formatApiErrorForUi('⚠️ Ya existe')).toBe('⚠️ Ya existe');
        });
    });

    describe('parseHttpErrorBody', () => {
        it('parses JSON error text', () => {
            const body = JSON.stringify({
                success: false,
                error: { message: 'Rate limit', code: 'RATE_LIMITED' }
            });
            expect(parseHttpErrorBody(body)).toBe('Rate limit');
        });
    });
});
