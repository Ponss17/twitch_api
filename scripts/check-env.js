const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Cargar .env local
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
    console.error('❌ No se encontró el archivo .env');
    console.log('💡 Tip: Ejecuta "vercel env pull .env" si usas Vercel CLI.');
    process.exit(1);
}

const envConfig = dotenv.parse(fs.readFileSync(envPath));

// Variables críticas que deben existir
const REQUIRED_VARS = [
    'TWITCH_CLIENT_ID',
    'TWITCH_CLIENT_SECRET',
    'TWITCH_REDIRECT_URI',
    'KV_REST_API_URL',
    'KV_REST_API_TOKEN',
    'GROQ_API_KEY'
];

let hasError = false;

console.log('🔍 Verificando variables de entorno...');

REQUIRED_VARS.forEach(key => {
    if (!envConfig[key]) {
        console.error(`❌ Faltante: ${key}`);
        hasError = true;
    } else {
        // Chequeos básicos de integridad
        if (key === 'KV_REST_API_TOKEN' && envConfig[key].length < 20) {
            console.warn(`⚠️  Advertencia: ${key} parece demasiado corto. ¿Es el token correcto?`);
        }
    }
});

if (hasError) {
    console.log('\n❌ Faltan variables críticas. Tu entorno local puede fallar.');
    console.log('💡 Tip: Sincroniza con Vercel usando: vercel env pull .env');
    process.exit(1);
} else {
    console.log('✅ Todo parece correcto en .env');
}
