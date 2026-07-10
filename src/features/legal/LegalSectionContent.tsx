import {
    LEGAL_CONTACT_EMAIL,
    LEGAL_DISCORD_URL
} from '@/features/legal/legalConstants';

const proseLink = 'text-primary underline underline-offset-2';

export function TermsSectionContent() {
    return (
        <>
            <p>
                LosPerris Twitch API es un proyecto gratuito para streamers. Al usar el sitio, conectar Twitch (verás{' '}
                <strong>LosPerris - API</strong> en las conexiones) o usar tu API Key, aceptas estos términos y la{' '}
                <a href="#privacidad" className={proseLink}>
                    política de privacidad
                </a>
                .
            </p>

            <h2>Qué ofrecemos</h2>
            <p>
                Comandos de chat (!followage, !clip, !so…), panel, minijuegos y estadísticas. El servicio va{' '}
                <strong>tal cual</strong>: puede fallar, cambiar o cortarse sin aviso previo.
            </p>

            <h2>Tu cuenta</h2>
            <ul>
                <li>Necesitas una cuenta de Twitch y cumplir sus reglas.</li>
                <li>Eres responsable de tu API Key. No la compartas en público ni en repos abiertos.</li>
                <li>Puedes regenerar la clave o borrar tu perfil desde el panel.</li>
            </ul>

            <h2>Qué no está permitido</h2>
            <ul>
                <li>Spam, abuso, acoso o saltarte los límites de la API.</li>
                <li>Acceder a datos de otros usuarios sin permiso.</li>
                <li>Atacar el servicio o intentar saltarte la seguridad.</li>
                <li>Hacernos pasar por Twitch/Amazon o revender el servicio como propio.</li>
            </ul>

            <h2>Twitch y tu canal</h2>
            <p>
                No somos Twitch ni estamos afiliados con ellos. Los datos que sacamos de Twitch siguen sus términos. Lo
                que pase en tu chat con los comandos es responsabilidad tuya.
            </p>

            <h2>Responsabilidad</h2>
            <p>
                El servicio es gratis y comunitario. No prometemos que esté siempre disponible ni nos hacemos cargo de
                pérdidas por caídas, errores o uso de los comandos en tu canal.
            </p>

            <h2>Si incumples las reglas</h2>
            <p>
                Podemos limitar o cortar tu acceso si abusas del servicio o pones en riesgo a otros usuarios. Tú puedes
                dejar de usarlo cuando quieras.
            </p>

            <h2>Cambios</h2>
            <p>Podemos actualizar estos términos. La fecha arriba indica la última revisión.</p>

            <h2>Contacto</h2>
            <p>
                <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a> ·{' '}
                <a href={LEGAL_DISCORD_URL}>Discord LosPerris</a>
            </p>
        </>
    );
}

export function PrivacySectionContent() {
    return (
        <>
            <p>
                Esta sección explica qué hace <strong>LosPerris Twitch API</strong> con tu información en{' '}
                <a href="https://ttv.losperris.dev">ttv.losperris.dev</a>. Si conectas Twitch, la app aparece como{' '}
                <strong>LosPerris - API</strong>.
            </p>

            <h2>Qué guardamos</h2>
            <ul>
                <li>
                    <strong>De Twitch (al conectar):</strong> ID, usuario, nombre, avatar y datos públicos de tu canal.
                </li>
                <li>
                    <strong>Para que funcione el panel:</strong> tokens de sesión, API Key, historial de comandos, clips,
                    estadísticas de uso y preferencias del dashboard.
                </li>
                <li>
                    <strong>Técnico:</strong> logs de errores, IP aproximada y datos del navegador para seguridad y
                    diagnóstico.
                </li>
            </ul>

            <h2>Qué no guardamos</h2>
            <ul>
                <li>Tu contraseña de Twitch (el login lo hace Twitch).</li>
                <li>Datos de pago (el servicio es gratuito).</li>
                <li>Acceso a acciones críticas de Twitch sin que tú las pidas (banear, borrar VODs, etc.).</li>
            </ul>

            <h2>Para qué lo usamos</h2>
            <ul>
                <li>Identificarte y ejecutar los comandos que configuras.</li>
                <li>Mostrar estadísticas y el historial en tu panel.</li>
                <li>Proteger el servicio (límites de uso, detección de abuso).</li>
                <li>Corregir errores y mejorar la herramienta.</li>
            </ul>

            <h2>Con quién se comparte</h2>
            <p>Solo con los proveedores que necesitamos para operar:</p>
            <ul>
                <li>
                    <strong>Twitch</strong> — login y API pública.
                </li>
                <li>
                    <strong>Supabase</strong> — base de datos (perfil, estadísticas).
                </li>
                <li>
                    <strong>Vercel</strong> — hosting y caché.
                </li>
                <li>
                    <strong>Groq</strong> — IA en minijuegos como la Bola 8 (solo el texto de la pregunta que envías).
                </li>
            </ul>
            <p>No vendemos tus datos ni usamos publicidad.</p>

            <h2>Cuánto tiempo</h2>
            <ul>
                <li>Mientras tengas cuenta activa, salvo que borres datos o el perfil.</li>
                <li>Los tokens de Twitch caducan o se renuevan según Twitch y tu sesión.</li>
                <li>Logs de seguridad: un tiempo limitado, luego se borran.</li>
            </ul>

            <h2>Tus opciones</h2>
            <ul>
                <li>Exportar o borrar tu cuenta desde <strong>Perfil</strong> en el panel.</li>
                <li>
                    Desconectar la app en{' '}
                    <a
                        href="https://www.twitch.tv/settings/connections"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Conexiones de Twitch
                    </a>
                    .
                </li>
                <li>
                    Escribir a <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a> o{' '}
                    <a href={LEGAL_DISCORD_URL}>Discord</a> si necesitas algo que el panel no cubre.
                </li>
            </ul>

            <h2>Cookies y navegador</h2>
            <p>
                Usamos almacenamiento local para la sesión y preferencias. Detalle en la sección{' '}
                <a href="#cookies" className={proseLink}>
                    Cookies
                </a>
                .
            </p>

            <h2>Menores</h2>
            <p>El servicio no está pensado para menores de 13 años.</p>

            <h2>Seguridad</h2>
            <p>
                HTTPS, límites de uso y validación de sesión. Ningún sistema es perfecto; si ves algo raro, avísanos en{' '}
                <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
            </p>

            <h2>Cambios</h2>
            <p>
                Podemos actualizar esta información. La fecha arriba indica la última revisión. También aplican los{' '}
                <a href="#terminos" className={proseLink}>
                    términos de uso
                </a>
                .
            </p>
        </>
    );
}

export function CookiesSectionContent() {
    return (
        <>
            <p>
                Complementa la sección de{' '}
                <a href="#privacidad" className={proseLink}>
                    privacidad
                </a>
                . Resumen: <strong>no usamos cookies de publicidad</strong> ni vendemos datos.
            </p>

            <h2>localStorage y sessionStorage</h2>
            <ul>
                <li>Sesión y API Key para que no tengas que entrar cada vez.</li>
                <li>Preferencias del panel (pestaña activa, favoritos, caché local).</li>
            </ul>
            <p>
                Puedes borrarlo desde el navegador o eliminando tu cuenta en el panel. Sin esto, el login y el dashboard
                no funcionan bien.
            </p>

            <h2>Service worker</h2>
            <p>
                En producción cachea archivos estáticos para cargar más rápido. En desarrollo local está desactivado.
                Puedes quitarlo desde la configuración del navegador.
            </p>

            <h2>Cookies de sesión</h2>
            <p>
                El backend puede usar cookies técnicas para login y protección CSRF. No las usamos para rastrearte entre
                sitios.
            </p>

            <h2>Métricas</h2>
            <p>
                Podemos usar métricas agregadas de rendimiento (por ejemplo tiempos de carga en Vercel). No identifican
                quién eres.
            </p>

            <h2>Cómo borrarlo</h2>
            <ul>
                <li>Herramientas de privacidad de tu navegador.</li>
                <li>
                    Desconectar LosPerris en{' '}
                    <a
                        href="https://www.twitch.tv/settings/connections"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Conexiones de Twitch
                    </a>
                    .
                </li>
                <li>Eliminar perfil o limpiar datos en el panel.</li>
            </ul>

            <h2>Contacto</h2>
            <p>
                <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>
            </p>
        </>
    );
}