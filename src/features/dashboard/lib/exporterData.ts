/** Tipos e integraciones de comandos para el reporte de exportacion. */

export interface AnalyticsData {
    todayRequests?: number;
    totalRequests?: number;
    averageLatency?: string;
    successRate?: string;
    [key: string]: number | string | undefined;
}

export const COMMAND_INTEGRATIONS = [
    {
        id: 'clips',
        label: 'Buscador de Clips',
        description: 'Busca el clip mas popular o reciente del canal',
        variants: [
            { name: 'Clip Directo (URL)', params: 'channel=$(channel)', desc: 'Obtiene unicamente el link del clip' },
            { name: 'Clip con Mensaje Personalizado', params: 'channel=$(channel)&template=Mira%20este%20clip%20epico:%20{url}', desc: 'Devuelve un texto incluyendo el link del clip' }
        ]
    },
    {
        id: 'message',
        label: 'Enviar Mensaje al Chat',
        description: 'Envia un mensaje al chat de tu canal mediante la API',
        method: 'POST' as const,
        variants: [
            { name: 'Mensaje Simple', params: '', body: '{"message":"Hola chat!"}', desc: 'Envia un mensaje de texto plano (max 500 caracteres)' },
            { name: 'Mensaje con Variables de Bot', params: '', body: '{"message":"$(user) acaba de usar el comando!"}', desc: 'Incluye variables del bot en el mensaje' }
        ]
    },
    {
        id: 'followage',
        label: 'Followage (Tiempo de Seguimiento)',
        description: 'Muestra cuánto tiempo lleva alguien siguiendo',
        variants: [
            { name: 'Texto por Defecto', params: 'channel=$(channel)&user=$(touser)', desc: 'Texto estándar de la API' },
            { name: 'Plantilla Personalizada', params: 'channel=$(channel)&user=$(touser)&template={user}%20lleva%20{time}%20bancando%20a%20{channel}', desc: 'Personaliza tu propia respuesta ({time}, {user}, {channel})' }
        ]
    },
    {
        id: 'watchtime',
        label: 'Watchtime (Tiempo de Visualización)',
        description: 'Muestra cuánto tiempo lleva alguien viendo el stream',
        variants: [
            { name: 'Texto por Defecto', params: 'channel=$(channel)&user=$(touser)', desc: 'Texto estándar de la API' },
            { name: 'Plantilla Personalizada', params: 'channel=$(channel)&user=$(touser)&template={user}%20lleva%20viendo%20a%20{channel}%20por%20{time}', desc: 'Personaliza tu propia respuesta ({time}, {user}, {channel})' }
        ]
    },
    {
        id: 'so',
        label: 'Shoutout (Promoción)',
        description: 'Promociona a otro streamer en el chat',
        variants: [
            { name: 'Shoutout Estándar', params: 'channel=$(channel)&touser=$(touser)', desc: 'Muestra la última categoría y enlace del streamer' },
            { name: 'Shoutout Personalizado', params: 'channel=$(channel)&touser=$(touser)&template=Vayan%20a%20seguir%20a%20{user},%20estuvo%20jugando%20{game}!%20{url}', desc: 'Plantilla a medida ({user}, {game}, {url})' }
        ]
    },
    {
        id: 'magic8',
        label: 'Bola 8 Mágica',
        description: 'Responde preguntas con la IA de LosPerris',
        variants: [
            { name: 'Bola 8 Clásica', params: 'question=$(query)&user=$(user)&mood=classic', desc: 'Respuestas solemnes y místicas' },
            { name: 'Bola 8 Sarcástica', params: 'question=$(query)&user=$(user)&mood=sarcastic', desc: 'Respuestas cínicas y condescendientes' },
            { name: 'Bola 8 Tóxica', params: 'question=$(query)&user=$(user)&mood=toxic', desc: 'Respuestas posesivas y manipuladoras' },
            { name: 'Bola 8 Amable', params: 'question=$(query)&user=$(user)&mood=helpful', desc: 'Respuestas dulces y motivacionales' }
        ]
    },
    {
        id: 'russian',
        label: 'Ruleta Rusa',
        description: 'Un minijuego de riesgo de baneo/timeout',
        variants: [
            { name: 'Modo Normal (Chat)', params: 'channel=$(channel)&user=$(user)', desc: 'Juego de texto, ideal para que el bot responda directamente' },
            { name: 'Modo Hardcore', params: 'channel=$(channel)&user=$(user)&hardcore=true', desc: 'Aumenta las probabilidades de fallar' },
            { name: 'Silencioso (Para Action/JSON)', params: 'channel=$(channel)&user=$(user)&format=json', desc: 'Devuelve un objeto JSON para bots avanzados' }
        ]
    },
    {
        id: 'duel',
        label: 'Duelo 1v1',
        description: 'Peleas a muerte entre dos espectadores',
        variants: [
            { name: 'Duelo Estándar', params: 'challenger=$(user)&target=$(touser)', desc: 'Enfrenta al usuario actual contra quien mencione' }
        ]
    },
    {
        id: 'slots',
        label: 'Slots',
        description: 'Tragamonedas sencilla para el chat',
        variants: [
            { name: 'Girar slots', params: 'channel=$(channel)&user=$(user)', desc: 'Tres carretes: jackpot, casi o nada' }
        ]
    },
    {
        id: 'roulette',
        label: 'Ruleta de Sorteos',
        description: 'Sorteos del chat con overlay (solo Dashboard)',
        dashboard: true,
        variants: [
            { name: 'Dashboard', params: '', desc: 'Herramienta exclusiva del panel de control' }
        ]
    },
    {
        id: 'stalker',
        label: 'Stalker (Escáner de Viewers)',
        description: 'Analiza la lista de espectadores del canal (solo Dashboard)',
        dashboard: true,
        variants: [
            { name: 'Dashboard', params: '', desc: 'Herramienta exclusiva del panel de control' }
        ]
    },
    {
        id: 'trends',
        label: 'Trends (Tendencias de Chat)',
        description: 'Rastrea palabras y frases más usadas en el chat (solo Dashboard)',
        dashboard: true,
        variants: [
            { name: 'Dashboard', params: '', desc: 'Herramienta exclusiva del panel de control' }
        ]
    }
];
