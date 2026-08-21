import { updateSettingsSchema, clearUserDataSchema, getUserAuditLogsSchema } from '../../../backend/src/features/dashboard/dashboard.schema';

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

describe('getUserAuditLogsSchema', () => {
    it('acepta página por defecto', () => {
        expect(getUserAuditLogsSchema.safeParse({ query: {} }).success).toBe(true);
    });

    it('acepta páginas dentro de rango', () => {
        expect(getUserAuditLogsSchema.safeParse({ query: { page: '2' } }).success).toBe(true);
    });

    it('rechaza páginas inválidas', () => {
        expect(getUserAuditLogsSchema.safeParse({ query: { page: '0' } }).success).toBe(false);
        expect(getUserAuditLogsSchema.safeParse({ query: { page: '101' } }).success).toBe(false);
    });
});
