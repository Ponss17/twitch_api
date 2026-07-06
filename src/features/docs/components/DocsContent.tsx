import { Info, Zap, Key, ShieldAlert, UserCog, BarChart2, IdCard, Skull, Gauge, Server, Weight, Rocket, Clock, Film, AlertCircle, ChevronRight, Megaphone, TrendingUp, Binoculars, Dices, AlertTriangle, Swords, List } from 'lucide-react';
import { MAGIC8_ICON, RUSSIAN_ICON } from '@/features/dashboard/lib/dashboardTabs';

import { DocsCodeTabs } from '@/features/docs/components/DocsCodeTabs';
import { DocsOverlaySection } from '@/features/docs/components/DocsOverlaySection';
import { appPath } from '@/core/config/paths';
import {
    docSection,
    docsAccent,
    docsCodeBlock,
    docsContent,
    docsEndpoint,
    docsInfoCard,
    docsInfoCardFlat,
    docsInfoCardPrimary,
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
    docsBadgeBeta,
    docsParamsTable,
    docsStepBadge,
    docsStepCard,
    docsStepNumber,
    docsStepSeparator,
    docsStepsGrid,
    docsStepsMini,
    docsUrl,
    docsUrlParam
} from '@/core/ui/docsTw';

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
        <div className={docsContent}>
            <section id="intro" className={docSection} data-doc-section>
                <h1 className={docsMainTitle}>
                    LosPerris <span className={docsAccent}>Twitch API Docs</span>
                </h1>
                <p className={docsLead}>
                    Guía para configurar comandos y herramientas en tu chat de Twitch.
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
                            <strong>Actualización:</strong> el panel refresca datos cada <strong>30 segundos</strong>.
                        </p>
                    </div>
                </div>
            </section>

            <section id="auth" className={docSection} data-doc-section>
                <h2>
                    <Key /> Tu API Key
                </h2>
                <p>
                    La mayoría de los endpoints requieren una <code>apiKey</code> para funcionar. Sustituye{' '}
                    <code>TU_API_KEY</code> por tu clave permanente del{' '}
                    <a href={appPath('/')}>panel principal</a>.
                </p>
                <div className={docsInfoCard} style={{ marginTop: '1.5rem' }}>
                    <ShieldAlert />
                    <p>
                        Al iniciar sesión pedimos permiso para <strong>leer datos públicos</strong> y{' '}
                        <strong>crear clips</strong>. No accedemos a tu clave de stream ni a datos privados.
                    </p>
                </div>
            </section>

            <section id="profile" className={docSection} data-doc-section>
                <h2>
                    <UserCog /> Perfil y Seguridad
                </h2>
                <p>Opciones de cuenta en el panel.</p>
                <div className={docsInfoCardPrimary}>
                    <Key />
                    <p>
                        <strong>API Key:</strong> ver y regenerar la clave que usan los bots en chat.
                    </p>
                </div>
                <div className={docsInfoCardPrimary}>
                    <BarChart2 />
                    <p>
                        <strong>Actividad:</strong> requests, latencia, tasa de éxito y historial reciente.
                    </p>
                </div>
                <div className={docsInfoCardPrimary}>
                    <IdCard />
                    <p>
                        <strong>Identidad:</strong> ID de Twitch, usuario y última conexión.
                    </p>
                </div>
                <div className={docsInfoCardPrimary}>
                    <Skull />
                    <p>
                        <strong>Zona de peligro:</strong> borrado de cuenta y otras acciones destructivas (con
                        confirmación).
                    </p>
                </div>
            </section>

            <section id="limits" className={docSection} data-doc-section>
                <h2>
                    <Gauge /> Rate Limiting
                </h2>
                <p>Límites para mantener el servicio estable:</p>
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
                        <p style={{ marginTop: '0.5rem', marginBottom: 0, fontSize: '0.85rem', color: '#c4c4cc' }}>
                            <em>Nota:</em> Los comandos normales (como Followage, Bola 8 o Ruleta) son muy rápidos y utilizan el límite general de 60 peticiones por minuto.
                        </p>
                    </div>
                </div>
            </section>

            <section id="quick-start" className={docSection} data-doc-section>
                <h2>
                    <Rocket /> Primeros pasos
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
                        <h3>Prueba en chat</h3>
                        <p>Escribe el comando en tu canal y comprueba la respuesta del bot.</p>
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
                            '$(urlfetch {baseURL}/api/followage?channel=$(channel)&user=$(touser)&apiKey=TU_API_KEY)',
                        streamelements:
                            '${customapi.{baseURL}/api/followage?channel=${channel}&user=${touser}&apiKey=TU_API_KEY}',
                        fossabot:
                            '$(customapi {baseURL}/api/followage?channel=$(channel)&user=$(touser)&apiKey=TU_API_KEY)'
                    }}
                />
            </section>

            <section id="create-clip" className={docSection} data-doc-section>
                <h2>
                    <Film /> Crear Clip
                </h2>
                <p>Crea un clip del canal en vivo.</p>
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
                            '🎬 Clip creado por $(user): $(urlfetch {baseURL}/api/create-clip?channel=$(channel)&apiKey=TU_API_KEY)',
                        streamelements:
                            '🎬 Clip creado por ${user}: ${customapi.{baseURL}/api/create-clip?channel=${channel}&apiKey=TU_API_KEY}',
                        fossabot:
                            '🎬 Clip creado por $(user): $(customapi {baseURL}/api/create-clip?channel=$(channel)&apiKey=TU_API_KEY)'
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
                        /api/shoutout?channel={'{canal}'}&touser={'{objetivo}'}&apiKey=TU_API_KEY&template=
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
                            '📢 $(urlfetch {baseURL}/api/shoutout?channel=$(channel)&touser=$(touser)&apiKey=TU_API_KEY)',
                        streamelements:
                            '📢 ${customapi.{baseURL}/api/shoutout?channel=${channel}&touser=${touser}&apiKey=TU_API_KEY}',
                        fossabot:
                            '📢 $(customapi {baseURL}/api/shoutout?channel=$(channel)&touser=$(touser)&apiKey=TU_API_KEY)'
                    }}
                />
            </section>

            <section id="trends" className={docSection} data-doc-section>
                <h2>
                    <TrendingUp /> Tendencias
                </h2>
                <p>
                    Analiza el chat en vivo y muestra un Top 10 de palabras o emotes más repetidos. El temporizador del
                    panel acota cuánto tiempo se analiza.
                </p>
                <p className="text-[0.875rem] text-[#c4c4cc]">
                    Puedes mostrar el Top 10 en OBS o Streamlabs con un overlay{' '}
                    <span className={docsBadgeBeta}>Beta</span>.{' '}
                    <a href="#overlays">Cómo configurarlo</a>.
                </p>
            </section>

            <section id="stalker" className={docSection} data-doc-section>
                <h2>
                    <Binoculars /> Stalker
                </h2>
                <p>
                    Consulta datos públicos de un usuario: fecha de la cuenta, followage en tu canal y mensajes recientes
                    del chat.
                </p>
            </section>

            <section id="roulette" className={docSection} data-doc-section>
                <h2>
                    <Dices /> Ruleta
                </h2>
                <p>
                    Sorteos con lista manual o con usuarios activos del chat. Abrir, girar y reiniciar se hace desde el
                    panel.
                </p>
                <p className="text-[0.875rem] text-[#c4c4cc]">
                    Puedes mostrar la ruleta en OBS o Streamlabs con un overlay{' '}
                    <span className={docsBadgeBeta}>Beta</span>.{' '}
                    <a href="#overlays">Cómo configurarlo</a>.
                </p>
            </section>

            <DocsOverlaySection />

            <section id="magic8" className={docSection} data-doc-section>
                <h2>
                    <MAGIC8_ICON /> Bola 8 Mágica (IA)
                </h2>
                <p>Responde preguntas del chat con distintos tonos (IA).</p>
                <div className={docsEndpoint}>
                    <span className={docsMethodGet}>GET</span>
                    <span className={docsUrl}>
                        /api/minigames/magic8?question={'{pregunta}'}&mood={'{tono}'}&apiKey=TU_API_KEY
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
                            '🎱 $(user) pregunta: $(query) | La Bola 8 dice: $(urlfetch {baseURL}/api/minigames/magic8?question=$(query)&mood=sarcastic&apiKey=TU_API_KEY)',
                        streamelements:
                            '🎱 ${user} pregunta: ${1:} | La Bola 8 dice: ${customapi.{baseURL}/api/minigames/magic8?question=${1:}&mood=sarcastic&apiKey=TU_API_KEY}',
                        fossabot:
                            '🎱 $(user) pregunta: $(query) | La Bola 8 dice: $(customapi {baseURL}/api/minigames/magic8?question=$(query)&mood=sarcastic&apiKey=TU_API_KEY)'
                    }}
                />
            </section>

            <section id="russian" className={docSection} data-doc-section>
                <h2>
                    <RUSSIAN_ICON /> Ruleta Rusa
                </h2>
                <p>
                    Juego de chat con revólver de 6 recámaras. Si sale la bala, el usuario recibe un{' '}
                    <strong>timeout</strong> real.
                </p>
                <div className={docsEndpoint}>
                    <span className={docsMethodGet}>GET</span>
                    <span className={docsUrl}>/api/minigames/russian?user={'{usuario}'}&apiKey=TU_API_KEY</span>
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
                            '$(urlfetch {baseURL}/api/minigames/russian?user=$(user)&apiKey=TU_API_KEY)',
                        streamelements:
                            '${customapi.{baseURL}/api/minigames/russian?user=${user}&apiKey=TU_API_KEY}',
                        fossabot:
                            '$(customapi {baseURL}/api/minigames/russian?user=$(user)&apiKey=TU_API_KEY)'
                    }}
                />
            </section>

            <section id="duel" className={docSection} data-doc-section>
                <h2>
                    <Swords /> Duelo
                </h2>
                <p>Simula un duelo entre dos usuarios del chat.</p>
                <div className={docsEndpoint}>
                    <span className={docsMethodGet}>GET</span>
                    <span className={docsUrl}>
                        /api/minigames/duel?challenger={'{retador}'}&target={'{oponente}'}&apiKey=TU_API_KEY
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
                            '$(urlfetch {baseURL}/api/minigames/duel?challenger=$(user)&target=$(touser)&apiKey=TU_API_KEY)',
                        streamelements:
                            '${customapi.{baseURL}/api/minigames/duel?challenger=${user}&target=${touser}&apiKey=TU_API_KEY}',
                        fossabot:
                            '$(customapi {baseURL}/api/minigames/duel?challenger=$(user)&target=$(touser)&apiKey=TU_API_KEY)'
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
                        /api/dashboard/get-clips?channel={'{canal}'}&apiKey=TU_API_KEY&limit=10
                    </span>
                </div>
                <h3>Ejemplo de Respuesta (JSON)</h3>
                <div className={docsCodeBlock}>
                    <code className="text-[#c4c4cc]">{CLIPS_JSON}</code>
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
        </div>
    );
}
