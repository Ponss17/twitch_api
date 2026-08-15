import { sanitizePublicTwitchDescription } from '../../../backend/src/features/system/publicTwitchDescription';

describe('sanitizePublicTwitchDescription', () => {
    it('devuelve el texto limpio de Twitch', () => {
        expect(sanitizePublicTwitchDescription('Stream de Valorant todas las noches')).toBe(
            'Stream de Valorant todas las noches'
        );
    });

    it('quita URLs e invitaciones', () => {
        const raw =
            'Ven al stream https://evil.com/phish y discord.gg/scam www.spam.net/x bit.ly/x t.co/y hola';
        const out = sanitizePublicTwitchDescription(raw);
        expect(out).not.toMatch(/https?:\/\//i);
        expect(out).not.toMatch(/discord\.gg/i);
        expect(out).not.toMatch(/www\./i);
        expect(out).not.toMatch(/bit\.ly/i);
        expect(out).not.toMatch(/t\.co/i);
        expect(out).toContain('Ven al stream');
        expect(out).toContain('hola');
    });

    it('usa fallback si queda vacío o muy corto', () => {
        expect(sanitizePublicTwitchDescription('')).toContain('Pionero');
        expect(sanitizePublicTwitchDescription('https://only.link')).toContain('Pionero');
        expect(sanitizePublicTwitchDescription('  hi  ')).toContain('Pionero');
    });

    it('trunca textos largos', () => {
        const long = 'a'.repeat(300);
        const out = sanitizePublicTwitchDescription(long);
        expect(out.length).toBeLessThanOrEqual(160);
        expect(out.endsWith('…')).toBe(true);
    });
});
