interface Scenario {
    name: string;
    messages: string[];
}

const SCENARIOS: Scenario[] = [
    {
        name: 'Western',
        messages: [
            '🤠 {w} desenfunda más rápido que su sombra y... ¡BANG! {l} cae al polvo.',
            '🌵 Duelo al sol... Suenan las campanas. {w} dispara primero. {l} ha mordido el polvo.',
            '🐴 {w} le da un escopetazo a {l} y se va cabalgando hacia el atardecer.'
        ]
    },
    {
        name: 'Magic',
        messages: [
            '🧙‍♂️ {w} lanza "Avada Kedavra" y {l} se convierte en una rana. 🐸',
            '⚡ {w} invoca un rayo celestial que deja a {l} frito y crujiente.',
            '🔥 {w} castea Bola de Fuego. {l} ahora es un montoncito de cenizas.'
        ]
    },
    {
        name: 'Sci-Fi',
        messages: [
            '🤖 {w} activa su sable de luz y corta a {l} en rodajas perfectas.',
            '🚀 {w} dispara su phaser en modo desintegración. Adiós {l}, eras un buen tripulante.',
            '👽 {w} invoca un ataque orbital. {l} ha sido borrado de la existencia.'
        ]
    },
    {
        name: 'Anime',
        messages: [
            '🗡️ {w} se teletransporta detrás de {l}: "Omae wa mou shindeiru". {l}: "NANI?!?" 💥',
            '👊 {w} carga ki durante 3 episodios y lanza un Kamehameha que manda a {l} a otra dimensión.',
            '📓 {w} escribe el nombre de {l} en su libreta negra. 40 segundos después, {l} colapsa.'
        ]
    },
    {
        name: 'Slap',
        messages: [
            '👋 {w} le da una bofetada a {l} tan fuerte que le reinicia el Windows.',
            '🐟 {w} golpea a {l} con una trucha gigante. K.O. técnico por humillación.',
            '🩴 {w} usa "La Chancla" (Daño Infinito). {l} no tenía oportunidad.'
        ]
    },
    {
        name: 'Gaming',
        messages: [
            '🎮 {w} hace un 360 no-scope y le da headshot a {l}. GG EZ.',
            '🍄 {w} le tira un caparazón azul a {l} justo antes de la meta. Victoria cruel.',
            '⛏️ {w} encierra a {l} en bedrock y le tira lava. F en el chat.'
        ]
    }
];

export const playDuel = async (challenger: string, target: string) => {
    const isChallengerWinner = Math.random() < 0.5;

    const winner = isChallengerWinner ? challenger : target;
    const loser = isChallengerWinner ? target : challenger;
    const randomScenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    const rawMessage =
        randomScenario.messages[Math.floor(Math.random() * randomScenario.messages.length)];
    const finalMessage = rawMessage.replace(/{w}/g, `@${winner}`).replace(/{l}/g, `@${loser}`);

    return {
        winner,
        loser,
        message: `⚔️ [${randomScenario.name}] ${finalMessage}`
    };
};
