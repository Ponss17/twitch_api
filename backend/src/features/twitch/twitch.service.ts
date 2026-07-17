// Barrel module: re-exporta todos los servicios de Twitch para retrocompatibilidad.
// Los consumidores pueden seguir importando desde 'twitch.service' sin cambios,
// pero la lógica real vive en módulos separados.

export { CIRCUIT_BREAKER, checkCircuit, recordFailure, recordSuccess } from './twitchClient';
export {
    getUserId,
    getUserInfo,
    getFollowAge,
    validateToken,
    getFollowersCount,
    isStreamLive,
    getFollowersCountSafe,
    isStreamLiveSafe
} from './twitchUserService';
export { createClip, getClips } from './twitchClipService';
export { getChannelInfo, sendChatMessage, getChatters, timeoutUser, filterChattersByEligibility, annotateChatterRoles, filterAndAnnotateChatters, parseEligibilityQuery } from './twitchChatService';
