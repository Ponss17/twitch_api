import {
    LEGAL_CONTACT_DISCORD,
    LEGAL_DISCORD_URL,
    LEGAL_OPERATOR
} from '@/features/legal/legalConstants';

const proseLink = 'text-primary underline underline-offset-2';

function LegalContact() {
    return (
        <p>
            Puedes contactar al responsable del servicio en Discord:{' '}
            <a href={LEGAL_DISCORD_URL} target="_blank" rel="noopener noreferrer">
                @{LEGAL_CONTACT_DISCORD}
            </a>{' '}
            (servidor{' '}
            <a href={LEGAL_DISCORD_URL} target="_blank" rel="noopener noreferrer">
                LosPerris
            </a>
            ).
        </p>
    );
}

export function TermsSectionContent() {
    return (
        <>
            <p>
                Los presentes términos regulan el acceso y uso de <strong>{LEGAL_OPERATOR}</strong>, disponible en{' '}
                <a href="https://ttv.losperris.dev">ttv.losperris.dev</a>. Al utilizar el sitio, conectar tu cuenta de
                Twitch (la aplicación aparece como <strong>LosPerris - API</strong>) o emplear tu API Key, confirmas
                que has leído y aceptas estos términos y la{' '}
                <a href="#privacidad" className={proseLink}>
                    política de privacidad
                </a>
                .
            </p>

            <h2>Descripción del servicio</h2>
            <p>
                {LEGAL_OPERATOR} es un proyecto gratuito orientado a streamers de Twitch. Ofrece comandos de chat
                (followage, clips, shoutouts, minijuegos y herramientas relacionadas), un panel de control y
                estadísticas de uso. El servicio se proporciona en su estado actual, sin garantías de disponibilidad
                continua, y puede modificarse, interrumpirse o discontinuarse sin previo aviso.
            </p>

            <h2>Requisitos y responsabilidades del usuario</h2>
            <ul>
                <li>Debes contar con una cuenta de Twitch válida y cumplir en todo momento sus normas de uso.</li>
                <li>
                    Eres responsable de la custodia de tu API Key. No la publiques en chats, repositorios públicos ni
                    entornos accesibles a terceros.
                </li>
                <li>
                    Puedes regenerar tu clave, exportar datos o eliminar tu perfil desde el panel en cualquier momento.
                </li>
                <li>
                    La configuración de comandos en tu bot de chat y su uso ante tu audiencia es responsabilidad
                    exclusiva del titular del canal.
                </li>
            </ul>

            <h2>Usos prohibidos</h2>
            <ul>
                <li>Realizar spam, abuso, acoso o intentar eludir los límites de uso de la API.</li>
                <li>Acceder, consultar o manipular datos de otros usuarios sin autorización.</li>
                <li>Atacar la infraestructura del servicio o intentar vulnerar sus medidas de seguridad.</li>
                <li>Suplantar a Twitch, Amazon o a terceros, o comercializar el servicio como producto propio.</li>
            </ul>

            <h2>Relación con Twitch</h2>
            <p>
                {LEGAL_OPERATOR} no está afiliado, patrocinado ni respaldado por Twitch Interactive, Inc. Los datos
                obtenidos a través de la API de Twitch se utilizan conforme a sus condiciones de uso. Cualquier
                incidencia derivada del uso de comandos en tu canal de chat es responsabilidad del titular del canal.
            </p>

            <h2>Limitación de responsabilidad</h2>
            <p>
                Al tratarse de un servicio gratuito y de carácter comunitario, no garantizamos la ausencia de errores,
                interrupciones o pérdida de datos. En la medida permitida por la ley aplicable, no asumimos
                responsabilidad por daños indirectos, pérdida de ingresos o perjuicios derivados del uso o la
                imposibilidad de uso del servicio.
            </p>

            <h2>Suspensión del acceso</h2>
            <p>
                Nos reservamos el derecho de limitar o revocar el acceso a usuarios que incumplan estos términos o
                comprometan la seguridad o estabilidad del servicio. Puedes dejar de utilizar la plataforma en
                cualquier momento desconectando la aplicación en Twitch o eliminando tu perfil.
            </p>

            <h2>Modificaciones</h2>
            <p>
                Estos términos pueden actualizarse para reflejar cambios legales, técnicos o funcionales del servicio.
                La fecha indicada al inicio de cada sección corresponde a la última revisión publicada.
            </p>

            <h2>Contacto</h2>
            <LegalContact />
        </>
    );
}

export function PrivacySectionContent() {
    return (
        <>
            <p>
                La presente política describe cómo <strong>{LEGAL_OPERATOR}</strong> trata la información personal
                de quienes utilizan <a href="https://ttv.losperris.dev">ttv.losperris.dev</a>. Al conectar Twitch, la
                aplicación autorizada se identifica como <strong>LosPerris - API</strong>.
            </p>

            <h2>Responsable del tratamiento</h2>
            <p>
                El responsable del tratamiento de los datos es el administrador de {LEGAL_OPERATOR}. Para consultas
                relacionadas con privacidad, utiliza el contacto indicado al final de este documento.
            </p>

            <h2>Datos que recopilamos</h2>
            <ul>
                <li>
                    <strong>Datos de Twitch (al autorizar la conexión):</strong> identificador de usuario, nombre de
                    inicio de sesión, nombre para mostrar, imagen de perfil e información pública del canal.
                </li>
                <li>
                    <strong>Datos operativos del panel:</strong> tokens de sesión, API Key, historial de comandos,
                    clips generados, métricas de uso y preferencias del dashboard.
                </li>
                <li>
                    <strong>Datos técnicos:</strong> registros de errores, dirección IP aproximada e información del
                    navegador, empleados para seguridad, diagnóstico y prevención de abuso.
                </li>
            </ul>

            <h2>Datos que no recopilamos</h2>
            <ul>
                <li>Contraseñas de Twitch (la autenticación la gestiona Twitch de forma directa).</li>
                <li>Información de pago (el servicio no requiere suscripción ni cobro).</li>
                <li>
                    Permisos para acciones críticas de Twitch que no hayas autorizado expresamente (por ejemplo,
                    moderación avanzada o eliminación de contenido).
                </li>
            </ul>

            <h2>Finalidad del tratamiento</h2>
            <ul>
                <li>Identificar tu cuenta y ejecutar los comandos y funciones que configures.</li>
                <li>Mostrar estadísticas, historial y herramientas del panel.</li>
                <li>Aplicar límites de uso y detectar conductas abusivas.</li>
                <li>Corregir incidencias técnicas y mejorar el servicio.</li>
            </ul>

            <h2>Encargados y comunicación de datos</h2>
            <p>
                Compartimos datos únicamente con los proveedores necesarios para operar el servicio, en calidad de
                encargados del tratamiento o bajo obligaciones contractuales de confidencialidad:
            </p>
            <ul>
                <li>
                    <strong>Twitch</strong> — autenticación OAuth y consulta de la API pública.
                </li>
                <li>
                    <strong>Supabase</strong> — almacenamiento de perfiles, estadísticas y datos de aplicación.
                </li>
                <li>
                    <strong>Vercel</strong> — alojamiento, distribución de contenido y caché.
                </li>
                <li>
                    <strong>Groq</strong> — procesamiento de texto en minijuegos con IA (por ejemplo, la Bola 8),
                    limitado al contenido de la pregunta enviada por el usuario.
                </li>
            </ul>
            <p>No vendemos datos personales ni utilizamos publicidad basada en perfiles de usuario.</p>

            <h2>Plazo de conservación</h2>
            <ul>
                <li>
                    Los datos se conservan mientras mantengas una cuenta activa, salvo que solicites su eliminación o
                    uses las opciones de borrado del panel.
                </li>
                <li>
                    Los tokens de Twitch expiran o se renuevan según las políticas de Twitch y el estado de tu sesión.
                </li>
                <li>Los registros de seguridad se conservan durante un periodo limitado y posteriormente se eliminan.</li>
            </ul>

            <h2>Derechos del usuario</h2>
            <ul>
                <li>Exportar o eliminar tu cuenta desde la sección <strong>Perfil</strong> del panel.</li>
                <li>
                    Revocar el acceso de la aplicación en{' '}
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
                    Solicitar aclaraciones o ejercer consultas adicionales a través del contacto indicado al final de
                    este documento.
                </li>
            </ul>

            <h2>Cookies y almacenamiento local</h2>
            <p>
                Utilizamos almacenamiento local del navegador para mantener la sesión y las preferencias del panel. El
                detalle se encuentra en la sección de{' '}
                <a href="#cookies" className={proseLink}>
                    cookies
                </a>
                .
            </p>

            <h2>Menores de edad</h2>
            <p>
                El servicio no está dirigido a menores de 13 años. Si detectamos que se han recopilado datos de un
                menor sin el consentimiento correspondiente, procederemos a su eliminación.
            </p>

            <h2>Seguridad</h2>
            <p>
                Aplicamos medidas razonables de protección, incluyendo comunicación cifrada (HTTPS), validación de
                sesión y límites de uso. Ningún sistema es completamente infalible; si identificas una vulnerabilidad
                o un uso indebido, repórtalo de inmediato a través del contacto indicado.
            </p>

            <h2>Actualizaciones</h2>
            <p>
                Esta política puede modificarse para adaptarse a cambios legales o del servicio. La fecha de la última
                revisión figura al inicio de la página. El uso continuado del servicio tras una actualización implica
                la aceptación de la versión vigente, junto con los{' '}
                <a href="#terminos" className={proseLink}>
                    términos de uso
                </a>
                .
            </p>

            <h2>Contacto</h2>
            <LegalContact />
        </>
    );
}

export function CookiesSectionContent() {
    return (
        <>
            <p>
                Este documento complementa la{' '}
                <a href="#privacidad" className={proseLink}>
                    política de privacidad
                </a>{' '}
                y describe el uso de almacenamiento local y tecnologías similares en{' '}
                <strong>{LEGAL_OPERATOR}</strong>. No empleamos cookies de publicidad ni vendemos datos derivados de
                tu navegación.
            </p>

            <h2>Almacenamiento local (localStorage y sessionStorage)</h2>
            <ul>
                <li>Mantener la sesión activa y recordar tu API Key durante el uso del panel.</li>
                <li>Guardar preferencias de interfaz (pestaña activa, favoritos y caché local de datos).</li>
            </ul>
            <p>
                Puedes eliminar estos datos desde la configuración de tu navegador o borrando tu cuenta en el panel.
                Sin este almacenamiento, el inicio de sesión y el funcionamiento del dashboard se verán limitados.
            </p>

            <h2>Service worker</h2>
            <p>
                En el entorno de producción se utiliza un service worker para cachear recursos estáticos y mejorar los
                tiempos de carga. En desarrollo local permanece desactivado. Puedes desregistrarlo desde las
                herramientas de tu navegador si lo deseas.
            </p>

            <h2>Cookies técnicas de sesión</h2>
            <p>
                El backend puede establecer cookies estrictamente necesarias para la autenticación y la protección
                contra ataques CSRF. No se utilizan con fines de seguimiento entre sitios web.
            </p>

            <h2>Métricas de rendimiento</h2>
            <p>
                Podemos recopilar métricas agregadas de rendimiento (por ejemplo, tiempos de respuesta en la
                infraestructura de Vercel). Estos datos no permiten identificar de forma individual a los usuarios.
            </p>

            <h2>Cómo revocar o eliminar el almacenamiento</h2>
            <ul>
                <li>Utilizar las herramientas de privacidad o de borrado de datos de tu navegador.</li>
                <li>
                    Desconectar <strong>LosPerris - API</strong> en{' '}
                    <a
                        href="https://www.twitch.tv/settings/connections"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Conexiones de Twitch
                    </a>
                    .
                </li>
                <li>Eliminar tu perfil o limpiar el historial desde el panel de usuario.</li>
            </ul>

            <h2>Contacto</h2>
            <LegalContact />
        </>
    );
}
