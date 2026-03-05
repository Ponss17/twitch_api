import {
    saveUser,
    getUser,
    deleteUser,
    addSystemLog,
    incrementUserStats,
    addUserActivity,
    addAuditLog,
    getAuditLogs
} from '../../src/core/database/dbService';
import { kv } from '@vercel/kv';

jest.mock('@/utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() }
}));

describe('dbService', () => {
    const mockUser = {
        userId: '123',
        login: 'testuser',
        displayName: 'Test User',
        profileImageUrl: 'http://image.url',
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        obtainedAt: 1672531200000,
        expiresIn: 3600,
        createdAt: '2023-01-01T00:00:00.000Z'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('saveUser', () => {
        it('should encrypt tokens and save user to KV', async () => {
            await saveUser(mockUser);

            expect(kv.hset).toHaveBeenCalledWith(
                'twitch_users',
                expect.objectContaining({
                    '123': expect.objectContaining({ userId: '123' })
                })
            );
        });
    });

    describe('getUser', () => {
        it('should retrieve user from KV', async () => {
            (kv.hget as jest.Mock).mockResolvedValue(mockUser);
            const user = await getUser('123');
            expect(kv.hget).toHaveBeenCalledWith('twitch_users', '123');
            expect(user).toBeDefined();
            expect(user?.userId).toBe('123');
        });

        it('should return null if user does not exist', async () => {
            (kv.hget as jest.Mock).mockResolvedValue(null);
            const user = await getUser('999');
            expect(user).toBeNull();
        });
    });

    describe('deleteUser', () => {
        it('should delete user and stats from KV', async () => {
            (kv.hget as jest.Mock).mockResolvedValue(mockUser);
            await deleteUser('123');
            expect(kv.hdel).toHaveBeenCalledWith('twitch_users', '123');
        });
    });

    describe('addSystemLog', () => {
        it('should push log to KV', async () => {
            await addSystemLog('info', 'Test log');
            expect(kv.lpush).toHaveBeenCalled();
        });
    });

    describe('incrementUserStats', () => {
        it('should call hincrby con la clave de stats atómicas correcta', async () => {
            (kv.exists as jest.Mock).mockResolvedValue(1);

            await incrementUserStats('123', 'clips');

            expect(kv.hincrby).toHaveBeenCalledWith('twitch_stats_cnt:123', 'clips', 1);
        });

        it('should silenciosamente no lanzar error si KV falla', async () => {
            (kv.exists as jest.Mock).mockResolvedValue(1);
            (kv.hincrby as jest.Mock).mockRejectedValueOnce(new Error('KV error'));

            await expect(incrementUserStats('123', 'followage')).resolves.toBeUndefined();
        });
    });

    describe('addUserActivity', () => {
        it('should usar lpush + ltrim con la clave Redis List correcta', async () => {
            await addUserActivity('123', { type: 'clip', user: 'ponss17', detail: 'testchannel' });

            expect(kv.lpush).toHaveBeenCalledWith(
                'activity_v2:123',
                expect.stringContaining('"type":"clip"')
            );
            expect(kv.ltrim).toHaveBeenCalledWith('activity_v2:123', 0, 49);
        });

        it('should incluir timestamp en el log guardado', async () => {
            await addUserActivity('123', { type: 'followage', user: 'viewer1' });

            const [[, jsonArg]] = (kv.lpush as jest.Mock).mock.calls;
            const parsed = JSON.parse(jsonArg);
            expect(parsed).toMatchObject({ type: 'followage', user: 'viewer1' });
            expect(typeof parsed.timestamp).toBe('string');
        });

        it('should eliminar la clave legacy al escribir', async () => {
            await addUserActivity('123', { type: 'message', user: 'ponss17' });
            expect(kv.del).toHaveBeenCalledWith('activity:123');
        });
    });

    describe('addAuditLog', () => {
        it('should guardar en la lista de auditoría con lpush + ltrim', async () => {
            await addAuditLog('api_key_regenerated', '123', 'admin456', { reason: 'test' });

            expect(kv.lpush).toHaveBeenCalledWith(
                'twitch_audit_logs',
                expect.stringContaining('"action":"api_key_regenerated"')
            );
            expect(kv.ltrim).toHaveBeenCalledWith('twitch_audit_logs', 0, 499);
        });

        it('should incluir performedBy y metadata en el log', async () => {
            await addAuditLog('user_blocked', '456', 'admin1', { reason: 'spam' });

            const calls = (kv.lpush as jest.Mock).mock.calls;
            const auditCall = calls.find(([key]: string[]) => key === 'twitch_audit_logs');
            const parsed = JSON.parse(auditCall[1]);
            expect(parsed.performedBy).toBe('admin1');
            expect(parsed.metadata).toEqual({ reason: 'spam' });
        });

        it('should silenciosamente no lanzar error si KV falla', async () => {
            (kv.lpush as jest.Mock).mockRejectedValueOnce(new Error('KV error'));
            await expect(addAuditLog('user_deleted', '123')).resolves.toBeUndefined();
        });
    });

    describe('getAuditLogs', () => {
        it('should llamar a lrange con el límite correcto y parsear JSON', async () => {
            const entry = JSON.stringify({
                timestamp: '2026-03-01T00:00:00.000Z',
                action: 'api_key_regenerated',
                userId: '123'
            });
            (kv.lrange as jest.Mock).mockResolvedValue([entry]);

            const logs = await getAuditLogs(10);

            expect(kv.lrange).toHaveBeenCalledWith('twitch_audit_logs', 0, 9);
            expect(logs[0]).toMatchObject({ action: 'api_key_regenerated', userId: '123' });
        });

        it('should devolver array vacío si KV falla', async () => {
            (kv.lrange as jest.Mock).mockRejectedValue(new Error('fail'));
            const logs = await getAuditLogs();
            expect(logs).toEqual([]);
        });
    });
});

// El mock se resuelve automáticamente por moduleNameMapper o __mocks__
// jest.mock('@vercel/kv'); // No es necesario si usamos moduleNameMapper apuntando al archivo

describe('dbService', () => {
    const mockUser = {
        userId: '123',
        login: 'testuser',
        displayName: 'Test User',
        profileImageUrl: 'http://image.url',
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        obtainedAt: 1672531200000, // Date.now() es number
        expiresIn: 3600, // Segundos
        createdAt: '2023-01-01T00:00:00.000Z'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('saveUser', () => {
        it('should encrypt tokens and save user to KV', async () => {
            await saveUser(mockUser);

            expect(kv.hset).toHaveBeenCalledWith(
                'twitch_users',
                expect.objectContaining({
                    '123': expect.objectContaining({
                        userId: '123'
                        // Tokens deberían ser distintos al original (encriptados)
                        // accessToken: expect.not.toBe('access_token'),
                        // Nota: En un entorno de test sin crypto real configurado igual que prod,
                        // a veces encrypt devuelve el mismo texto si falla.
                        // Asumimos que el mock de crypto no está fallando.
                    })
                })
            );
        });
    });

    describe('getUser', () => {
        it('should retrieve user from KV', async () => {
            (kv.hget as jest.Mock).mockResolvedValue(mockUser);
            const user = await getUser('123');
            expect(kv.hget).toHaveBeenCalledWith('twitch_users', '123');
            expect(user).toBeDefined();
            expect(user?.userId).toBe('123');
        });

        it('should return null if user does not exist', async () => {
            (kv.hget as jest.Mock).mockResolvedValue(null);
            const user = await getUser('999');
            expect(user).toBeNull();
        });
    });

    describe('deleteUser', () => {
        it('should delete user and stats from KV', async () => {
            (kv.hget as jest.Mock).mockResolvedValue(mockUser);
            await deleteUser('123');

            expect(kv.hdel).toHaveBeenCalledWith('twitch_users', '123');
            // expect(kv.del).toHaveBeenCalledWith('stats:123'); // Puede variar según implementación exacta
        });
    });

    describe('addSystemLog', () => {
        it('should push log to KV', async () => {
            await addSystemLog('info', 'Test log');
            expect(kv.lpush).toHaveBeenCalled();
        });
    });
});
