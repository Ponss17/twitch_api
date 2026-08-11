jest.mock('@/core/config/config', () => ({
    API_ENDPOINTS: { ANALYTICS: '/analytics', USER_INFO: '/user-info', ACTIVITY: '/activity' },
    STATUS_PAGE_URL: 'https://status.example'
}));

import { resolveExportApiKey } from '@/features/dashboard/lib/dataExporter';

describe('resolveExportApiKey', () => {
    it('usa placeholder sin consentimiento y no revela secretos', async () => {
        const reveal = jest.fn().mockResolvedValue({ apiKey: 'secret' });
        await expect(resolveExportApiKey(false, reveal)).resolves.toBe('TU_API_KEY');
        expect(reveal).not.toHaveBeenCalled();
    });

    it('solo incluye la clave con consentimiento explícito', async () => {
        await expect(
            resolveExportApiKey(true, async () => ({ apiKey: 'secret' }))
        ).resolves.toBe('secret');
    });
});
