import { describe, expect, it } from '@jest/globals';
import { DEFAULT_GROQ_MODEL } from '../../backend/src/features/minigames/magic8.service';

describe('magic8.service model config', () => {
    it('exporta el model id por defecto de Groq', () => {
        expect(DEFAULT_GROQ_MODEL).toBe('openai/gpt-oss-120b');
    });
});
