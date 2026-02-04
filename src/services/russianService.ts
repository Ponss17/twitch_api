import { sendChatMessage, timeoutUser, getUserId } from './apiService';
import { logger } from '../utils/logger';

export const playRussianRoulette = async (
    channel: string,
    triggerUser: string,
    token: string,
    hardcore: boolean
) => {
    try {
        const bulletPosition = Math.floor(Math.random() * 6);
        const currentChamber = Math.floor(Math.random() * 6);
        const isDead = bulletPosition === currentChamber;

        const broadcasterId = await getUserId(channel, token);

        let message = '';
        let status = 'alive';

        if (isDead) {
            status = 'dead';
            message = `💥 BANG! @${triggerUser} ha jalado el gatillo y... ha encontrado la bala. R.I.P. 💀`;

            if (hardcore) {
                try {
                    const targetUserId = await getUserId(triggerUser, token);

                    if (targetUserId !== broadcasterId) {
                        await timeoutUser(
                            broadcasterId,
                            broadcasterId,
                            targetUserId,
                            60,
                            'Perdió en la Ruleta Rusa (!bang)',
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
            message = `😰 Click... @${triggerUser} suda frío. El revólver estaba vacío.`;
        }

        await sendChatMessage(broadcasterId, broadcasterId, message, token);

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
