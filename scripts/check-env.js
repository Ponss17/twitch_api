const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env');

const REQUIRED_VARS = [
    'TWITCH_CLIENT_ID',
    'TWITCH_CLIENT_SECRET',
    'TWITCH_REDIRECT_URI',
    'ENCRYPTION_KEY',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_ANON_KEY',
    'SUPABASE_JWT_SECRET'
];

const KV_VARS = ['KV_REST_API_URL', 'KV_REST_API_TOKEN'];

if (!fs.existsSync(envPath)) {
    console.error('❌ No se encontró .env en twitch_api/');
    console.log('');
    console.log('Opciones:');
    console.log('  1. Crear desde la plantilla:');
    console.log('     copy .env.example .env');
    console.log('');
    console.log('  2. Copiar desde otro entorno ya configurado.');
    process.exit(1);
}

const envConfig = dotenv.parse(fs.readFileSync(envPath));
let hasError = false;

console.log('🔍 Verificando variables de entorno...');

for (const key of REQUIRED_VARS) {
    if (!envConfig[key]?.trim()) {
        console.error(`❌ Faltante o vacía: ${key}`);
        hasError = true;
    }
}

const nodeEnv = envConfig.NODE_ENV || process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

for (const key of KV_VARS) {
    if (!envConfig[key]?.trim()) {
        if (isProd) {
            console.error(`❌ Faltante en producción: ${key} (rate limit → 503)`);
            hasError = true;
        } else {
            console.warn(`⚠️  ${key} no configurado — rate limit global omitido en dev`);
        }
    }
}
if (hasError) {
    console.log('\n❌ Completa las variables en .env antes de arrancar la API.');
    process.exit(1);
}

console.log('✅ .env OK');
