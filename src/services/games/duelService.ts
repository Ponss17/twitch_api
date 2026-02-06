interface Scenario {
    name: string;
    messages: string[];
}

const SCENARIOS: Scenario[] = [
    {
        name: 'Western',
        messages: [
            'El sol está en lo más alto. {w} y {l} se miran fijamente, las manos sobre sus revólveres. Una planta rodadora cruza el camino... ¡BANG! El humo se disipa y {w} guarda su arma mientras {l} cae derrotado en el polvo.',
            'Entran al Saloon. La música se detiene. {w} rompe una botella contra la barra. {l} intenta desenfundar pero es muy lento. Un solo disparo de {w} resuena en todo el pueblo. Adiós vaquero.',
            'Duelo al amanecer. {w} escupe tabaco al suelo con desprecio. {l} tiembla visiblemente. "Cuenta hasta tres", dice el sheriff. Al dos, {w} ya había disparado. Nadie hace trampas mejor que {w}.'
        ]
    },
    {
        name: 'Magic',
        messages: [
            'Los grimorios se abren. {l} intenta conjurar un escudo, pero {w} pronuncia las palabras prohibidas del Vacío. Una explosión de energía arcana consume a {l}, dejándolo convertido en un sapo inofensivo.',
            '{w} alza su bastón invocando el poder de los ancestros. El cielo se oscurece. Un rayo fulminante cae directamente sobre {l}, quien ni siquiera tuvo tiempo de terminar su hechizo de protección.',
            'Duelo de varitas. Luces rojas y verdes chocan en el aire. {l} pierde la concentración por un segundo y el "Expelliarmus" de {w} lo manda volando contra la pared. La victoria es para la casa de {w}.'
        ]
    },
    {
        name: 'Sci-Fi',
        messages: [
            'En la plataforma orbital, {w} activa su sable de luz carmesí. {l} intenta usar la Fuerza, pero {w} es demasiado rápido. Un zumbido, un destello, y {l} cae derrotado. El Lado Oscuro siempre gana.',
            '{w} carga su cañón de plasma. {l} activa sus propulsores para huir, pero el sistema de fijación de blanco de {w} es infalible. Un disparo certero desintegra la armadura de {l}. Game Over.',
            'La simulación comienza. {w} hackea el sistema de soporte vital de {l}. "Tu firewall es patético", se ríe {w} mientras {l} se desconecta forzosamente de la Matrix. Victoria digital.'
        ]
    },
    {
        name: 'Anime',
        messages: [
            '{w} aparece detrás de {l} en un parpadeo. "Omae wa mou shindeiru", susurra. {l} grita "NANI?!?" antes de explotar en mil pedazos. Una victoria técnica impecable.',
            'Durante tres episodios, {w} ha estado cargando su ataque. {l} se quedó mirando. Finalmente, {w} lanza un rayo de energía que se ve desde el espacio, desintegrando a {l} por completo.',
            '{w} saca una libreta negra y una pluma. Escribe el nombre de {l} mientras come una manzana. Cuarenta segundos después, {l} se lleva la mano al pecho y cae al suelo. Justicia divina.'
        ]
    },
    {
        name: 'Street',
        messages: [
            '{l} intenta intimidar, pero {w} saca una chancla legendaria de nivel 100. El sonido del impacto resuena por todo el barrio. {l} ha sido enviado a dormir con una marca roja en la cara.',
            '{w} saca un pez espada congelado de la nada y golpea a {l} con una precisión quirúrgica. Es la humillación definitiva. {l} huye llorando mientras {w} posa triunfalmente.',
            'Pelea a puño limpio. {l} lanza un golpe, {w} lo esquiva como en Matrix y contraataca con un derechazo que reinicia el sistema operativo de {l}. Windows XP apagándose.'
        ]
    },
    {
        name: 'Gaming',
        messages: [
            '{w} hace un 360 no-scope desde la otra punta del mapa. La killcam muestra la humillación total de {l}. "Desinstala el juego", escribe {w} en el chat global.',
            'Final de la carrera. {w} lanza un caparazón azul justo cuando {l} iba a cruzar la meta. La explosión lanza a {l} fuera de la pista. La amistad se ha roto para siempre.',
            '{w} encierra a {l} en una caja de obsidiana y vierte un cubo de lava. No hay escapatoria. El inventario de {l} queda flotando en el fuego mientras {w} hace teabagging.'
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
    const cleanWinner = winner.replace(/^@/, '');
    const cleanLoser = loser.replace(/^@/, '');

    const finalMessage = rawMessage
        .replace(/{w}/g, `@${cleanWinner}`)
        .replace(/{l}/g, `@${cleanLoser}`);

    return {
        winner: cleanWinner,
        loser: cleanLoser,
        message: `⚔️ ${finalMessage}`
    };
};
