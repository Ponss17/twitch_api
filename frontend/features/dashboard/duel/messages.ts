import { Messages } from '../../../shared/messages/messages.js';

export const DuelMessages = {
    emptyTarget: '⚠️ Debes especificar un oponente.',
    fighting: Messages.Common.spinner('Peleando...'),
    loading:
        '<div class="duel-loading"><i class="fa-solid fa-khanda fa-shake"></i> Calculando ganador...</div>',
    fightButton: '<i class="fa-solid fa-gavel"></i> ¡DUELO!',
    error: (msg: string) => `❌ ${msg}`
};
