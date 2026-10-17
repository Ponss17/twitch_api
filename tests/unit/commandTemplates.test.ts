import { fillTemplate } from '../../backend/src/features/commands/commandTemplates';

describe('fillTemplate', () => {
    it('sustituye variables de los comandos de bot', () => {
        expect(fillTemplate('{user} lleva {time}', { user: 'ana', time: '2 días' })).toBe(
            'ana lleva 2 días'
        );
    });

    it('deja pasar /me', () => {
        expect(fillTemplate('/me {user}', { user: 'ana' })).toBe('/me ana');
    });

    it('neutraliza un comando de moderación al inicio', () => {
        const out = fillTemplate('/timeout {user} 600', { user: 'ana' });
        expect(out.startsWith('/')).toBe(false);
        expect(out).toContain('timeout ana 600');
    });

    it('neutraliza un valor que dejaría el mensaje como comando', () => {
        const out = fillTemplate('{game}', { game: '/ban someone' });
        expect(out.trimStart().startsWith('/')).toBe(false);
        expect(out).toContain('ban someone');
    });

    it('quita saltos de línea para que no se cuele un segundo mensaje', () => {
        expect(fillTemplate('hola {user}', { user: 'ana\n/ban pepe' })).toBe('hola ana/ban pepe');
    });
});
