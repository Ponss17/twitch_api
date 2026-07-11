import {
    LEGAL_CONTACT_DISCORD,
    LEGAL_OPERATOR
} from '@/features/legal/legalConstants';

const proseLink = 'text-primary underline underline-offset-2';

export function TermsSectionContent() {
    return (
        <>
            <p>
                Los presentes términos regulan el acceso y uso de <strong>{LEGAL_OPERATOR}</strong>, disponible en{' '}
                <a href="https://ttv.losperris.dev">ttv.losperris.dev</a>. Al utilizar el sitio, conectar su cuenta de
                Twitch (la aplicación aparece como <strong>LosPerris - API</strong>) o emplear su API Key, usted
                acepta estas condiciones y la{' '}
                <a href="#privacidad" className={proseLink}>
                    política de privacidad
                </a>
                .
            </p>

            <h2>Descripción del servicio</h2>
            <p>
                {LEGAL_OPERATOR} es un proyecto gratuito dirigido a streamers de Twitch. Ofrece comandos de chat, panel de
                control, minijuegos y estadísticas de uso. El servicio se proporciona sin garantía de disponibilidad
                continua y puede modificarse, interrumpirse o discontinuarse sin previo aviso.
            </p>

            <h2>Obligaciones del usuario</h2>
            <ul>
                <li>Contar con una cuenta de Twitch válida y cumplir sus normas de uso.</li>
                <li>
                    Custodiar adecuadamente su API Key y no divulgarla en espacios públicos, chats o repositorios
                    accesibles a terceros.
                </li>
                <li>
                    Poder regenerar su clave, exportar datos o eliminar su perfil desde{' '}
                    <strong>Configuración</strong> del panel en cualquier momento.
                </li>
                <li>
                    Asumir la responsabilidad por la configuración y el uso de los comandos en su canal de chat.
                </li>
            </ul>

            <h2>Conductas prohibidas</h2>
            <ul>
                <li>Realizar spam, abuso, acoso o eludir los límites de uso de la API.</li>
                <li>Acceder a datos de otros usuarios sin autorización.</li>
                <li>Atacar la infraestructura del servicio o vulnerar sus medidas de seguridad.</li>
                <li>Suplantar a Twitch u otros terceros, o comercializar el servicio como propio.</li>
            </ul>

            <h2>Relación con Twitch</h2>
            <p>
                {LEGAL_OPERATOR} no está afiliado ni respaldado por Twitch Interactive, Inc. Los datos obtenidos mediante su
                API se utilizan conforme a sus condiciones. El uso de comandos en el canal del usuario es
                responsabilidad exclusiva del titular del mismo.
            </p>

            <h2>Limitación de responsabilidad</h2>
            <p>
                Al tratarse de un servicio gratuito, no garantizamos su disponibilidad ininterrumpida ni la ausencia de
                errores. No nos hacemos responsables de pérdidas derivadas de caídas del servicio, fallos técnicos o
                del uso de los comandos en el canal del usuario.
            </p>

            <h2>Suspensión del servicio</h2>
            <p>
                Nos reservamos el derecho de limitar o revocar el acceso ante incumplimientos de estos términos. El
                usuario puede dejar de utilizar el servicio en cualquier momento desconectando la aplicación en Twitch o
                eliminando su perfil.
            </p>

            <h2>Modificaciones</h2>
            <p>
                Estos términos pueden actualizarse. La fecha indicada al inicio del documento corresponde a la última
                revisión publicada.
            </p>
        </>
    );
}

export function PrivacySectionContent() {
    return (
        <>
            <p>
                La presente política describe el tratamiento de la información personal en{' '}
                <a href="https://ttv.losperris.dev">ttv.losperris.dev</a> por parte de{' '}
                <strong>{LEGAL_OPERATOR}</strong>. Al conectar Twitch, la aplicación autorizada se identifica como{' '}
                <strong>LosPerris - API</strong>.
            </p>

            <h2>Quién gestiona los datos</h2>
            <p>
                LosPerris Twitch API lo administra{' '}
                <span className="font-medium text-primary">@{LEGAL_CONTACT_DISCORD}</span> en Discord. De ahí salen las
                decisiones sobre qué guardamos y cómo usamos tu información.
            </p>

            <h2>Datos que recopilamos</h2>
            <ul>
                <li>
                    <strong>Datos de Twitch (al autorizar la conexión):</strong> identificador, nombre de usuario, nombre
                    para mostrar, imagen de perfil e información pública del canal.
                </li>
                <li>
                    <strong>Datos del panel:</strong> identificador de sesión (cookie), API Key, historial de
                    actividad, estadísticas de uso, zona horaria y preferencias del dashboard.
                </li>
                <li>
                    <strong>Datos técnicos:</strong> registros de errores, dirección IP e información del navegador
                    cuando hace falta para seguridad, límites de uso o diagnóstico.
                </li>
            </ul>

            <h2>Datos que no recopilamos</h2>
            <ul>
                <li>Contraseñas de Twitch (la autenticación la gestiona Twitch directamente).</li>
                <li>Correo electrónico (aunque Twitch puede pedir el permiso al conectar, no lo guardamos).</li>
                <li>Información de pago (el servicio no requiere suscripción ni cobro).</li>
                <li>
                    Acciones en tu cuenta de Twitch fuera de los permisos que aceptas al autorizar{' '}
                    <strong>LosPerris - API</strong>.
                </li>
            </ul>

            <h2>Uso de los datos</h2>
            <ul>
                <li>Identificar la cuenta del usuario y ejecutar los comandos y funciones configurados.</li>
                <li>Mostrar estadísticas, historial y herramientas del panel.</li>
                <li>Aplicar límites de uso y detectar conductas abusivas.</li>
                <li>Corregir incidencias técnicas y mejorar el servicio.</li>
            </ul>

            <h2>Proveedores y terceros</h2>
            <p>Los datos se comparten únicamente con los proveedores necesarios para operar el servicio:</p>
            <ul>
                <li>
                    <strong>Twitch</strong> — autenticación y consulta de la API pública.
                </li>
                <li>
                    <strong>Supabase</strong> — almacenamiento de perfiles y estadísticas.
                </li>
                <li>
                    <strong>Vercel</strong> — alojamiento, distribución de contenido y métricas de rendimiento (Speed
                    Insights, sin identificar a usuarios individuales).
                </li>
                <li>
                    <strong>Groq</strong> — procesamiento de texto en la Bola 8 mágica (solo la pregunta enviada).
                </li>
                <li>
                    <strong>Discord</strong> — solo si envías un mensaje desde la sección Feedback del panel.
                </li>
            </ul>
            <p>No vendemos datos personales ni utilizamos publicidad basada en perfiles.</p>

            <h2>Conservación de los datos</h2>
            <ul>
                <li>
                    Los datos se conservan mientras la cuenta permanezca activa, salvo solicitud de eliminación o uso
                    de las opciones de borrado del panel.
                </li>
                <li>Los tokens de Twitch expiran o se renuevan según las políticas de Twitch y el estado de la sesión.</li>
                <li>
                    El historial de actividad del panel se limita a las últimas entradas; los registros técnicos del
                    servidor dependen del tiempo de retención de Vercel.
                </li>
            </ul>

            <h2>Derechos del usuario</h2>
            <ul>
                <li>
                    Exportar o eliminar tu cuenta desde <strong>Configuración</strong> del panel.
                </li>
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
                <li>Pedirnos que corrijamos un dato equivocado sobre tu cuenta.</li>
                <li>Solicitar aclaraciones adicionales; no dudes en contactarnos.</li>
            </ul>

            <h2>Cookies y almacenamiento local</h2>
            <p>
                Usamos una cookie <strong>HttpOnly</strong> para mantener tu sesión del panel: solo lleva un identificador
                firmado, nunca el token de Twitch, así que ningún script puede leerla. También usamos almacenamiento
                local para tu API Key visible en configuración y para preferencias del dashboard. El detalle está en la
                sección de{' '}
                <a href="#almacenamiento" className={proseLink}>
                    Almacenamiento
                </a>
                .
            </p>

            <h2>Menores de edad</h2>
            <p>
                El servicio no está dirigido a menores de 13 años y requiere una cuenta de Twitch. Si crees que un menor
                lo ha usado sin permiso, no dudes en contactarnos.
            </p>

            <h2>Seguridad</h2>
            <p>
                Protegemos tu sesión con HTTPS, una cookie HttpOnly que ningún script puede leer, validación en cada
                petición y límites de uso para frenar abusos. Si ves una vulnerabilidad o un uso indebido, dínoslo — no
                dudes en contactarnos.
            </p>

            <h2>Actualizaciones</h2>
            <p>
                Esta política puede modificarse para adaptarse a cambios legales o del servicio. La fecha de la última
                revisión figura al inicio del documento. El uso continuado implica la aceptación de la versión vigente,
                junto con los{' '}
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
                Este documento complementa la{' '}
                <a href="#privacidad" className={proseLink}>
                    política de privacidad
                </a>{' '}
                y describe el uso de almacenamiento local y tecnologías similares en <strong>{LEGAL_OPERATOR}</strong>.
                No empleamos cookies de publicidad ni vendemos datos derivados de la navegación.
            </p>

            <h2>Almacenamiento local</h2>
            <ul>
                <li>
                    <strong>Cookie de sesión (HttpOnly):</strong> identifica tu cuenta en el panel sin exponer el token
                    de Twitch al navegador.
                </li>
                <li>API Key y preferencias de interfaz (pestaña activa, favoritos y caché local).</li>
            </ul>
            <p>
                No usamos cookies de seguimiento ni publicidad. Puedes borrar el almacenamiento local desde el
                navegador o eliminar la cuenta en el panel. Sin la cookie de sesión, tendrás que volver a conectar
                Twitch.
            </p>

            <h2>Service worker</h2>
            <p>
                En producción se utiliza un service worker para cachear recursos estáticos y mejorar los tiempos de
                carga. En desarrollo local permanece desactivado y puede desregistrarse desde las herramientas del
                navegador.
            </p>

            <h2>Protección CSRF</h2>
            <p>
                Las peticiones que modifican datos comprueban el origen de la solicitud (cabeceras Origin o Referer). No
                usamos cookies para esto.
            </p>

            <h2>Métricas de rendimiento</h2>
            <p>
                Usamos Vercel Speed Insights para métricas agregadas de rendimiento (por ejemplo, tiempos de carga).
                No permiten identificar individualmente a los usuarios.
            </p>

            <h2>Eliminación del almacenamiento</h2>
            <ul>
                <li>Utilizar las herramientas de privacidad o borrado de datos del navegador.</li>
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
                <li>Eliminar la cuenta o limpiar estadísticas y actividad desde <strong>Configuración</strong>.</li>
            </ul>
        </>
    );
}
