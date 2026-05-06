# Guía de Migración de Tokens

Si alguna vez necesitas cambiar la `ENCRYPTION_KEY` o el `TWITCH_CLIENT_SECRET`, sigue esta guía para no interrumpir el servicio.

## 1. El Script de Migración

Existe un script automatizado en `scripts/migrate-tokens.ts` que puede procesar a todos los usuarios de la base de datos de una sola vez.

### Ejecución:

```bash
npx tsx -r dotenv/config scripts/migrate-tokens.ts
```

## 2. Qué hace el script

1.  **Carga masiva**: Lee todos los IDs de usuario de Supabase.
2.  **Descifrado con Fallback**: Utiliza el sistema de doble llave para recuperar el acceso a los tokens antiguos.
3.  **Re-encriptación**: Guarda de nuevo al usuario, lo que fuerza al servidor a cifrar los datos con la nueva clave configurada.
4.  **Invalidación de Caché**: Borra las copias viejas en Redis para que Nightbot use los nuevos datos inmediatamente.

## 3. Limitaciones

Si un token fue cifrado con una clave que ya no existe ni en `ENCRYPTION_KEY` ni como `LEGACY_KEY`, el usuario aparecerá como "Error de descifrado". En ese caso, la **única solución** es que el usuario inicie sesión manualmente en la web.
