/**
 * Utilidades para formateo de tiempo y fechas.
 */

/**
 * Formatea una duración en milisegundos a una cadena legible en español.
 * Ejemplo: "2 años, 3 meses y 5 días"
 */
export const formatDurationSpanish = (ms: number): string => {
    const parts = {
        años: Math.floor(ms / (1000 * 60 * 60 * 24 * 365)),
        meses: Math.floor((ms % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30)),
        días: Math.floor((ms % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24)),
        horas: Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutos: Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60)),
        segundos: Math.floor((ms % (1000 * 60)) / 1000)
    };

    const timeString: string[] = [];
    if (parts.años > 0) timeString.push(`${parts.años} ${parts.años === 1 ? 'año' : 'años'}`);
    if (parts.meses > 0) timeString.push(`${parts.meses} ${parts.meses === 1 ? 'mes' : 'meses'}`);
    if (parts.días > 0) timeString.push(`${parts.días} ${parts.días === 1 ? 'día' : 'días'}`);
    if (parts.horas > 0) timeString.push(`${parts.horas} ${parts.horas === 1 ? 'hora' : 'horas'}`);
    if (parts.minutos > 0)
        timeString.push(`${parts.minutos} ${parts.minutos === 1 ? 'minuto' : 'minutos'}`);
    if (parts.segundos > 0 || timeString.length === 0)
        timeString.push(`${parts.segundos} ${parts.segundos === 1 ? 'segundo' : 'segundos'}`);

    if (timeString.length > 1) {
        return timeString.slice(0, -1).join(', ') + ' y ' + timeString.slice(-1);
    }
    return timeString[0];
};

/**
 * Calcula la diferencia entre dos fechas y devuelve la frase formateada.
 */
export const getTimePhraseBetween = (start: Date, end: Date = new Date()): string => {
    const diff = Math.abs(end.getTime() - start.getTime());
    return formatDurationSpanish(diff);
};
