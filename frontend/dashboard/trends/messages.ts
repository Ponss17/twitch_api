export const TrendsMessages = {
    title: (channel: string) => `Tendencias de ${channel}`,
    noTmi: 'TMI.js no cargado'
};

export const TrackerMessages = {
    connected:
        '<span style="color:var(--success)"><i class="fa-solid fa-circle"></i> Conectado</span>',
    error: '<span style="color:var(--warning)"><i class="fa-solid fa-xmark"></i> Error</span>',
    waiting:
        '<tr><td colspan="4" style="text-align:center; padding:20px; color:#666;">Esperando palabras...</td></tr>',
    timeUp: '¡TIEMPO!',
    started: (min: number) =>
        `<i class="fa-solid fa-hourglass-start fa-spin"></i>  Tracker iniciado (${min} min)`,
    startedRaw: (min: number) => `Tracker iniciado (${min} min)`,
    finished: '<i class="fa-solid fa-flag-checkered"></i> ¡Tiempo terminado!',
    finishedRaw: '¡Tiempo terminado!',
    winner: (word: string, count: number) =>
        `👑 Ganador: <strong>"${word}"</strong> <span style="font-size:0.9em; opacity:0.8">(${count})</span>`,
    resting: '<i class="fa-solid fa-power-off"></i> Reposo',
    ready: `
        <tr>
            <td colspan="4" style="text-align:center; padding:40px; color:var(--text-muted);">
                <div style="font-size:2rem; margin-bottom:10px;"><i class="fa-solid fa-play"></i></div>
                <h4 style="color:var(--text-primary); margin-bottom:5px;">Listo para analizar</h4>
                <p>Presiona el botón <strong>Play</strong> para comenzar a contar palabras.</p>
            </td>
        </tr>
    `
};
