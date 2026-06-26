import { describe, expect, it } from '@jest/globals';
import {
    analyzeMagic8Question,
    buildMagic8UserMessage,
    normalizeMagic8Question
} from '../../backend/src/features/games/magic8Question';
import { getMoodResponseGuide, resolveMagic8Mood } from '../../backend/src/features/games/magic8Moods';

describe('magic8Question', () => {
    describe('normalizeMagic8Question', () => {
        it('convierte fragmentos románticos en pregunta explícita', () => {
            expect(normalizeMagic8Question('ella me quiere')).toBe('¿ella me quiere?');
        });

        it('mantiene preguntas que ya tienen signos', () => {
            expect(normalizeMagic8Question('¿Voy a ganar el torneo?')).toBe('¿Voy a ganar el torneo?');
        });

        it('añade ¿ a preguntas con solo ? final', () => {
            expect(normalizeMagic8Question('deberia streamear hoy?')).toBe('¿deberia streamear hoy?');
        });
    });

    describe('analyzeMagic8Question', () => {
        it('clasifica preguntas de relación', () => {
            expect(analyzeMagic8Question('ella me quiere').type).toBe('relationship');
        });

        it('clasifica consejo de streaming', () => {
            expect(analyzeMagic8Question('deberia streamear hoy').type).toBe('advice');
        });

        it('clasifica resultado competitivo', () => {
            expect(analyzeMagic8Question('voy a ganar la promo').type).toBe('outcome');
        });
    });

    describe('buildMagic8UserMessage', () => {
        it('incluye modo y guía para relación en sarcástico', () => {
            const message = buildMagic8UserMessage('ella me quiere', '@streamer', 'sarcastic');
            expect(message).toContain('Modo activo: sarcastic');
            expect(message).toContain('sentimientos / relación');
            expect(message).toContain('drama romántico');
        });

        it('adapta guía al modo servicial', () => {
            const message = buildMagic8UserMessage('voy a ganar', '@streamer', 'helpful');
            expect(message).toContain('Modo activo: helpful');
            expect(message).toContain('Victoria asegurada');
        });
    });
});

describe('magic8Moods', () => {
    it('resuelve modos válidos y cae en clásico', () => {
        expect(resolveMagic8Mood('toxic')).toBe('toxic');
        expect(resolveMagic8Mood('invalid')).toBe('classic');
    });

    it('tiene guía distinta por modo para el mismo tipo', () => {
        const classic = getMoodResponseGuide('classic', 'relationship');
        const toxic = getMoodResponseGuide('toxic', 'relationship');
        expect(classic).not.toBe(toxic);
    });
});
