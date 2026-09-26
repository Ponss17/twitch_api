/** Fragmento i18n: alerts (es). */
export const alerts = {
alerts: {
        bitsRoulette: {
            title: 'Ruleta por bits',
            desc: 'Cuando alguien cheeréa la cantidad que elijas, la ruleta gira sola en OBS con tus premios.',
            triggerTitle: 'Disparo',
            enabled: 'Activar alerta',
            threshold: 'Bits',
            matchMode: 'Modo',
            matchExact: 'Exactamente esa cantidad',
            matchMin: 'Esa cantidad o más',
            cooldown: 'Cooldown (s)',
            triggerHint:
                'Bits y premios se guardan aquí. Color, texto, confeti, sonido y tarjeta se configuran al generar Overlay',
            optionsTitle: 'Premios de la ruleta',
            addOption: 'Añadir',
            removeOption: 'Quitar',
            optionsMin: 'Pon al menos 2 premios.',
            optionsMaxHint: 'Máximo {max} premios (plan {plan}).',
            save: 'Guardar en URL',
            saving: 'Guardando…',
            saved: 'Alerta guardada',
            savedLocal: 'Config lista: abre Overlay para apariencia y actualiza la URL en OBS',
            enabledOn: 'Escucha de bits activada',
            enabledOff: 'Escucha de bits desactivada',
            saveError: 'No se pudo guardar la alerta',
            permissionsNeeded:
                'Para escuchar bits reales hace falta un permiso de Twitch. Si al activar falla, actualízalo aquí y vuelve a intentarlo.',
            permissionsError:
                'Falta el permiso de bits. Actualiza los permisos de Twitch y vuelve a activar.',
            loadError: 'No se pudo cargar la alerta',
            testSpin: 'Probar en OBS',
            testing: 'Lanzando…',
            testOk: 'Cheer de prueba enviado (el overlay usa su URL)',
            testError: 'No se pudo probar el spin',
            announceChat: 'Enviar premio ganador en el chat',
            announceChatHint: 'Al terminar el giro, el canal escribe en el chat el premio y quién lo ganó.',
            announceChatOn: 'Anuncio en chat activado',
            announceChatOff: 'Anuncio en chat desactivado',
            appearanceTitle: 'Overlay',
            showDonor: 'Quién cheeró en la tarjeta',
            showDonorHint: 'Debajo del premio al terminar.',
            confetti: 'Confeti al ganar',
            confettiSound: 'Sonido al ganar',
            confettiSoundHint:
                'Suena al revelar el premio. Vuelve a copiar la URL del overlay si cambiaste el sonido. En OBS sube el volumen del Browser Source.',
            confettiSoundPreview: 'Probar',
            confettiSounds: {
                none: 'Sin sonido',
                confetti: 'Confeti',
                pop: 'Pop',
                chime: 'Campanitas',
                fanfare: 'Fanfarria',
                sparkle: 'Brillo'
            },
            cardStyle: 'Tarjeta',
            cardGlass: 'Transparente',
            cardSolid: 'Sólida',
            winnerHold: 'Tiempo visible (s)',
            winnerHoldHint: 'Cuánto se queda la tarjeta del ganador. De 3 a 15 segundos.',
            donorLabel: 'Cheer de {name}',
            spinBanner: 'Texto mientras gira',
            spinBannerHint: '{name} y {bits}',
            spinBannerText: 'Texto',
            spinBannerVars: 'Variables disponibles:',
            spinBannerInsertVar: 'Insertar {var}',
            spinBannerDefault: '{name} giró la ruleta con {bits} bits'
        }
    }
};
