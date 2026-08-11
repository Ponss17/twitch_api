import { updateSettingsSchema, clearUserDataSchema } from '../../../backend/src/features/dashboard/dashboard.schema';

describe('updateSettingsSchema', () => {
    it('acepta zonas IANA reales', () => {
        expect(updateSettingsSchema.safeParse({ body: { timezone: 'America/Mexico_City' } }).success).toBe(true);
        expect(updateSettingsSchema.safeParse({ body: { timezone: 'UTC' } }).success).toBe(true);
    });

    it('rechaza identificadores con formato válido pero inexistentes', () => {
        expect(updateSettingsSchema.safeParse({ body: { timezone: 'Foo/Bar' } }).success).toBe(false);
    });
});

describe('clearUserDataSchema', () => {
    it('acepta confirmación sin scopes (borra todo por defecto)', () => {
        expect(clearUserDataSchema.safeParse({ body: { confirm: 'LIMPIAR' } }).success).toBe(true);
    });

    it('acepta scopes parciales', () => {
        expect(
            clearUserDataSchema.safeParse({
                body: { confirm: 'LIMPIAR', scopes: { stats: true, questions: false } }
            }).success
        ).toBe(true);
    });

    it('rechaza si no hay ningún scope', () => {
        expect(
            clearUserDataSchema.safeParse({
                body: { confirm: 'LIMPIAR', scopes: { stats: false, questions: false } }
            }).success
        ).toBe(false);
    });
});
