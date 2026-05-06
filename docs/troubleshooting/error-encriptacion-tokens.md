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

## 3. Auto-Migración Inteligente

El sistema utiliza `decryptAndMigrateIfNeeded()` (en `userService.ts`) que funciona así:

1. Intenta descifrar con la **Llave Primaria**.
2. Si falla, intenta con la **Llave Legacy**.
3. **Solo si usó la llave legacy**: marca `usedLegacy = true` y, al terminar el request, llama `saveUser()` para re-encriptar con la llave primaria e invalida las cachés L1+L2.
4. **Si la llave primaria funcionó**: no hace nada extra — no hay `saveUser` innecesario ni invalidación de caché.

Esto significa que la migración ocurre **exactamente una vez** por usuario (o por cold start si la instancia se reinicia), en vez de re-encriptar y borrar cachés en **cada request** como ocurría antes.

### Validación de formato

La función `isAlreadyEncrypted()` verifica que el token tenga el formato `{iv_hex}:{ciphertext_hex}` y que **ambas partes sean hexadecimales válidos**. Un token `null`, vacío, o con formato incorrecto se considera "no encriptado" y se descifra como plaintext (compatibilidad hacia atrás).

## 4. Manejo de errores en descifrado

`getUserByApiKey()` retorna `null` si el descifrado falla con ambas llaves, en vez de devolver un usuario con tokens rotos. Esto evita que los comandos de Nightbot muestren respuestas con datos cifrados ilegibles.

## 5. Rotación de API Keys

Las API Keys no están cifradas para permitir búsquedas rápidas indexadas, pero su uso está protegido por el validador de tokens. Si un token no se puede descifrar, la API Key se considera inválida temporalmente hasta que el usuario se re-autentique.
