import { Info, Zap, Key, ShieldAlert, UserCog, BarChart2, IdCard, Skull, Gauge, Server, Weight, Rocket, Clock, Film, AlertCircle, ChevronRight, Megaphone, TrendingUp, Lightbulb, Binoculars, Shield, Dices, Wand2, Search, AlertTriangle, Swords, List } from 'lucide-react';

import { DocsCodeTabs } from '@/components/docs/DocsCodeTabs';
import { appPath } from '@/lib/paths';
import {
    docSection,
    docsAccent,
    docsCodeBlock,
    docsContent,
    docsEndpoint,
    docsInfoCard,
    docsInfoCardBlue,
    docsInfoCardFlat,
    docsInfoCardGreen,
    docsInfoCardPrimary,
    docsInfoCardPurple,
    docsInfoCardRed,
    docsIntroGrid,
    docsLead,
    docsLimitCard,
    docsLimitLabel,
    docsLimitsGrid,
    docsLimitValue,
    docsMainTitle,
    docsMethodGet,
    docsBadgeSuccess,
    docsBadgeWarning,
    docsBadgeError,
    docsBadgeNeutral,
    docsParamsTable,
    docsStepBadge,
    docsStepCard,
    docsStepNumber,
    docsStepSeparator,
    docsStepsGrid,
    docsStepsMini,
    docsUrl,
    docsUrlParam
} from '@/lib/docsTw';

const CLIPS_JSON = `[
  {
    "id": "FastLivelyTroutKeepo-7s9...",
    "url": "https://clips.twitch.tv/FastLivelyTroutKeepo-7s9...",
    "embed_url": "https://clips.twitch.tv/embed?clip=FastLivelyTroutKeepo-7s9...",
    "broadcaster_id": "12345678",
    "broadcaster_name": "LosPerris",
    "creator_id": "87654321",
    "creator_name": "ponss",
    "video_id": "22334455",
    "game_id": "509658",
    "language": "es",
    "title": "Epic Win en vivo!",
    "view_count": 420,
    "created_at": "2023-11-20T19:30:00Z",
    "thumbnail_url": "https://clips-media-assets2.twitch.tv/...",
    "duration": 30.5,
    "vod_offset": 480
  }
]`;

export function DocsContent() {
    return (
        <main className={docsContent}>
            <section id="intro" className={docSection} data-doc-section>
                <h1 className={docsMainTitle}>
                    LosPerris <span className={docsAccent}>Twitch API Docs</span>
                </h1>
                <p className={docsLead}>
                    Bienvenido a la guía oficial. Aquí encontrarás todo lo necesario para configurar tus comandos y
                    herramientas automáticas para tu chat de Twitch.
                </p>
                <div className={docsIntroGrid}>
                    <div className={docsInfoCardFlat}>
                        <Info />
                        <p>
                            <strong>Compatible:</strong> Nightbot, StreamElements, Fossabot y Wizebot.
                        </p>
                    </div>
                    <div className={docsInfoCardFlat}>
                        <Zap />
                        <p>
                            <strong>Actualización:</strong> Datos frescos cada <strong>30 segundos</strong> de forma
                            automática.
                        </p>
                    </div>
                </div>
            </section>

            <section id="auth" className={docSection} data-doc-section>
                <h2>
                    <Key /> Tu API Key
                </h2>
                <p>
                    La mayoría de los endpoints requieren una <code>apiKey</code> para funcionar. Puedes obtener tu
                    Clave Permanente conectando tu cuenta en el <a href={appPath('/')}>panel principal</a>.
                </p>
                <div className={docsInfoCard} style={{ marginTop: '1.5rem' }}>
                    <ShieldAlert />
                    <p>
                        <strong>¿Por qué verificar?</strong> Solo necesitamos permiso para{' '}
                        <strong>leer datos públicos</strong> y <strong>crear clips</strong> en tu nombre. No tocamos tu
                        clave de transmisión ni datos privados.
                    </p>
                </div>
            </section>

            <section id="profile" className={docSection} data-doc-section>
                <h2>
                    <UserCog /> Perfil y Seguridad
                </h2>
                <p>Gestiona tu identidad en la plataforma y configura las opciones de seguridad de tu cuenta.</p>
                <div className={docsInfoCardPrimary}>
                    <Key />
                    <p>
                        <strong>API Key Manager:</strong> Visualiza y regenera tu clave permanente usada para los
                        comandos de chat.
                    </p>
                </div>
                <div className={docsInfoCardPrimary}>
                    <BarChart2 />
                    <p>
                        <strong>Resumen de Actividad:</strong> Consulta tus estadísticas de uso: total de requests,
                        latencia promedio, tasa de éxito y actividad reciente.
                    </p>
                </div>
                <div className={docsInfoCardPrimary}>
                    <IdCard />
                    <p>
                        <strong>Tu Identidad:</strong> Visualiza tu ID de Twitch, nombre de usuario y fecha de última
                        conexión. Puedes copiar tu ID directamente desde el panel.
                    </p>
                </div>
                <div className={docsInfoCardPrimary}>
                    <Skull />
                    <p>
                        <strong>Zona de Peligro:</strong> Accede a opciones críticas como el borrado de cuenta mediante
                        el toggle de advertencia y confirmación de seguridad.
                    </p>
                </div>
            </section>

            <section id="limits" className={docSection} data-doc-section>
                <h2>
                    <Gauge /> Rate Limiting
                </h2>
                <p>Para asegurar la estabilidad del servicio para todos los streamers, aplicamos los siguientes límites:</p>
                <div className={docsLimitsGrid}>
                    <div className={docsLimitCard}>
                        <div className={docsLimitValue}>60</div>
                        <div className={docsLimitLabel}>Requests / minuto</div>
                    </div>
                    <div className={docsLimitCard}>
                        <div className={docsLimitValue}>10</div>
                        <div className={docsLimitLabel}>Req/min (Pesados)</div>
                    </div>
                    <div className={docsLimitCard}>
                        <div className={docsLimitValue}>60s</div>
                        <div className={docsLimitLabel}>Caché de Respuestas</div>
                    </div>
                </div>
                <div className={docsInfoCard}>
                    <Server />
                    <p>
                        <strong>Headers de Respuesta:</strong> Incluimos <code>X-RateLimit-Limit</code>,{' '}
                        <code>X-RateLimit-Remaining</code> y <code>X-RateLimit-Reset</code> en todas las respuestas para
                        que puedas monitorear tu consumo.
                    </p>
                </div>
                <div className={docsInfoCardPrimary}>
                    <Weight />
                    <div className="flex-1">
                        <p style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: 'white' }}>¿Qué son los Endpoints "Pesados"?</p>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#dedede' }}>
                            Son comandos complejos que requieren mayor procesamiento o realizar múltiples consultas en tiempo real a los servidores de Twitch. Actualmente, los endpoints pesados son:
                        </p>
                        <ul style={{ margin: '0.5rem 0 0 1.25rem', padding: 0, fontSize: '0.9rem', color: '#dedede', listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <li><strong>Crear Clip:</strong> Requiere verificar el estado del stream en vivo y ordenar el procesamiento del video.</li>
                            <li><strong>Shoutout (!so):</strong> Descarga la información actualizada del canal objetivo y su categoría de juego en tiempo real.</li>
                            <li><strong>Tendencias:</strong> Analiza grandes volúmenes de mensajes recientes del chat para calcular estadísticas.</li>
                        </ul>
                        <p style={{ marginTop: '0.5rem', marginBottom: 0, fontSize: '0.85rem', color: '#a1a1aa' }}>
                            <em>Nota:</em> Los comandos normales (como Followage, Bola 8 o Ruleta) son muy rápidos y utilizan el límite general de 60 peticiones por minuto.
                        </p>
                    </div>
                </div>
            </section>

            <section id="quick-start" className={docSection} data-doc-section>
                <h2>
                    <Rocket /> ¡Comienza Ya!
                </h2>
                <div className={docsStepsGrid}>
                    <div className={docsStepCard}>
                        <div className={docsStepNumber}>1</div>
                        <h3>Obtén tu API Key</h3>
                        <p>
                            Inicia sesión en el <a href={appPath('/dashboard')}>Dashboard</a> para obtener tu clave única.
                        </p>
                    </div>
                    <div className={docsStepCard}>
                        <div className={docsStepNumber}>2</div>
                        <h3>Elige un Comando</h3>
                        <p>Selecciona una herramienta del menú (ej: Bola 8, Clips).</p>
                    </div>
                    <div className={docsStepCard}>
                        <div className={docsStepNumber}>3</div>
                        <h3>Copia y Pega</h3>
                        <p>Copia el código generado y pégalo en el chat de tu bot.</p>
                    </div>
                    <div className={docsStepCard}>
                        <div className={docsStepNumber}>4</div>
                        <h3>¡Disfruta!</h3>
                        <p>Tus viewers ya pueden interactuar con los nuevos comandos.</p>
                    </div>
                </div>
            </section>

            <section id="followage" className={docSection} data-doc-section>
                <h2>
                    <Clock /> Followage
                </h2>
                <p>Calcula cuánto tiempo lleva un usuario siguiendo al canal.</p>
                <table className={docsParamsTable}>
                    <thead>
                        <tr>
                            <th>Parámetro</th>
                            <th>Requerido</th>
                            <th>Descripción</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className={docsUrlParam}>channel</td>
                            <td>Sí</td>
                            <td>Canal a verificar.</td>
                        </tr>
                        <tr>
                            <td className={docsUrlParam}>user</td>
                            <td>Sí</td>
                            <td>Usuario seguidor.</td>
                        </tr>
                        <tr>
                            <td className={docsUrlParam}>template</td>
                            <td>No</td>
                            <td>
                                Personaliza la respuesta. Ej: <code>{'{user} lleva {time} siguiendo a {channel}'}</code>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <DocsCodeTabs
                    trigger="!followage"
                    snippets={{
                        nightbot:
                            '$(urlfetch {baseURL}/api/twitch/followage?channel=$(channel)&user=$(touser)&apiKey=TU_API_KEY)',
                        streamelements:
                            '${customapi.{baseURL}/api/twitch/followage?channel=${channel}&user=${touser}&apiKey=TU_API_KEY}',
                        fossabot:
                            '$(customapi {baseURL}/api/twitch/followage?channel=$(channel)&user=$(touser)&apiKey=TU_API_KEY)'
                    }}
                />
            </section>

            <section id="create-clip" className={docSection} data-doc-section>
                <h2>
                    <Film /> Crear Clip
                </h2>
                <p>Genera un clip instantáneo del canal. Ideal para capturar momentos épicos.</p>
                <div className={docsInfoCard}>
                    <AlertCircle />
                    <p>
                        <strong>Requisito:</strong> El canal debe estar <strong>en vivo</strong> para poder generar un
                        clip. Si el stream está offline, recibirás un mensaje de error.
                    </p>
                </div>
                <div className={docsStepsMini}>
                    <span className={docsStepBadge}>1</span> Selecciona tu bot
                    <ChevronRight className={` ${docsStepSeparator}`} />
                    <span className={docsStepBadge}>2</span> Copia el código
                    <ChevronRight className={` ${docsStepSeparator}`} />
                    <span className={docsStepBadge}>3</span> Pega en el chat
                </div>
                <DocsCodeTabs
                    trigger="!clip"
                    snippets={{
                        nightbot:
                            '🎬 Clip creado por $(user): $(urlfetch {baseURL}/api/twitch/create-clip?channel=$(channel)&apiKey=TU_API_KEY)',
                        streamelements:
                            '🎬 Clip creado por ${user}: ${customapi.{baseURL}/api/twitch/create-clip?channel=${channel}&apiKey=TU_API_KEY}',
                        fossabot:
                            '🎬 Clip creado por $(user): $(customapi {baseURL}/api/twitch/create-clip?channel=$(channel)&apiKey=TU_API_KEY)'
                    }}
                />
            </section>

            <section id="shoutout" className={docSection} data-doc-section>
                <h2>
                    <Megaphone /> Shoutout (!so)
                </h2>
                <p>Genera un mensaje promocionando a otro streamer con su último juego y enlace directo.</p>
                <div className={docsEndpoint}>
                    <span className={docsMethodGet}>GET</span>
                    <span className={docsUrl}>
                        /api/twitch/shoutout?channel={'{canal}'}&touser={'{objetivo}'}&apiKey={'{clave}'}&template=
                        {'{mensaje}'}
                    </span>
                </div>
                <table className={docsParamsTable}>
                    <thead>
                        <tr>
                            <th>Parámetro</th>
                            <th>Tipo</th>
                            <th>Descripción</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className={docsUrlParam}>template</td>
                            <td>String</td>
                            <td>
                                (Opcional) Personaliza el shoutout. Variables: <code>{'{user}'}</code>,{' '}
                                <code>{'{game}'}</code>, <code>{'{url}'}</code>.
                            </td>
                        </tr>
                    </tbody>
                </table>
                <DocsCodeTabs
                    trigger="!so"
                    snippets={{
                        nightbot:
                            '📢 $(urlfetch {baseURL}/api/twitch/shoutout?channel=$(channel)&touser=$(touser)&apiKey=TU_API_KEY)',
                        streamelements:
                            '📢 ${customapi.{baseURL}/api/twitch/shoutout?channel=${channel}&touser=${touser}&apiKey=TU_API_KEY}',
                        fossabot:
                            '📢 $(customapi {baseURL}/api/twitch/shoutout?channel=$(channel)&touser=$(touser)&apiKey=TU_API_KEY)'
                    }}
                />
            </section>

            <section id="trends" className={docSection} data-doc-section>
                <h2>
                    <TrendingUp /> Tendencias
                </h2>
                <p>
                    ¿Qué está es lo más comentado en tu chat? Esta herramienta analiza los mensajes en vivo y genera un
                    ranking (Top 10) de las palabras o emotes más repetidos.
                </p>
                <div className={docsInfoCard}>
                    <Lightbulb />
                    <p>
                        <strong>Uso ideal:</strong> Mide el &quot;hype&quot; de un momento específico o descubre qué emote
                        está spameando tu comunidad. Incluye un temporizador para sesiones de análisis.
                    </p>
                </div>
            </section>

            <section id="stalker" className={docSection} data-doc-section>
                <h2>
                    <Binoculars /> Stalker
                </h2>
                <p>
                    Tu centro de inteligencia. Investiga a cualquier usuario de Twitch al instante para obtener contexto
                    rápido.
                </p>
                <div className={docsInfoCardPrimary}>
                    <Shield />
                    <p>
                        <strong>Uso ideal:</strong> Verifica cuándo se creó una cuenta, cuánto tiempo lleva siguiendo el
                        canal y lee sus últimos mensajes en el chat (logs).
                    </p>
                </div>
            </section>

            <section id="roulette" className={docSection} data-doc-section>
                <h2>
                    <Dices /> Ruleta
                </h2>
                <p>La herramienta definitiva para sorteos y giveaways en tu stream.</p>
                <div className={docsInfoCardPurple}>
                    <Wand2 />
                    <p>
                        <strong>Lógica Híbrida:</strong> Puedes crear una lista manual de opciones o dejar que la API
                        cargue automáticamente a los <strong>usuarios activos</strong> del chat en tiempo real.
                    </p>
                </div>
            </section>

            <section id="magic8" className={docSection} data-doc-section>
                <h2>
                    <Search /> Bola 8 Mágica (IA)
                </h2>
                <p>Respuestas místicas (o sarcásticas) a tus preguntas.</p>
                <div className={docsEndpoint}>
                    <span className={docsMethodGet}>GET</span>
                    <span className={docsUrl}>
                        /api/twitch/minigames/magic8?question={'{pregunta}'}&mood={'{tono}'}&apiKey={'{clave}'}
                    </span>
                </div>
                <table className={docsParamsTable}>
                    <thead>
                        <tr>
                            <th>Dato</th>
                            <th>Tipo</th>
                            <th>Info</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <code>question</code>
                            </td>
                            <td>String</td>
                            <td>La pregunta que quieres hacer a la Bola 8.</td>
                        </tr>
                        <tr>
                            <td>
                                <code>mood</code>
                            </td>
                            <td>String</td>
                            <td>
                                Tono de personalidad: <code>classic</code>, <code>sarcastic</code>,{' '}
                                <code>toxic</code>, <code>helpful</code>.
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <code>apiKey</code>
                            </td>
                            <td>String</td>
                            <td>Tu Clave Permanente del panel.</td>
                        </tr>
                    </tbody>
                </table>
                <DocsCodeTabs
                    trigger="!8ball"
                    snippets={{
                        nightbot:
                            '🎱 $(user) pregunta: $(query) | La Bola 8 dice: $(urlfetch {baseURL}/api/twitch/minigames/magic8?question=$(query)&mood=sarcastic&apiKey=TU_API_KEY)',
                        streamelements:
                            '🎱 ${user} pregunta: ${1:} | La Bola 8 dice: ${customapi.{baseURL}/api/twitch/minigames/magic8?question=${1:}&mood=sarcastic&apiKey=TU_API_KEY}',
                        fossabot:
                            '🎱 $(user) pregunta: $(query) | La Bola 8 dice: $(customapi {baseURL}/api/twitch/minigames/magic8?question=$(query)&mood=sarcastic&apiKey=TU_API_KEY)'
                    }}
                />
            </section>

            <section id="russian" className={docSection} data-doc-section>
                <h2>
                    <Skull /> Ruleta Rusa
                </h2>
                <p>
                    Un juego de alto riesgo para tu chat. Los usuarios prueban su suerte con un revólver virtual de 6
                    recámaras. Si pierden, reciben un <strong>Timeout</strong> real.
                </p>
                <div className={docsEndpoint}>
                    <span className={docsMethodGet}>GET</span>
                    <span className={docsUrl}>/api/twitch/minigames/russian?user={'{usuario}'}&apiKey={'{clave}'}</span>
                </div>
                <div className={`${docsInfoCardRed} mt-6`}>
                    <AlertTriangle />
                    <p>
                        <strong>Cuidado:</strong> Este comando puede expulsar temporalmente a tus usuarios. Úsalo bajo tu
                        propio riesgo.
                    </p>
                </div>
                <DocsCodeTabs
                    trigger="!russian"
                    snippets={{
                        nightbot:
                            '$(urlfetch {baseURL}/api/twitch/minigames/russian?user=$(user)&apiKey=TU_API_KEY)',
                        streamelements:
                            '${customapi.{baseURL}/api/twitch/minigames/russian?user=${user}&apiKey=TU_API_KEY}',
                        fossabot:
                            '$(customapi {baseURL}/api/twitch/minigames/russian?user=$(user)&apiKey=TU_API_KEY)'
                    }}
                />
            </section>

            <section id="duel" className={docSection} data-doc-section>
                <h2>
                    <Swords /> Duelo
                </h2>
                <p>Desafía a otros usuarios a un duelo a muerte (simulado). El ganador se lleva la gloria.</p>
                <div className={docsEndpoint}>
                    <span className={docsMethodGet}>GET</span>
                    <span className={docsUrl}>
                        /api/twitch/minigames/duel?challenger={'{retador}'}&target={'{oponente}'}&apiKey={'{clave}'}
                    </span>
                </div>
                <h3>Parámetros</h3>
                <table className={docsParamsTable}>
                    <thead>
                        <tr>
                            <th>Dato</th>
                            <th>Info</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <code>target</code>
                            </td>
                            <td>El usuario al que quieres desafiar (ej: @Nightbot).</td>
                        </tr>
                        <tr>
                            <td>
                                <code>challenger</code>
                            </td>
                            <td>El usuario que inicia el duelo (opcional).</td>
                        </tr>
                    </tbody>
                </table>
                <DocsCodeTabs
                    trigger="!duel"
                    snippets={{
                        nightbot:
                            '$(urlfetch {baseURL}/api/twitch/minigames/duel?challenger=$(user)&target=$(touser)&apiKey=TU_API_KEY)',
                        streamelements:
                            '${customapi.{baseURL}/api/twitch/minigames/duel?challenger=${user}&target=${touser}&apiKey=TU_API_KEY}',
                        fossabot:
                            '$(customapi {baseURL}/api/twitch/minigames/duel?challenger=$(user)&target=$(touser)&apiKey=TU_API_KEY)'
                    }}
                />
            </section>

            <section id="get-clips" className={docSection} data-doc-section>
                <h2>
                    <List /> Listar Clips
                </h2>
                <p>Endpoint para desarrolladores: obtén un JSON con los clips más recientes.</p>
                <div className={docsEndpoint}>
                    <span className={docsMethodGet}>GET</span>
                    <span className={docsUrl}>
                        /api/twitch/dashboard/get-clips?channel={'{canal}'}&apiKey={'{tu_api_key}'}&limit=10
                    </span>
                </div>
                <h3>Ejemplo de Respuesta (JSON)</h3>
                <div className={docsCodeBlock}>
                    <code className="text-[#a1a1aa]">{CLIPS_JSON}</code>
                </div>
            </section>

            <section id="errores" className={docSection} data-doc-section>
                <h2>
                    <AlertTriangle /> Respuestas HTTP
                </h2>
                <p>
                    La API utiliza códigos de estado HTTP estándar para indicar el resultado de las solicitudes.
                </p>
                <table className={docsParamsTable}>
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Estado</th>
                            <th>Descripción</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <span className={docsBadgeSuccess}>
                                    200
                                </span>
                            </td>
                            <td>OK</td>
                            <td>Solicitud procesada correctamente.</td>
                        </tr>
                        <tr>
                            <td>
                                <span className={docsBadgeError}>
                                    401
                                </span>
                            </td>
                            <td>Unauthorized</td>
                            <td>Tu API Key es inválida.</td>
                        </tr>
                        <tr>
                            <td>
                                <span className={docsBadgeWarning}>
                                    400
                                </span>
                            </td>
                            <td>Bad Request</td>
                            <td>Faltan parámetros obligatorios (ej: canal, usuario).</td>
                        </tr>
                        <tr>
                            <td>
                                <span className={docsBadgeNeutral}>
                                    404
                                </span>
                            </td>
                            <td>Not Found</td>
                            <td>El canal o usuario especificado no existe en Twitch.</td>
                        </tr>
                        <tr>
                            <td>
                                <span className={docsBadgeError}>
                                    500 / 503
                                </span>
                            </td>
                            <td>Server Error</td>
                            <td>Error interno o red inestable temporalmente.</td>
                        </tr>
                    </tbody>
                </table>
            </section>
        </main>
    );
}
