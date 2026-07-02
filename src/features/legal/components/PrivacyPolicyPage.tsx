import { LegalPageShell } from '@/features/legal/components/LegalPageShell';
import { appPath } from '@/core/config/paths';

const CONTACT_EMAIL = 'jeancastrogudiel@gmail.com';
const DISCORD_URL = 'https://discord.gg/8uN3qY5E';

export function PrivacyPolicyPage() {
    return (
        <LegalPageShell
            title="Política de Privacidad"
            description="Cómo LosPerris Twitch API trata tus datos personales."
            current="/privacidad"
            updated="22 de junio de 2026"
        >
            <p>
                Esta Política de Privacidad describe cómo <strong>LosPerris Twitch API</strong> («LosPerris»,
                «nosotros») recopila, usa, almacena y protege información personal cuando utilizas nuestro sitio web,
                panel de control y servicios API disponibles en{' '}
                <a href="https://www.losperris.dev">www.losperris.dev</a> (el «Servicio»).
            </p>
            <p>
                Al conectar tu cuenta de Twitch o utilizar el Servicio, confirmas que has leído esta política. Si no
                estás de acuerdo, no uses el Servicio. (En Twitch, la conexión aparecerá bajo el nombre de <strong>LosPerris - API</strong>).
            </p>

            <h2>1. Responsable del tratamiento</h2>
            <p>
                Responsable: proyecto comunitario <strong>LosPerris Twitch API</strong>, operado desde Costa Rica.
            </p>
            <ul>
                <li>
                    Contacto: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                </li>
                <li>
                    Soporte: <a href={DISCORD_URL}>Discord LosPerris</a>
                </li>
            </ul>

            <h2>2. Datos que recopilamos</h2>
            <h3>2.1 Datos de Twitch (con tu consentimiento OAuth)</h3>
            <ul>
                <li>Identificador de usuario, login y nombre para mostrar.</li>
                <li>Imagen de perfil y datos públicos del canal (descripción, tipo de broadcaster, seguidores).</li>
                <li>Tokens OAuth necesarios para autenticarte y ejecutar comandos en tu nombre.</li>
            </ul>
            <h3>2.2 Datos generados por el uso del Servicio</h3>
            <ul>
                <li>API Key personal asociada a tu cuenta.</li>
                <li>Historial de comandos, clips, latencia, estadísticas de uso y registros de actividad.</li>
                <li>Preferencias del panel (pestañas, favoritos locales cuando aplique).</li>
                <li>Logs técnicos: IP aproximada, user-agent, timestamps y errores (para seguridad y diagnóstico).</li>
            </ul>
            <h3>2.3 Datos que no recopilamos</h3>
            <ul>
                <li>Contraseña de Twitch (la autenticación la gestiona Twitch).</li>
                <li>Datos bancarios ni información de pago (el Servicio es gratuito).</li>
                <li>Acceso a acciones críticas de Twitch (banear, borrar VODs, etc.) sin tu autorización explícita.</li>
            </ul>

            <h2>3. Finalidades y base legal</h2>
            <ul>
                <li>
                    <strong>Prestar el Servicio</strong> (comandos, dashboard, minijuegos, estadísticas): ejecución del
                    contrato / consentimiento al conectar Twitch.
                </li>
                <li>
                    <strong>Seguridad y prevención de abuso</strong> (rate limits, CSRF, validación de sesión): interés
                    legítimo.
                </li>
                <li>
                    <strong>Soporte y mejora</strong> (feedback, corrección de errores): interés legítimo /
                    consentimiento.
                </li>
                <li>
                    <strong>Cumplimiento legal</strong> cuando la ley lo exija.
                </li>
            </ul>

            <h2>4. Encargados y terceros</h2>
            <p>Compartimos datos solo con proveedores necesarios para operar el Servicio:</p>
            <ul>
                <li>
                    <strong>Twitch / Amazon</strong> — autenticación OAuth y API pública de Twitch.
                </li>
                <li>
                    <strong>Supabase</strong> — base de datos y almacenamiento de perfiles y estadísticas.
                </li>
                <li>
                    <strong>Vercel</strong> — hosting, CDN y almacenamiento KV cuando aplique.
                </li>
                <li>
                    <strong>Groq</strong> — procesamiento de IA en funciones que lo requieran (p. ej. contexto de
                    minijuegos).
                </li>
                <li>
                    <strong>Sentry / logs</strong> — monitorización de errores (datos técnicos anonimizados cuando sea
                    posible).
                </li>
            </ul>
            <p>
                Estos proveedores pueden tratar datos fuera de Costa Rica. Adoptamos medidas contractuales y técnicas
                razonables para proteger la información transferida.
            </p>

            <h2>5. Conservación</h2>
            <ul>
                <li>Datos de cuenta y API Key: mientras mantengas el acceso activo.</li>
                <li>Estadísticas e historial: hasta que los elimines desde el panel o solicites borrado.</li>
                <li>Tokens OAuth: según caducidad de Twitch y necesidad operativa; se renuevan o revocan al cerrar sesión.</li>
                <li>Logs de seguridad: plazo limitado (habitualmente hasta 90 días) salvo obligación legal.</li>
            </ul>

            <h2>6. Tus derechos</h2>
            <p>Según la Ley 8968 de Costa Rica y, cuando aplique, el GDPR, puedes:</p>
            <ul>
                <li>Acceder y obtener copia de tus datos (exportación desde Perfil).</li>
                <li>Rectificar datos inexactos.</li>
                <li>
                    Suprimir tu cuenta y datos («Eliminar Perfil» en la Zona de Peligro del dashboard, o contactándonos).
                </li>
                <li>Limitar u oponerte a ciertos tratamientos cuando proceda.</li>
                <li>Retirar el consentimiento de Twitch desconectando la app en tu cuenta de Twitch.</li>
            </ul>
            <p>
                Para ejercer derechos escribe a{' '}
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> o abre un ticket en{' '}
                <a href={DISCORD_URL}>Discord</a>. Responderemos en un plazo razonable (habitualmente 30 días).
            </p>

            <h2>7. Cookies y almacenamiento local</h2>
            <p>
                Usamos cookies técnicas, service worker y almacenamiento local del navegador para sesión, API Key y
                preferencias. Detalle completo en la{' '}
                <a href={appPath('/cookies')}>Política de Cookies</a>.
            </p>

            <h2>8. Menores</h2>
            <p>
                El Servicio no está dirigido a menores de 13 años. Si detectamos datos de un menor sin consentimiento
                parental verificable, los eliminaremos.
            </p>

            <h2>9. Seguridad</h2>
            <p>
                Aplicamos HTTPS, validación de sesión, rate limiting, CSRF en operaciones sensibles y buenas prácticas
                de almacenamiento. Ningún sistema es 100 % seguro; notifica incidentes a{' '}
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>

            <h2>10. Cambios</h2>
            <p>
                Podemos actualizar esta política. Publicaremos la fecha de revisión en esta página. El uso continuado
                del Servicio tras cambios relevantes implica aceptación.
            </p>

            <h2>11. Términos relacionados</h2>
            <p>
                Consulta también nuestros <a href={appPath('/terminos')}>Términos de Uso</a>. LosPerris no está
                afiliado, patrocinado ni respaldado por Twitch Interactive, Inc. ni Amazon.
            </p>
        </LegalPageShell>
    );
}
