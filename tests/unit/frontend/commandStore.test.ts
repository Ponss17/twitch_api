import {
    bindCommandStoreUser,
    getCommandConfig,
    setCommandConfig,
    subscribeCommandStore
} from '@/features/commands/lib/commandStore';

describe('commandStore', () => {
    beforeEach(() => {
        localStorage.clear();
        bindCommandStoreUser('test-user');
    });

    afterEach(() => {
        bindCommandStoreUser(undefined);
    });
    it('getCommandConfig devuelve referencia estable para ids sin guardar', () => {
        const id = `missing-${Date.now()}`;
        const a = getCommandConfig(id);
        const b = getCommandConfig(id);
        expect(a).toBe(b);
    });

    it('notifica suscriptores al actualizar config', () => {
        const id = `follow-${Date.now()}`;
        const listener = jest.fn();
        const unsub = subscribeCommandStore(listener);

        setCommandConfig(id, { bot: 'streamelements' });

        expect(listener).toHaveBeenCalled();
        expect(getCommandConfig(id).bot).toBe('streamelements');

        unsub();
    });

    it('setCommandConfig persiste copia independiente del default', () => {
        const id = `clip-${Date.now()}`;
        const before = getCommandConfig(id);
        setCommandConfig(id, { template: '!clip' });
        const after = getCommandConfig(id);

        expect(before.template).toBe('');
        expect(after).not.toBe(before);
        expect(after.template).toBe('!clip');
    });

    it('bindCommandStoreUser aísla configs entre cuentas', () => {
        const id = 'shared-command';

        bindCommandStoreUser('user-a');
        setCommandConfig(id, { bot: 'streamelements' });

        bindCommandStoreUser('user-b');
        expect(getCommandConfig(id).bot).toBe('nightbot');

        bindCommandStoreUser('user-a');
        expect(getCommandConfig(id).bot).toBe('streamelements');
    });
});
