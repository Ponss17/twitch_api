import { LegalPageShell } from '@/features/legal/components/LegalPageShell';
import { appPath } from '@/core/config/paths';

const CONTACT_EMAIL = 'jeancastrogudiel@gmail.com';
const DISCORD_URL = 'https://discord.gg/8uN3qY5E';

export function TermsPage() {
    return (
        <LegalPageShell
            title="Términos de Uso"
            description="Condiciones para usar LosPerris Twitch API."
            current="/terminos"
            updated="22 de junio de 2026"
        >
            <p>
                Estos Términos de Uso («Términos») regulan el acceso y uso de <strong>LosPerris Twitch API</strong> (el
                «Servicio»). Al utilizar el sitio, conectar Twitch (donde la conexión se mostrará como <strong>LosPerris - API</strong>) o usar una API Key, aceptas estos Términos y nuestra{' '}
                <a href={appPath('/privacidad')}>Política de Privacidad</a>.
            </p>

            <h2>1. Descripción del Servicio</h2>
            <p>
                LosPerris ofrece herramientas gratuitas para streamers: comandos de chat (!followage, !clip, !so, etc.),
                panel de control, minijuegos y estadísticas. El Servicio se proporciona «tal cual», sin garantía de
                disponibilidad continua.
            </p>

            <h2>2. Elegibilidad</h2>
            <ul>
                <li>Debes tener una cuenta válida de Twitch y cumplir las políticas de Twitch.</li>
                <li>Debes tener al menos 13 años (o la edad mínima exigida en tu país).</li>
                <li>No puedes usar el Servicio si estás suspendido o prohibido por Twitch o por nosotros.</li>
            </ul>

            <h2>3. Cuenta y API Key</h2>
            <ul>
                <li>Eres responsable de mantener confidencial tu API Key y tokens de sesión.</li>
                <li>No compartas tu clave públicamente ni la incorpores en repositorios abiertos.</li>
                <li>Puedes regenerar o revocar tu acceso desde el panel en cualquier momento.</li>
                <li>Podemos suspender claves ante abuso, fraude o incumplimiento de estos Términos.</li>
            </ul>

            <h2>4. Uso permitido</h2>
            <p>Puedes usar el Servicio para gestionar comandos y herramientas en tu canal o con autorización del titular.</p>

            <h2>5. Uso prohibido</h2>
            <ul>
                <li>Automatizar abuso, spam, acoso o violación de las Directrices de la Comunidad de Twitch.</li>
                <li>Intentar eludir rate limits, seguridad o acceder a datos de otros usuarios sin autorización.</li>
                <li>Ingeniería inversa maliciosa, ataques DDoS o explotación de vulnerabilidades.</li>
                <li>Revender el Servicio o presentarlo como producto oficial de Twitch/Amazon.</li>
                <li>Usar el Servicio para actividades ilegales según la ley aplicable.</li>
            </ul>

            <h2>6. Propiedad intelectual</h2>
            <p>
                El código, marca LosPerris y materiales del sitio nos pertenecen o se usan bajo licencia. Twitch, sus
                logotipos y API son propiedad de Twitch Interactive, Inc. No obtienes derechos sobre nuestra PI salvo
                uso permitido del Servicio.
            </p>

            <h2>7. Contenido de terceros</h2>
            <p>
                Los datos y contenidos obtenidos vía Twitch siguen sujetos a los términos de Twitch. Eres responsable
                del contenido que generas con los comandos en tu canal.
            </p>

            <h2>8. Limitación de responsabilidad</h2>
            <p>
                En la máxima medida permitida por la ley, LosPerris no será responsable por daños indirectos, pérdida de
                ingresos, datos o goodwill derivados del uso o imposibilidad de uso del Servicio. El Servicio es
                gratuito y comunitario; no ofrecemos SLA ni compensaciones por interrupciones.
            </p>

            <h2>9. Modificaciones y discontinuación</h2>
            <p>
                Podemos modificar, limitar o discontinuar funciones con aviso razonable cuando sea posible. Podemos
                actualizar estos Términos publicando la nueva versión en esta página.
            </p>

            <h2>10. Terminación</h2>
            <p>
                Puedes dejar de usar el Servicio y eliminar tu perfil desde el dashboard. Podemos suspender o terminar
                tu acceso por incumplimiento grave o riesgo para la plataforma o terceros.
            </p>

            <h2>11. Ley aplicable</h2>
            <p>
                Estos Términos se rigen por las leyes de la República de Costa Rica, sin perjuicio de derechos
                imperativos del consumidor en tu país de residencia cuando aplique.
            </p>

            <h2>12. Contacto</h2>
            <p>
                Dudas sobre estos Términos: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> o{' '}
                <a href={DISCORD_URL}>Discord LosPerris</a>.
            </p>
        </LegalPageShell>
    );
}
