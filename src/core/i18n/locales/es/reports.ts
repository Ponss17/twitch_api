/** Fragmento i18n: reports (es). */
export const reports = {
reports: {
        title: 'Reportes',
        eyebrow: 'Mes cerrado',
        browseByMonth: 'Archivo',
        months: 'Meses',
        metaCategory: 'Informe guardado',
        latestBadge: 'Más reciente',
        entryTitle: 'Informe de {month}',
        checkUses: '{count} usos en total',
        checkSuccess: '{rate}% sin error',
        checkCommand: 'Más usado: {command}',
        checkViewer: 'Top chat: {viewer}',
        checkLatency: '{ms} ms de media',
        intro: 'Resumen cerrado del uso de tus comandos LosPerris en el chat durante ese mes.',
        note: 'Esto no es Analíticas en vivo ni datos de Twitch: es un informe del mes ya cerrado, solo uso de la API.',
        story: 'Ese mes se cerró con {uses} usos de comandos ({rate}% OK). Lo más pedido fue {command}. En el chat, quien más los disparó fue {viewer}.',
        storyTitle: 'En pocas palabras',
        storyNoCommand: 'ningún comando',
        storyNoViewer: 'nadie del chat',
        downloadTitle: 'Guardar el informe',
        downloadAction: 'Descargar',
        downloadHtmlDesc: 'Página lista para guardar o compartir.',
        downloadCsvDesc: 'Para Excel o Google Sheets.',
        emptyTitle: 'Aún no hay un mes cerrado',
        emptyBody:
            'Cuando termine un mes con uso de comandos, aquí queda el informe archivado y te avisamos en la campanita. Para ver el momento actual, usa Analíticas.',
        emptyCtaAnalytics: 'Ir a Analíticas (en vivo)',
        emptyCtaCommands: 'Configurar un comando',
        monthMeta: '{count} usos · {rate}% OK',
        monthMetaOne: '1 uso · {rate}% OK',
        commands: 'Detalle: comandos',
        commandsHint: 'Qué se pidió en el chat ese mes',
        listCommand: 'Comando',
        listUses: 'Usos',
        listLatency: 'Media',
        listViewer: 'Usuario',
        noCommands: 'Sin comandos en ese mes',
        commandUses: '{count} veces',
        commandUsesOne: '1 vez',
        commandLatency: '{ms} ms de media',
        topViewers: 'Detalle: chat',
        topViewersHint: 'Quién disparó comandos ese mes',
        viewerUses: '{count} veces',
        viewerUsesOne: '1 vez',
        noViewers: 'Nadie del chat usó comandos ese mes.',
        lowActivity:
            'Fue un mes tranquilo ({count} usos). Es normal si acababas de configurar los comandos.',
        lowActivityOne:
            'Solo hubo 1 uso ese mes. Es normal si acababas de configurar los comandos.',
        downloadHtml: 'Descargar HTML',
        downloadCsv: 'Descargar CSV',
        loadError: 'No se pudieron cargar los reportes.',
        vsPrevious: 'Respecto a {month}: sin cambio en usos',
        vsPreviousUp: 'Respecto a {month}: {delta} usos más',
        vsPreviousDown: 'Respecto a {month}: {delta} usos menos',
        notificationTitle: 'Informe listo: {month}',
        notificationBody: 'Ya puedes leer o descargar el resumen del mes cerrado.',
        openReport: 'Abrir informe',
        howItWorks: '¿Cómo funciona?',
        howItWorksDesc: 'Sobre los informes del mes cerrado',
        howItWorksFaq: [
            {
                q: '¿Qué guarda Reportes?',
                a: 'Al cerrar un mes en el que usaste comandos LosPerris, archivamos esos datos del mes terminado. No es un panel en vivo: Analíticas sigue mostrando lo actual; aquí queda el resumen ya cerrado para consultarlo o descargarlo después.'
            },
            {
                q: '¿El mes en curso aparece aquí?',
                a: 'Todavía no. Lo que usas hoy se ve en Analíticas. El informe de ese mes solo se crea cuando el mes termina y hubo uso de comandos; si no hubo uso, no se genera archivo.'
            },
            {
                q: '¿Si reinicio estadísticas en Ajustes → Datos, se borran los reportes?',
                a: 'No. Reiniciar estadísticas limpia el contador en vivo, pero los informes ya archivados se conservan. Solo desaparecen si borras la cuenta por completo.'
            }
        ],
        kpis: {
            requests: 'Usos totales',
            requestsHint: 'Veces que alguien usó un comando',
            success: 'Salieron bien',
            successHint: 'Porcentaje sin error',
            latency: 'Velocidad',
            latencyHint: 'Tiempo medio de respuesta',
            commands: 'Comandos distintos',
            commandsHint: 'Tipos de comando usados'
        }
    }
};
