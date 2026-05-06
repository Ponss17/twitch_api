# Arquitectura de Encriptación y Seguridad de Tokens

Este documento detalla cómo el sistema protege las credenciales de Twitch de los usuarios y cómo maneja los cambios en las claves de seguridad.

## 1. Sistema de Encriptación AES-256-CBC

Todos los tokens sensibles (`accessToken`, `refreshToken`) se almacenan cifrados en Supabase.

- **Algoritmo**: `aes-256-cbc`.
- **IV (Vector de Inicialización)**: Se genera uno aleatorio de 16 bytes por cada encriptación y se almacena junto al texto cifrado (formato `iv:encryptedText`).

## 2. El Sistema de "Doble Llave" (Fallback)

Para evitar la pérdida de acceso al cambiar la clave de seguridad principal, el servidor implementa un sistema de respaldo:

1.  **Llave Primaria**: Derivada de `ENCRYPTION_KEY` del archivo `.env`.
2.  **Llave Legacy**: Derivada del `TWITCH_CLIENT_SECRET`. Esta llave actúa como respaldo permanente.

### Lógica de Descifrado:

```typescript
try {
    return decrypt(text, PRIMARY_KEY);
} catch {
    // Si falla, intenta con la llave legacy automáticamente
    return decrypt(text, LEGACY_KEY);
}
```

## 3. Auto-Migración

Cuando el servidor detecta que ha tenido que usar la **Llave Legacy** para descifrar un dato, marca al usuario para una "auto-migración". La próxima vez que se guarden sus datos, se cifrarán automáticamente con la **Llave Primaria** actual.

## 4. Rotación de API Keys

Las API Keys no están cifradas para permitir búsquedas rápidas indexadas, pero su uso está protegido por el validador de tokens. Si un token no se puede descifrar, la API Key se considera inválida temporalmente hasta que el usuario se re-autentique.
