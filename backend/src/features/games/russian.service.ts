import { sendChatMessage, timeoutUser, getUserId } from '../twitch/twitch.service';
import { logger } from '../../core/utils/logger';
import { kv } from '@vercel/kv';

export const playRussianRoulette = async (
    channel: string,
    triggerUser: string,
    token: string,
    hardcore: boolean,
    sendToChat: boolean = true
) => {
    try {
        const bulletKey = `twitch_api:russian_bullet:${channel.toLowerCase()}`;
        const chamberKey = `twitch_api:russian_chamber:${channel.toLowerCase()}`;

        // Obtener la posición de la bala o generar una nueva (1 a 6)
        let bulletPosition = await kv.get<number>(bulletKey);
        if (!bulletPosition) {
            bulletPosition = Math.floor(Math.random() * 6) + 1;
            await kv.set(bulletKey, bulletPosition, { ex: 86400 }); // Expira en 24h
        }

        // Avanzar el tambor atómicamente
        const currentChamber = await kv.incr(chamberKey);
        await kv.expire(chamberKey, 86400);

        const isDead = currentChamber >= bulletPosition;

        // Si se dispara el arma, resetear el tambor para el siguiente juego
        if (isDead) {
            await kv.del(bulletKey);
            await kv.del(chamberKey);
        }

        const broadcasterId = await getUserId(channel, token);

        const deathMessages = [
            `@${triggerUser} toma el revólver con mano temblorosa... 🔫 lo apunta a su sien... respira hondo... 💥 BANG! La bala estaba ahí. R.I.P. 💀`,
            `@${triggerUser} gira el tambor, lo escucha girar... click click click... aprieta el gatillo y... 💥 BOOOOM! No tuvo suerte. 💀`,
            `El silencio se apodera del chat mientras @${triggerUser} sostiene el arma... un segundo... dos... 💥 BANG! La ruleta rusa no perdona. 💀`,
            `@${triggerUser} cierra los ojos, cuenta hasta tres... 1... 2... 3... 💥 BANG! El destino ha hablado. R.I.P. 💀`,
            `@${triggerUser} sonríe nerviosamente, "No va a pasar nada" dice... 💥 ¡PUM! Esas fueron sus últimas palabras. ⚰️`,
            `El revólver brilla fríamente. @${triggerUser} duda, pero la presión del chat es demasiada... 💥 Adiós vaquero. 🤠👻`,
            `@${triggerUser} intenta hacerse el valiente... *click* (espíritu sale del cuerpo) 💥 ¡Directo al lobby! 🎮💀`
        ];

        const surviveMessages = [
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
                            'Perdió en la Ruleta Rusa (!ruleta)',
                            token
                        );
                        message += ' (Modo Hardcore: 60s fuera 🕒)';
                    } else {
                        message += ' (Modo Hardcore: El Streamer es inmortal 🛡️)';
                    }
                } catch (e) {
                    logger.error('Error applying timeout:', e);
                    message += ' (Error al aplicar timeout)';
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
            hardcore_applied: hardcore && isDead
        };
    } catch (error) {
        logger.error('Error in Russian Roulette service:', error);
        throw error;
    }
};
