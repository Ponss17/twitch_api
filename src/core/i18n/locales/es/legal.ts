/** Fragmento i18n: legal (es). */
export const legal = {
legal: {
        introTerms: 'Los presentes términos regulan el acceso y uso de **LosPerris API**, disponible en [ttv.losperris.dev](https://ttv.losperris.dev). Al utilizar el sitio, conectar su cuenta de Twitch (la aplicación aparece como **LosPerris - API**) o emplear su API Key, usted acepta estas condiciones y la política de privacidad.',
        introPrivacy: 'La presente política describe el tratamiento de la información personal en [ttv.losperris.dev](https://ttv.losperris.dev) por parte de **LosPerris API**. Al conectar Twitch, la aplicación autorizada se identifica como **LosPerris - API**.',
        introCookies: 'Este documento complementa la política de privacidad y describe el uso de almacenamiento local y tecnologías similares en **LosPerris API**. No empleamos cookies de publicidad ni vendemos datos derivados de la navegación.',
        sections: [
            {
                title: 'Descripción del servicio',
                content: 'Proporcionamos un panel de control interactivo para Twitch que permite a los streamers interactuar con su audiencia, mediante comandos, minijuegos y un overlay en pantalla. No almacenamos audio, video ni credenciales bancarias.'
            },
            {
                title: 'Obligaciones del usuario',
                content: 'Al iniciar sesión, aceptas que eres el titular de la cuenta de Twitch o tienes autorización para usarla. Puedes exportar o eliminar tus datos en la pestaña Configuración del panel en cualquier momento.'
            },
            {
                title: 'Conductas prohibidas',
                content: 'Queda prohibido el uso del servicio para spam masivo, actividades ilícitas o cualquier acción que infrinja los Términos de Servicio de Twitch. Nos reservamos el derecho de revocar el acceso a cuentas que abusen de los límites de la API.'
            },
            {
                title: 'Limitación de responsabilidad',
                content: 'El servicio se proporciona "tal cual". No garantizamos un 100% de disponibilidad ni nos hacemos responsables de daños directos o indirectos derivados de interrupciones, pérdidas de datos o cambios en la API de Twitch.'
            },
            {
                title: 'Suspensión del servicio',
                content: 'Podemos suspender temporalmente el acceso para realizar mantenimiento o si detectamos tráfico anómalo que ponga en riesgo la infraestructura compartida.'
            },
            {
                title: 'Modificaciones',
                content: 'Podemos modificar estos términos en cualquier momento. El uso continuado del servicio tras los cambios constituye su aceptación.'
            },
            {
                title: 'Quién gestiona los datos',
                content: 'Tus datos son procesados por LosPerris API, operando bajo la infraestructura detallada a continuación. Actuamos como intermediarios entre tu cuenta de Twitch y las funciones del panel.'
            },
            {
                title: 'Datos que recopilamos',
                content: 'Recopilamos tu ID de Twitch, login, tipo de afiliado y fecha de creación de la cuenta para proveer la autenticación primaria. Almacenamos tus configuraciones personalizadas (comandos, minijuegos) y un registro temporal de los últimos 200 eventos ocurridos en tu canal para alimentar tu panel.'
            },
            {
                title: 'Datos que no recopilamos',
                content: 'No almacenamos contraseñas (usamos OAuth2). No recopilamos, leemos ni almacenamos mensajes de tu chat que no sean invocaciones a comandos específicos del bot. No recopilamos información de pago ni direcciones.'
            },
            {
                title: 'Uso de los datos',
                content: 'Tus datos se utilizan exclusivamente para habilitar las funcionalidades de tu panel de control, procesar tus configuraciones de minijuegos y estadísticas. No vendemos ni cedemos datos a terceros con fines publicitarios. En la página de inicio podemos mostrar, de cuentas activas pioneras con avatar público, el login, nombre visible, imagen de perfil, tipo de afiliado y una versión filtrada de tu biografía pública de Twitch (sin enlaces clicables). Nunca mostramos tokens ni datos privados.'
            },
            {
                title: 'Proveedores y terceros',
                content: 'Compartimos datos mínimos estrictamente necesarios con nuestros proveedores de infraestructura: Twitch (autenticación y consulta), Supabase (almacenamiento de perfiles), Vercel (alojamiento y métricas), Groq (procesamiento de texto en la Bola 8) y Discord (solo si envías feedback voluntario).'
            },
            {
                title: 'Conservación de los datos',
                content: 'Los perfiles y la configuración se mantienen mientras tu cuenta esté activa. Los registros de actividad de tu canal guardan únicamente los eventos más recientes. Si decides eliminar tu cuenta, todos tus datos se borran inmediatamente de forma permanente de nuestra base de datos.'
            },
            {
                title: 'Derechos del usuario',
                content: 'Tienes derecho a conocer qué datos tenemos, corregir datos inexactos, y exportar o eliminar tu cuenta desde la sección Configuración del panel en cualquier momento. La eliminación es permanente.'
            },
            {
                title: 'Cookies y almacenamiento local',
                content: 'Utilizamos una cookie de sesión httpOnly cifrada (`lp_sess`) para mantener tu acceso al panel, y almacenamiento local (localStorage/IndexedDB) para preferencias (modo oscuro, idioma) y cachés temporales del panel. No empleamos cookies de publicidad ni vendemos datos derivados de la navegación.'
            },
            {
                title: 'Menores de edad',
                content: 'El servicio está dirigido a usuarios mayores de 13 años (o la edad mínima requerida por Twitch en su país). No recopilamos intencionalmente datos de menores de esa edad.'
            },
            {
                title: 'Seguridad',
                content: 'Implementamos cifrado en tránsito (HTTPS) y en reposo mediante Supabase. Tu token de sesión es de corta duración y se renueva automáticamente. Nunca exponemos tokens de API de Twitch al cliente.'
            },
            {
                title: 'Actualizaciones',
                content: 'Esta política puede ser actualizada. La fecha de última revisión siempre estará visible en la parte inferior de este documento.'
            },
            {
                title: 'Almacenamiento local',
                content: 'Se utiliza localStorage/IndexedDB para preferencias del panel y para acelerar la carga con respuestas temporales en caché. La autenticación del panel se basa en la cookie de sesión, no en guardar tu API Key en claro.'
            },
            {
                title: 'Service worker',
                content: 'Podemos emplear Service Workers para soportar notificaciones o capacidades offline del panel, los cuales residen en tu dispositivo local. No los usamos para publicidad ni rastreo comercial.'
            },
            {
                title: 'Métricas de rendimiento',
                content: 'Utilizamos Vercel Web Analytics y Speed Insights de forma agregada/anónima para monitorizar tiempos de carga e identificar cuellos de botella. No son cookies de publicidad ni perfiles publicitarios.'
            },
            {
                title: 'Gestión y eliminación',
                content: 'Puedes limpiar el almacenamiento local cerrando sesión, borrando los datos del sitio en tu navegador, o usando las opciones de limpieza en Configuración. Al cerrar sesión también se invalida la cookie de sesión del panel.'
            }
        ]
    },

verifying: {
        authenticated: 'AUTENTICADO',
        accessGranted: 'Acceso concedido. Redirigiendo...',
        cacheActive: 'Caché local activa — carga rápida.',
        noCache: 'Sincronizando perfil seguro...',
    }
};
