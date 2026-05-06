import { Messages } from '../../../shared/messages/messages.js';

export const Magic8Messages = {
    emptyQuestion: '⚠️ Debes hacer una pregunta primero.',
    consulting: Messages.Common.spinner('Consultando...'),
    loading:
        '<div class="magic8-loading"><i class="fa-solid fa-crystal-ball fa-beat"></i> Consultando a los espíritus...</div>',
    askButton: '<i class="fa-solid fa-play"></i> Preguntar',
    error: (msg: string) => `❌ ${msg}`
};
