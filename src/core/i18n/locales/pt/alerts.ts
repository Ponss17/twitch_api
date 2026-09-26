/** Fragmento i18n: alerts (pt). */
export const alerts = {
alerts: {
        bitsRoulette: {
            title: 'Roleta por bits',
            desc: 'Quando alguém cheer a quantidade que escolheres, a roleta gira sozinha no OBS com os teus prémios.',
            triggerTitle: 'Disparo',
            enabled: 'Ativar alerta',
            threshold: 'Bits',
            matchMode: 'Modo',
            matchExact: 'Exatamente essa quantidade',
            matchMin: 'Essa quantidade ou mais',
            cooldown: 'Cooldown (s)',
            triggerHint:
                'Bits e prémios guardam-se aqui. Cor, texto, confete, som e cartão configuram-se ao gerar Overlay.',
            optionsTitle: 'Prémios da roleta',
            addOption: 'Adicionar',
            removeOption: 'Remover',
            optionsMin: 'Põe pelo menos 2 prémios.',
            optionsMaxHint: 'Máximo {max} prémios (plano {plan}).',
            save: 'Guardar na URL',
            saving: 'A guardar…',
            saved: 'Alerta guardada',
            savedLocal: 'Config pronta: abre Overlay para aparência e atualiza a URL no OBS',
            enabledOn: 'Escuta de bits ativada',
            enabledOff: 'Escuta de bits desativada',
            saveError: 'Não foi possível guardar a alerta',
            permissionsNeeded:
                'Para ouvir bits reais é preciso uma permissão da Twitch. Se ao ativar falhar, atualiza-a aqui e tenta de novo.',
            permissionsError:
                'Falta a permissão de bits. Atualiza as permissões da Twitch e volta a ativar.',
            loadError: 'Não foi possível carregar a alerta',
            testSpin: 'Testar no OBS',
            testing: 'A enviar…',
            testOk: 'Cheer de teste enviado (o overlay usa a sua URL)',
            testError: 'Não foi possível testar o spin',
            announceChat: 'Enviar prémio vencedor no chat',
            announceChatHint: 'Quando a roleta para, o canal escreve no chat o prémio e quem ganhou.',
            announceChatOn: 'Anúncio no chat ativado',
            announceChatOff: 'Anúncio no chat desativado',
            appearanceTitle: 'Overlay',
            showDonor: 'Quem fez cheer no cartão',
            showDonorHint: 'Abaixo do prémio quando termina.',
            confetti: 'Confete ao ganhar',
            confettiSound: 'Som ao ganhar',
            confettiSoundHint:
                'Toca ao revelar o prémio. Volta a copiar o URL do overlay se mudaste o som. No OBS, sobe o volume do Browser Source.',
            confettiSoundPreview: 'Testar',
            confettiSounds: {
                none: 'Sem som',
                confetti: 'Confete',
                pop: 'Pop',
                chime: 'Sinos',
                fanfare: 'Fanfarra',
                sparkle: 'Brilho'
            },
            cardStyle: 'Cartão',
            cardGlass: 'Transparente',
            cardSolid: 'Sólido',
            winnerHold: 'Tempo visível (s)',
            winnerHoldHint: 'Quanto tempo o cartão do vencedor fica. De 3 a 15 segundos.',
            donorLabel: 'Cheer de {name}',
            spinBanner: 'Texto enquanto gira',
            spinBannerHint: '{name} e {bits}',
            spinBannerText: 'Texto',
            spinBannerVars: 'Variáveis disponíveis:',
            spinBannerInsertVar: 'Inserir {var}',
            spinBannerDefault: '{name} girou a roleta com {bits} bits'
        }
    }
};
