import { Messages } from '../../../shared/messages/messages.js';

export const ClipsMessages = {
    loading: `<div class="loading">${Messages.Common.spinner('Cargando clips...')}</div>`,
    empty: Messages.Common.emptyState('fa-solid fa-film', 'No hay clips recientes'),
    loadError: '⚠️ Error al cargar clips'
};
