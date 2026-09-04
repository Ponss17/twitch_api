import { hydrateUserFromRow, userToRow } from '../../../backend/src/core/database/userRowMapper';
import type { StoredUser } from '../../../backend/src/types/twitch';

describe('userRowMapper accountId', () => {
    it('lee users.id como accountId', () => {
        const user = hydrateUserFromRow({
            user_id: 'twitch-1',
            id: '11111111-2222-4333-8444-555555555555',
            login: 'test',
            display_name: 'Test',
            is_active: true
        });

        expect(user.userId).toBe('twitch-1');
        expect(user.accountId).toBe('11111111-2222-4333-8444-555555555555');
    });

    it('nunca escribe id/accountId en el row de upsert', () => {
        const user: StoredUser = {
            userId: 'twitch-1',
            accountId: '11111111-2222-4333-8444-555555555555',
            login: 'test',
            displayName: 'Test',
            accessToken: 'a',
            refreshToken: 'r',
            expiresIn: 0,
            obtainedAt: 0
        };

        const row = userToRow(user, { preservePlan: true, preserveCreatedAt: true });
        expect(row).not.toHaveProperty('id');
        expect(row.user_id).toBe('twitch-1');
    });
});
