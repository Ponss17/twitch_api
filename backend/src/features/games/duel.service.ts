import { waitUntil } from '@vercel/functions';
import { logger } from '../../core/utils/logger';

interface Scenario {
    name: string;
    /** Secuencias de 3 beats: reto → pelea → resultado */
    sequences: [string, string, string][];
}

const SCENARIOS_ES: Scenario[] = [
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

const SCENARIOS_EN: Scenario[] = [
    {
        name: 'Western',
        sequences: [
            [
                '{c} has challenged {t} to a death duel in the Wild West...',
                'The sun is at high noon. Both stare intensely, hands on their holsters. Tumbleweed rolls by...',
                'BANG! Smoke clears and {w} holsters their weapon while {l} falls defeated in the dust.'
            ],
            [
                '{c} challenges {t} in front of the Saloon. The piano stops...',
                '{c} and {t} wait. The sheriff counts: one... two...',
                'At three, {w} had already fired. {l} stood no chance. Farewell cowboy.'
            ]
        ]
    },
    {
        name: 'Magic',
        sequences: [
            [
                '{c} challenges {t} to a duel of sorcerers...',
                'Spellbooks open. Arcane sparks fill the air. Both raise their staves...',
                '{w} utters the forbidden words of the Void. {l} is turned into a harmless toad.'
            ],
            [
                '{c} raises their wand against {t}. Magic duel!',
                'Red and green sparks clash in the air. The fight is even... for a second.',
                '{w}\'s spell sends {l} flying into the wall. Victory for {w}!'
            ]
        ]
    },
    {
        name: 'Sci-Fi',
        sequences: [
            [
                '{c} has challenged {t} to a duel on the orbital platform...',
                'Lightsabers ignite. Both circle, sizing each other up...',
                'A hum, a flash, and {w} defeats {l}. The Dark Side always prevails.'
            ],
            [
                '{c} locks onto {t}. Plasma cannons primed...',
                'Thrusters roar. Target lock blinks red...',
                'Direct hit from {w}. {l}\'s armor disintegrates. Game Over.'
            ]
        ]
    },
    {
        name: 'Anime',
        sequences: [
            [
                '{c} has challenged {t} to a deathmatch...',
                'Tension rises. Their auras intensify. The ground shakes...',
                '{w} appears behind {l}. "Omae wa mou shindeiru". {l} screams "NANI?!?" and collapses.'
            ],
            [
                '{c} challenges {t}. Power is charging...',
                'For what feels like three episodes, energy builds up. Chat holds their breath...',
                '{w} unleashes a beam visible from space. {l} is obliterated. Epic victory!'
            ]
        ]
    },
    {
        name: 'Gaming',
        sequences: [
            [
                '{c} challenged {t} to a 1v1 in the lobby...',
                'The match loads. Both look for an angle. Sniper glints in the distance...',
                '{w} hits a 360 no-scope. Humiliating killcam for {l}. "Uninstall", writes {w}.'
            ],
            [
                '{c} throws the gauntlet at {t} on the final lap...',
                'Near the finish line. Shells are flying. Friendship is at stake...',
                '{w} lands the blue shell just in time. {l} spins off track. Victory!'
            ]
        ]
    }
];

const SCENARIOS_PT: Scenario[] = [
    {
        name: 'Western',
        sequences: [
            [
                '{c} desafiou {t} para um duelo mortal no Velho Oeste...',
                'O sol está a pino. Os dois se encaram com a mão no coldre...',
                'BANG! A fumaça baixa e {w} guarda a arma enquanto {l} cai na poeira.'
            ],
            [
                '{c} desafia {t} em frente ao Saloon. A música para...',
                '{c} e {t} esperam. O xerife conta: um... dois...',
                'No três, {w} já atirou. {l} não teve chance. Adeus vaqueiro.'
            ]
        ]
    },
    {
        name: 'Magic',
        sequences: [
            [
                '{c} desafia {t} para um duelo de feiticeiros...',
                'Grimórios se abrem. Faíscas arcanas no ar. Ambos levantam seus cajados...',
                '{w} profere o feitiço proibido. {l} é transformado num sapinho inofensivo.'
            ]
        ]
    },
    {
        name: 'Sci-Fi',
        sequences: [
            [
                '{c} desafiou {t} para um duelo na plataforma orbital...',
                'Sabres de luz se acendem. Os dois se encaram...',
                'Um zumbido, um clarão, e {w} derrota {l}.'
            ]
        ]
    },
    {
        name: 'Anime',
        sequences: [
            [
                '{c} desafiou {t} para um combate mortal...',
                'A tensão sobe. A aura dos dois se intensifica...',
                '{w} aparece atrás de {l}. "Omae wa mou shindeiru". {l} grita "NANI?!?" e cai derrotado.'
            ]
        ]
    },
    {
        name: 'Gaming',
        sequences: [
            [
                '{c} desafiou {t} para um 1v1 no lobby...',
                'A partida carrega. Ambos buscam posição...',
                '{w} acerta um 360 no-scope. Killcam humilhante para {l}. "Desinstala", digita {w}.'
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

export const playDuel = (challenger: string, target: string, lang: string = 'es'): DuelResult => {
    const isChallengerWinner = Math.random() < 0.5;

    const cleanChallenger = challenger.replace(/^@/, '');
    const cleanTarget = target.replace(/^@/, '');
    const winner = isChallengerWinner ? cleanChallenger : cleanTarget;
    const loser = isChallengerWinner ? cleanTarget : cleanChallenger;

    const l = (lang || 'es').toLowerCase().trim();
    const scenarios = l.startsWith('en')
        ? SCENARIOS_EN
        : l.startsWith('pt')
        ? SCENARIOS_PT
        : SCENARIOS_ES;

    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
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
                logger.info(`Duelo Nightbot: mensaje #${i + 2} enviado`);
            } catch (err) {
                logger.error(`Error enviando mensaje Nightbot de duelo #${i + 2}:`, err);
            }
        }
    };

    return run();
};

/**
 * Mantiene viva la función en Vercel tras responder.
 * waitUntil debe registrarse de forma síncrona ANTES de res.send.
 */
export const keepAliveAfterResponse = (work: Promise<unknown>): void => {
    try {
        waitUntil(work);
    } catch {
        void work;
    }
};

export const getNightbotResponseUrl = (headers: Record<string, unknown>): string | null => {
    const raw = headers['nightbot-response-url'] ?? headers['Nightbot-Response-Url'];
    if (typeof raw === 'string' && raw.startsWith('http')) return raw;
    if (Array.isArray(raw) && typeof raw[0] === 'string' && raw[0].startsWith('http')) {
        return raw[0];
    }
    return null;
};
