export const RouletteMessages = {
    updated: '<i class="fa-solid fa-check"></i> Lista actualizada',
    updatedRaw: 'Lista actualizada',
    noParticipants: 'No hay participantes',
    emptyWheel: 'Sin participantes',
    winner: (name: string, count: number) =>
        `👑 Ganador: <strong>"${name}"</strong> <span style="font-size:0.9em; opacity:0.8">(${count})</span>`,
    open: '<i class="fa-solid fa-door-open"></i> Inscripciones Abiertas',
    openRaw: 'Inscripciones Abiertas',
    closed: '<i class="fa-solid fa-door-closed"></i> Inscripciones Cerradas',
    closedRaw: 'Inscripciones Cerradas',
    playToOpen: 'Dale al Play ▶️ para abrir'
};
