import { updateSettingsSchema } from '../../../backend/src/features/dashboard/dashboard.schema';

describe('updateSettingsSchema', () => {
    it('acepta zonas IANA reales', () => {
        expect(updateSettingsSchema.safeParse({ body: { timezone: 'America/Mexico_City' } }).success).toBe(true);
        expect(updateSettingsSchema.safeParse({ body: { timezone: 'UTC' } }).success).toBe(true);
    });

    it('rechaza identificadores con formato válido pero inexistentes', () => {
        expect(updateSettingsSchema.safeParse({ body: { timezone: 'Foo/Bar' } }).success).toBe(false);
    });
});
