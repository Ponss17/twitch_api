import { logger } from '../../core/utils/logger';

interface Scenario {
    name: string;
    /** Secuencias de 3 beats: reto → pelea → resultado */
    sequences: [string, string, string][];
}

const SCENARIOS: Scenario[] = [
    {
        name: 'Western',
        sequences: [
            [
                '{c} ha retado a {t} a un duelo a muerte en el Viejo Oeste...',
                'El sol está en lo más alto. Ambos se miran fijamente, las manos sobre sus revólveres. Una planta rodadora cruza el camino...',
                '¡BANG! El humo se disipa y {w} guarda su arma mientras {l} cae derrotado en el polvo.'
            ],
            [
                '{c} reta a {t} frente al Saloon. La música se detiene...',
                '{c} y {t} esperan. El sheriff cuenta: uno... dos...',
                'Al tres, {w} ya había disparado. {l} no tuvo oportunidad. Adiós vaquero.'
            ]
        ]
    },
    {
        name: 'Magic',
        sequences: [
            [
                '{c} desafía a {t} a un duelo de hechiceros...',
                'Los grimorios se abren. Chispas arcanas llenan el aire. Ambos levantan sus bastones...',
                '{w} pronuncia las palabras prohibidas del Vacío. {l} queda convertido en un sapo inofensivo.'
            ],
            [
                '{c} alza su varita contra {t}. ¡Duelo mágico!',
                'Luces rojas y verdes chocan en el aire. La pelea es pareja... por un segundo.',
                'El hechizo de {w} manda a {l} volando contra la pared. Victoria para {w}.'
            ]
        ]
    },
    {
        name: 'Sci-Fi',
        sequences: [
            [
                '{c} ha retado a {t} a un duelo en la plataforma orbital...',
                'Sables de luz se encienden. Ambos dan vueltas midiendo al oponente...',
                'Un zumbido, un destello, y {w} derrota a {l}. El Lado Oscuro siempre gana.'
            ],
            [
                '{c} fija el blanco en {t}. Cañones de plasma listos...',
                'Los propulsores rugen. El sistema de fijación de blanco parpadea en rojo...',
                'Disparo certero de {w}. La armadura de {l} se desintegra. Game Over.'
            ]
        ]
    },
    {
        name: 'Anime',
        sequences: [
            [
                '{c} ha retado a {t} a un duelo a muerte...',
                'La tensión sube. El aura de ambos se intensifica. El suelo tiembla...',
                '{w} aparece detrás de {l}. "Omae wa mou shindeiru". {l} grita "NANI?!?" y cae derrotado.'
            ],
            [
                '{c} desafía a {t}. El poder se está cargando...',
                'Durante lo que parecen tres episodios, la energía acumula. El chat contiene la respiración...',
                '{w} lanza un rayo que se ve desde el espacio. {l} queda desintegrado. Victoria épica.'
            ]
        ]
    },
    {
        name: 'Street',
        sequences: [
            [
                '{c} ha retado a {t} a un duelo callejero...',
                'Se miran de frente. Nadie parpadea. El barrio entero se reúne a ver...',
                '{w} saca la chancla legendaria de nivel 100. {l} queda KO con una marca roja en la cara.'
            ],
            [
                '{c} vs {t}. Pelea a puño limpio en la esquina...',
                '{t} lanza un golpe. El aire silba. ¿Conectará?',
                '{w} esquiva como en Matrix y contraataca. {l} queda reiniciado. Victoria.'
            ]
        ]
    },
    {
        name: 'Gaming',
        sequences: [
            [
                '{c} ha retado a {t} a un 1v1 en el lobby...',
                'La partida carga. Ambos buscan ángulo. El sniper brilla a lo lejos...',
                '{w} hace un 360 no-scope. Killcam humillante para {l}. "Desinstala", escribe {w}.'
            ],
            [
                '{c} lanza el guante a {t} en la carrera final...',
                'Casi en la meta. Caparazones vuelan. La amistad está en peligro...',
                '{w} conecta el azul justo a tiempo. {l} sale volando de la pista. Victoria.'
            ]
        ]
    },
    {
        name: 'Epicas',
        sequences: [
            [
                '{c} ha retado a {t} a un duelo legendario...',
                'Chocan en el aire. Una onda expansiva rompe las ventanas del chat...',
                'Tras golpes a la velocidad de la luz, {w} manda a {l} a la estratosfera.'
            ],
            [
                '{c} desafía a {t}. El suelo tiembla...',
                'Un dragón ancestral aparece sobre el campo de batalla. Las llamas crecen...',
                '{w} controla al dragón. Solo quedan cenizas donde estaba {l}.'
            ]
        ]
    },
    {
        name: 'Mitologia',
        sequences: [
            [
                '{c} ha retado a {t} ante los dioses...',
                'Truenos en el cielo. El Mjolnir brilla. Ambos se preparan para el juicio divino...',
                '{w} invoca el rayo. {l} sale volando hacia el Valhalla (o al hospital).'
            ],
            [
                '{c} mira fijamente a {t}. Algo no cuadra...',
                'La tensión mitológica crece. ¿Quién tiene el artefacto prohibido?',
                '{w} saca la cabeza de Medusa. {l} se convierte en piedra. Victoria petrificante.'
            ]
        ]
    },
    {
        name: 'Cine',
        sequences: [
            [
                '{c} ha retado a {t} a un duelo de película...',
                'Cámara lenta. Música épica. Ambos caminan uno hacia el otro...',
                '{w} dice "Hasta la vista, baby" y gana. {l} explota en cámara lenta.'
            ],
            [
                '{c} vs {t}. Es la batalla final...',
                '"It\'s over!" grita uno desde el terreno alto. El salto decide el destino...',
                '{w} conecta el golpe decisivo. {l} queda fuera. Créditos finales.'
            ]
        ]
    }
];

const at = (name: string) => `@${name.replace(/^@/, '')}`;

const fillPlaceholders = (
    text: string,
    vars: { c: string; t: string; w: string; l: string }
): string =>
    text
        .replace(/\{c\}/g, at(vars.c))
        .replace(/\{t\}/g, at(vars.t))
        .replace(/\{w\}/g, at(vars.w))
        .replace(/\{l\}/g, at(vars.l));

/** Nightbot chat message hard limit */
const NIGHTBOT_MSG_MAX = 400;

export const truncateForNightbot = (text: string): string =>
    text.length <= NIGHTBOT_MSG_MAX ? text : `${text.slice(0, NIGHTBOT_MSG_MAX - 1)}…`;

export type DuelResult = {
    winner: string;
    loser: string;
    messages: string[];
    /** Relato unido (fallback SE/Fossabot / preview) */
    message: string;
};

export const playDuel = (challenger: string, target: string): DuelResult => {
    const isChallengerWinner = Math.random() < 0.5;

    const cleanChallenger = challenger.replace(/^@/, '');
    const cleanTarget = target.replace(/^@/, '');
    const winner = isChallengerWinner ? cleanChallenger : cleanTarget;
    const loser = isChallengerWinner ? cleanTarget : cleanChallenger;

    const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    const sequence = scenario.sequences[Math.floor(Math.random() * scenario.sequences.length)];

    const vars = { c: cleanChallenger, t: cleanTarget, w: winner, l: loser };
    const messages = sequence.map((line) => truncateForNightbot(fillPlaceholders(line, vars)));

    return {
        winner,
        loser,
        messages,
        message: truncateForNightbot(`⚔️ ${messages.join(' ')}`)
    };
};

const MIN_INTERVAL_SEC = 5;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * POST a Nightbot-Response-Url (mismo mecanismo que rokbot/smm.php).
 * Nightbot publica el mensaje como el bot.
 */
export const postNightbotMessage = async (responseUrl: string, message: string): Promise<void> => {
    const body = new URLSearchParams({ message: truncateForNightbot(message) });
    const res = await fetch(responseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Nightbot send ${res.status}: ${text.slice(0, 200)}`);
    }
};

/**
 * Tras devolver el 1er mensaje en el body del urlfetch, agenda el resto vía Response-Url.
 * No bloquea la respuesta HTTP (usa delays en background).
 */
export const scheduleNightbotFollowUps = (
    responseUrl: string,
    followUps: string[],
    intervalSec: number = MIN_INTERVAL_SEC
): Promise<void> => {
    const intervalMs = Math.max(MIN_INTERVAL_SEC, intervalSec) * 1000;

    const run = async () => {
        for (let i = 0; i < followUps.length; i++) {
            await sleep(intervalMs);
            try {
                await postNightbotMessage(responseUrl, followUps[i]);
            } catch (err) {
                logger.error(`Error enviando mensaje Nightbot de duelo #${i + 2}:`, err);
            }
        }
    };

    return run();
};

/** Mantiene viva la función en Vercel tras responder; en local el proceso sigue vivo. */
export const keepAliveAfterResponse = (work: Promise<unknown>): void => {
    void import('@vercel/functions')
        .then(({ waitUntil }) => {
            waitUntil(work);
        })
        .catch(() => {
            void work;
        });
};

export const getNightbotResponseUrl = (headers: Record<string, unknown>): string | null => {
    const raw = headers['nightbot-response-url'] ?? headers['Nightbot-Response-Url'];
    if (typeof raw === 'string' && raw.startsWith('http')) return raw;
    if (Array.isArray(raw) && typeof raw[0] === 'string' && raw[0].startsWith('http')) {
        return raw[0];
    }
    return null;
};
