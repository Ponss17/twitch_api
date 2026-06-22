import { LegalPageShell } from '@/components/legal/LegalPageShell';
import { appPath } from '@/lib/paths';

const CONTACT_EMAIL = 'jeancastrogudiel@gmail.com';

export function CookiesPage() {
    return (
        <LegalPageShell
            title="Política de Cookies y Almacenamiento Local"
            description="Qué guardamos en tu navegador y para qué."
            current="/cookies"
            updated="22 de junio de 2026"
        >
            <p>
                Esta página complementa la <a href={appPath('/privacidad')}>Política de Privacidad</a> y explica cómo
                LosPerris Twitch API usa cookies, almacenamiento local y tecnologías similares.
            </p>

            <h2>1. ¿Usamos cookies de marketing?</h2>
            <p>
                <strong>No.</strong> No usamos cookies publicitarias ni vendemos datos a anunciantes. Las tecnologías
                descritas abajo son necesarias para el funcionamiento, seguridad o métricas técnicas agregadas.
            </p>

            <h2>2. Almacenamiento local (localStorage / sessionStorage)</h2>
            <ul>
                <li>
                    <strong>Sesión y API Key</strong> — mantener tu login entre visitas al dashboard.
                </li>
                <li>
                    <strong>Preferencias</strong> — pestaña activa, favoritos de clips, caché local de datos del panel.
                </li>
                <li>
                    <strong>Sincronización</strong> — marcas de tiempo de última sync (p. ej. estadísticas del perfil).
                </li>
            </ul>
            <p>
                Puedes borrar estos datos desde las herramientas de tu navegador o eliminando tu cuenta en el panel.
                Perderás la sesión activa.
            </p>

            <h2>3. Service Worker (PWA)</h2>
            <p>
                En producción registramos un service worker para cachear assets estáticos y mejorar la carga offline
                básica. En desarrollo local está desactivado. Puedes desregistrarlo desde la configuración del navegador.
            </p>

            <h2>4. Cookies técnicas de sesión</h2>
            <p>
                El backend puede establecer cookies o headers de sesión estrictamente necesarios para autenticación,
                protección CSRF y continuidad de la sesión OAuth. No las usamos para rastreo cross-site.
            </p>

            <h2>5. Analítica y rendimiento</h2>
            <p>
                Podemos usar herramientas de métricas de rendimiento (p. ej. Vercel Speed Insights) que recopilan datos
                técnicos agregados (tiempos de carga, región aproximada). No identifican personalmente al usuario en
                condiciones normales.
            </p>

            <h2>6. Cómo gestionar o rechazar</h2>
            <ul>
                <li>Configura tu navegador para bloquear o borrar cookies y datos de sitio.</li>
                <li>Desconecta la app LosPerris desde{' '}
                    <a href="https://www.twitch.tv/settings/connections" target="_blank" rel="noopener noreferrer">
                        Conexiones de Twitch
                    </a>.
                </li>
                <li>Usa «Eliminar Perfil» o «Limpiar Datos» en el dashboard para borrar información en nuestros servidores.</li>
            </ul>
            <p>
                Si bloqueas el almacenamiento esencial, partes del Servicio (login, dashboard, comandos) pueden dejar de
                funcionar.
            </p>

            <h2>7. Contacto</h2>
            <p>
                Preguntas sobre cookies: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
        </LegalPageShell>
    );
}
