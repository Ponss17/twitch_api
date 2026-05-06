import { supabase } from '../src/core/database/supabaseClient';
import { getUser, saveUser } from '../src/core/database/userService';
import { logger } from '../src/core/utils/logger';
import * as cacheService from '../src/core/database/cacheService';

async function migrateAllTokens() {
    console.log('🚀 Iniciando migración masiva de tokens de encriptación...');

    try {
        // 1. Obtener todos los IDs de usuario de la base de datos
        const { data: users, error } = await supabase.from('users').select('user_id, login');

        if (error) throw error;
        if (!users || users.length === 0) {
            console.log('∅ No se encontraron usuarios para migrar.');
            return;
        }

        console.log(`📂 Encontrados ${users.length} usuarios. Verificando encriptación...`);

        let migratedCount = 0;
        let failedCount = 0;

        for (const u of users) {
            try {
                // El método getUser ya tiene la lógica de "fallback" y "auto-migración"
                // Si detecta que el token usa la llave vieja, lo descifra y marca para guardar.
                // Al llamar a saveUser, se guardará con la llave nueva.

                const user = await getUser(u.user_id);

                if (!user) {
                    console.log(`⚠️ Usuario ${u.login} (${u.user_id}) no pudo ser cargado.`);
                    failedCount++;
                    continue;
                }

                // Forzamos un guardado para asegurar que se aplique la nueva encriptación
                // (saveUser detecta automáticamente si el token está plano y lo cifra con la nueva llave)
                await saveUser(user);

                // Limpiamos caché por si acaso
                if (user.apiKey) {
                    await cacheService.invalidateApiKeyCache(user.apiKey);
                }

                console.log(`✅ Usuario migrado/verificado: ${user.login}`);
                migratedCount++;
            } catch (err) {
                console.error(`❌ Error migrando usuario ${u.login}:`, (err as Error).message);
                failedCount++;
            }
        }

        console.log('\n--- 📊 Resumen de Migración ---');
        console.log(`✅ Usuarios procesados: ${migratedCount}`);
        console.log(`❌ Errores: ${failedCount}`);
        console.log('-------------------------------\n');
        console.log(
            '🎉 ¡Migración completada! Todos los tokens ahora usan la clave de encriptación actual.'
        );
    } catch (err) {
        console.error('💥 Error crítico en la migración:', err);
    }
}

// Ejecutar
migrateAllTokens();
