export const BIO_EMPTY = 'Sin biografía disponible.';

export const ProfileMessages = {
    partner: 'Socio',
    affiliate: 'Afiliado',
    user: 'Usuario',
    created: (date: string | Date) => `Cuenta creada el: ${new Date(date).toLocaleDateString()}`,
    new: 'Nueva',
    years: (y: number) => `${y} año${y > 1 ? 's' : ''}`,
    months: (m: number) => `${m} meses`,
    viewLogs: '<i class="fa-solid fa-comment-dots"></i> Ver Últimos Mensajes',
    historyTitle: '<i class="fa-solid fa-history"></i> Historial (Sesión actual)',
    noHistory: 'No hay mensajes registrados en esta sesión.',
    bioEmpty: BIO_EMPTY,
    labels: {
        rank: 'Rango',
        userId: 'ID de Usuario',
        age: 'Antigüedad'
    }
};
