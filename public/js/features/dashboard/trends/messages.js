const r={title:a=>`Tendencias de ${a}`,noTmi:"TMI.js no cargado"},e={connected:'<span style="color:var(--success)"><i class="fa-solid fa-circle"></i> Conectado</span>',error:'<span style="color:var(--warning)"><i class="fa-solid fa-xmark"></i> Error</span>',waiting:'<tr><td colspan="4" style="text-align:center; padding:20px; color:#666;">Esperando palabras...</td></tr>',timeUp:"\xA1TIEMPO!",started:a=>`<i class="fa-solid fa-hourglass-start fa-spin"></i>  Tracker iniciado (${a} min)`,startedRaw:a=>`Tracker iniciado (${a} min)`,finished:'<i class="fa-solid fa-flag-checkered"></i> \xA1Tiempo terminado!',finishedRaw:"\xA1Tiempo terminado!",winner:(a,s)=>`\u{1F451} Ganador: <strong>"${a}"</strong> <span style="font-size:0.9em; opacity:0.8">(${s})</span>`,resting:'<i class="fa-solid fa-power-off"></i> Reposo',ready:`
        <tr>
            <td colspan="4" style="text-align:center; padding:40px; color:var(--text-muted);">
                <div style="font-size:2rem; margin-bottom:10px;"><i class="fa-solid fa-play"></i></div>
                <h4 style="color:var(--text-primary); margin-bottom:5px;">Listo para analizar</h4>
                <p>Presiona el bot\xF3n <strong>Play</strong> para comenzar a contar palabras.</p>
            </td>
        </tr>
    `};export{e as TrackerMessages,r as TrendsMessages};
