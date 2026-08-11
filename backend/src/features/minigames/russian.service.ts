import { sendChatMessage, timeoutUser, getUserId } from '../twitch/twitch.service';
import { logger } from '../../core/utils/logger';
import { kv } from '../../core/database/redisClient';

const ROULETTE_TTL_SECONDS = 86400;
const PLAY_ROULETTE_SCRIPT = `
local key = KEYS[1]
local bullet = tonumber(redis.call('HGET', key, 'bullet'))
local chamber = tonumber(redis.call('HGET', key, 'chamber')) or 0

if not bullet then
  bullet = tonumber(ARGV[1])
end

chamber = chamber + 1
local dead = chamber >= bullet

if dead then
  redis.call('DEL', key)
else
  redis.call('HSET', key, 'bullet', bullet, 'chamber', chamber)
  redis.call('EXPIRE', key, ARGV[2])
end

return { bullet, chamber, dead and 1 or 0 }
`;

async function pullTrigger(channel: string): Promise<{ chamber: number; bullet: number; isDead: boolean }> {
    const key = `twitch_api:russian:${channel.toLowerCase()}`;
    const newBullet = Math.floor(Math.random() * 6) + 1;
    const result = await kv.eval<string[], [number, number, number]>(
        PLAY_ROULETTE_SCRIPT,
        [key],
        [String(newBullet), String(ROULETTE_TTL_SECONDS)]
    );
    const [bullet, chamber, dead] = result.map(Number);
    return { bullet, chamber, isDead: dead === 1 };
}

export const playRussianRoulette = async (
    channel: string,
    triggerUser: string,
    token: string,
    hardcore: boolean,
    sendToChat: boolean = true,
    lang: string = 'es'
) => {
    try {
        // Inicialización, avance, disparo y reset ocurren en una sola operación Redis.
        const { isDead } = await pullTrigger(channel);

        const broadcasterId = await getUserId(channel, token);

        const l = (lang || 'es').toLowerCase().trim();
        const isEn = l.startsWith('en');
        const isPt = l.startsWith('pt');

        const deathMessages = isEn
            ? [
                  `@${triggerUser} holds the revolver with a shaking hand... 🔫 points it... takes a deep breath... 💥 BANG! The bullet was there. R.I.P. 💀`,
                  `@${triggerUser} spins the cylinder, listens to it spin... click click click... pulls the trigger and... 💥 BOOOOM! Bad luck. 💀`,
                  `Silence takes over the chat as @${triggerUser} holds the gun... one second... two... 💥 BANG! Russian roulette shows no mercy. 💀`,
                  `@${triggerUser} closes their eyes, counts to three... 1... 2... 3... 💥 BANG! Fate has spoken. R.I.P. 💀`,
                  `@${triggerUser} nervously smiles, "Nothing will happen" they say... 💥 BOOM! Famous last words. ⚰️`,
                  `The cold steel gleams. @${triggerUser} hesitates, but chat pressure is too high... 💥 Farewell cowboy. 🤠👻`,
                  `@${triggerUser} tries to act brave... *click* (spirit leaves the body) 💥 Straight back to the lobby! 🎮💀`
              ]
            : isPt
            ? [
                  `@${triggerUser} segura o revólver com a mão trêmula... 🔫 aponta para a cabeça... respira fundo... 💥 BANG! A bala estava lá. R.I.P. 💀`,
                  `@${triggerUser} gira o tambor, ouve o clique... click click click... puxa o gatilho e... 💥 BOOOOM! Sem sorte. 💀`,
                  `O silêncio toma conta do chat enquanto @${triggerUser} segura a arma... 💥 BANG! A roleta russa não perdoa. 💀`,
                  `@${triggerUser} fecha os olhos, conta até três... 1... 2... 3... 💥 BANG! O destino falou. R.I.P. 💀`,
                  `@${triggerUser} sorri com nervosismo, "Não vai acontecer nada"... 💥 PUM! Últimas palavras. ⚰️`,
                  `O revólver brilha friamente. @${triggerUser} hesita, mas a pressão do chat é enorme... 💥 Adeus vaqueiro. 🤠👻`,
                  `@${triggerUser} tenta bancar o corajoso... *click* 💥 Direto pro lobby! 🎮💀`
              ]
            : [
                  `@${triggerUser} toma el revólver con mano temblorosa... 🔫 lo apunta a su sien... respira hondo... 💥 BANG! La bala estaba ahí. R.I.P. 💀`,
                  `@${triggerUser} gira el tambor, lo escucha girar... click click click... aprieta el gatillo y... 💥 BOOOOM! No tuvo suerte. 💀`,
                  `El silencio se apodera del chat mientras @${triggerUser} sostiene el arma... un segundo... dos... 💥 BANG! La ruleta rusa no perdona. 💀`,
                  `@${triggerUser} cierra los ojos, cuenta hasta tres... 1... 2... 3... 💥 BANG! El destino ha hablado. R.I.P. 💀`,
                  `@${triggerUser} sonríe nerviosamente, "No va a pasar nada" dice... 💥 ¡PUM! Esas fueron sus últimas palabras. ⚰️`,
                  `El revólver brilla fríamente. @${triggerUser} duda, pero la presión del chat es demasiada... 💥 Adiós vaquero. 🤠👻`,
                  `@${triggerUser} intenta hacerse el valiente... *click* (espíritu sale del cuerpo) 💥 ¡Directo al lobby! 🎮💀`
              ];

        const surviveMessages = isEn
            ? [
                  `@${triggerUser} pulls the trigger with eyes closed... *click* 😰 Empty! Cold sweat but breathing a sigh of relief. Lived to tell the tale. 🍀`,
                  `The cylinder spins... @${triggerUser} pulls the trigger... *click* 😅 Nothing! Luck is on your side today. 🎰`,
                  `@${triggerUser} trembles while aiming... *click* 😌 Empty chamber. The gods of roulette spared your life. ✨`,
                  `Maximum tension... @${triggerUser} fires... *click* 😮‍💨 Survived! But heart almost leaped out of chest. 💚`,
                  `@${triggerUser} laughs in the face of danger... *click*. "I am immortal!", they shout. For now... 👀`,
                  `*click* ... @${triggerUser} opens one eye... then the other. Still alive! Chat celebrates. 🎉`,
                  `Fate decided it's not your time @${triggerUser}. *click*. Go buy a lottery ticket. 🎫`
              ]
            : isPt
            ? [
                  `@${triggerUser} puxa o gatilho de olhos fechados... *click* 😰 Vazio! Suor frio mas aliviado. Viveu para contar a história. 🍀`,
                  `O tambor gira... @${triggerUser} aperta o gatilho... *click* 😅 Nada! A sorte está do seu lado hoje. 🎰`,
                  `@${triggerUser} treme enquanto mira... *click* 😌 Câmara vazia. Os deuses da roleta perdoaram sua vida. ✨`,
                  `Tensão máxima... @${triggerUser} dispara... *click* 😮‍💨 Sobreviveu! Quase teve um ataque do coração. 💚`,
                  `@${triggerUser} ri do perigo... *click*. "Eu sou imortal!", grita. Por enquanto... 👀`,
                  `*click* ... @${triggerUser} abre um olho... depois o outro. Continua vivo! Chat comemora. 🎉`
              ]
            : [
                  `@${triggerUser} aprieta el gatillo con los ojos cerrados... *click* 😰 ¡Vacío! Suda frío pero respira aliviado. Vivió para contarlo. 🍀`,
                  `El tambor gira... @${triggerUser} jala el gatillo... *click* 😅 ¡Nada! La suerte está de su lado hoy. 🎰`,
                  `@${triggerUser} tiembla mientras apunta... *click* 😌 Cámara vacía. Los dioses de la ruleta le perdonaron la vida. ✨`,
                  `Tensión máxima... @${triggerUser} dispara... *click* 😮‍💨 ¡Sobrevivió! Pero el corazón casi se le sale del pecho. 💚`,
                  `@${triggerUser} ríe ante el peligro... *click*. "¡Soy inmortal!", grita. Por ahora... 👀`,
                  `*click* ... @${triggerUser} abre un ojo... luego el otro. ¡Sigue vivo! El chat celebra (o se decepciona). 🎉`,
                  `El destino ha decidido que no es tu hora @${triggerUser}. *click*. Ve y compra lotería. 🎫`
              ];

        let message = '';
        let status = 'alive';
        let hardcoreApplied = false;

        if (isDead) {
            status = 'dead';
            message = deathMessages[Math.floor(Math.random() * deathMessages.length)];

            if (hardcore) {
                try {
                    const targetUserId = await getUserId(triggerUser, token);

                    if (targetUserId !== broadcasterId) {
                        await timeoutUser(
                            broadcasterId,
                            broadcasterId,
                            targetUserId,
                            60,
                            isEn
                                ? 'Lost in Russian Roulette (!roulette)'
                                : isPt
                                ? 'Perdeu na Roleta Russa (!roleta)'
                                : 'Perdió en la Ruleta Rusa (!ruleta)',
                            token
                        );
                        hardcoreApplied = true;
                        message += isEn
                            ? ' (Hardcore Mode: 60s timeout 🕒)'
                            : isPt
                            ? ' (Modo Hardcore: 60s silenciado 🕒)'
                            : ' (Modo Hardcore: 60s fuera 🕒)';
                    } else {
                        message += isEn
                            ? ' (Hardcore Mode: Streamer is immortal 🛡️)'
                            : isPt
                            ? ' (Modo Hardcore: O Streamer é imortal 🛡️)'
                            : ' (Modo Hardcore: El Streamer es inmortal 🛡️)';
                    }
                } catch (e) {
                    logger.error('Error applying timeout:', e);
                    message += isEn
                        ? ' (Error applying timeout)'
                        : isPt
                        ? ' (Erro ao aplicar timeout)'
                        : ' (Error al aplicar timeout)';
                }
            }
        } else {
            message = surviveMessages[Math.floor(Math.random() * surviveMessages.length)];
        }

        if (sendToChat) {
            await sendChatMessage(broadcasterId, broadcasterId, message, token);
        }

        return {
            status,
            message,
            hardcore_applied: hardcoreApplied
        };
    } catch (error) {
        logger.error('Error in Russian Roulette service:', error);
        throw error;
    }
};
