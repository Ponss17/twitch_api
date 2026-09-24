/** Fragmento i18n: overlay (pt). */
export const overlay = {
overlay: {
        button: {
            title: 'Abrir guia do overlay',
            aria: 'Configurar overlay',
            label: 'Overlay'
        },
        setupModal: {
            titlePrefix: 'Overlay —',
            description: 'Siga as instruções para conectar o overlay ao seu software de streaming.',
            warning: 'A URL contém seu token secreto.',
            warningBold: 'Não a compartilhe publicamente.',
            generating: 'Gerando link…',
            copying: 'Copiando…',
            copied: 'Copiado para a Área de Transferência!',
            copySrc: 'Copiar URL da Fonte',
            generateError: 'Não foi possível gerar a URL do overlay',
            copySuccess: 'URL do overlay copiada',
            copyError: 'Não foi possível copiar a URL'
        },
        guide: {
            obsTitle: 'Configuração no OBS',
            obsSteps: {
                sourceTitle: 'Nova fonte',
                sourceDetail: 'Fontes → Fonte de Navegador.',
                urlTitle: 'Colar URL',
                urlDetail:
                    'Copie a URL do botão abaixo (inclui cor e tamanho escolhidos) e cole no OBS.',
                sizeTitle: 'Largura e altura',
                sizeDetail: (size: string): string =>
                    `Defina exatamente ${size}, fundo transparente. Se mudar Pequeno/Normal/Grande acima, use estas medidas novas.`,
                refreshTitle: 'Ao ativar cena',
                refreshDetail:
                    'Marque "Atualizar navegador quando a cena ficar ativa". Se ficar em branco ao voltar, tente "Desligar fonte quando não estiver visível".'
            },
            obsNote:
                'Escolha cor e tamanho acima antes de copiar a URL. O overlay só exibe; para iniciar, girar ou resetar, use o painel.',
            slTitle: 'Configuração no Streamlabs',
            slSteps: {
                sourceTitle: 'Nova fonte',
                sourceDetail: 'Fontes → Widget Personalizado ou Fonte de Navegador.',
                urlTitle: 'Colar URL',
                urlDetail:
                    'Copie a URL do botão abaixo (inclui cor e tamanho escolhidos) e cole no Streamlabs.',
                sizeTitle: 'Largura e altura',
                sizeDetail: (size: string): string =>
                    `Defina exatamente ${size}, sem cor de fundo. Se mudar Pequeno/Normal/Grande acima, use estas medidas novas.`,
                refreshTitle: 'Ao mostrar cena',
                refreshDetail: 'Ative a atualização automática se seu plano permitir.'
            },
            slNote:
                'Escolha cor e tamanho acima antes de copiar a URL. Se a fonte ficar preta, verifique medidas, fundo transparente e atualização ao mostrar cena.',
            tools: {
                trends: 'Tendências',
                roulette: 'Roleta',
                questions: 'Perguntas',
                'bits-roulette': 'Roleta Bits'
            },
            sizes: {
                trends: (w: number, h: number): string =>
                    `${w} × ${h} px (top 10; largura total se preferir)`,
                roulette: (w: number, h: number): string => `${w} × ${h} px`,
                questions: (w: number, h: number): string =>
                    `${w} × ${h} px (pergunta atual; largura total se preferir)`,
                'bits-roulette': (w: number, h: number): string => `${w} × ${h} px`
            }
        },
        appearance: {
            title: 'Aparência ao vivo',
            badge: 'Só overlay',
            desc: 'Cor e tamanho vão na URL. As medidas do OBS/Streamlabs abaixo atualizam conforme Pequeno, Normal ou Grande.',
            colorLabel: 'Cor',
            customColor: 'Cor personalizada',
            preset: 'Preset',
            scaleLabel: 'Tamanho',
            scaleSm: 'Pequeno',
            scaleMd: 'Normal',
            scaleLg: 'Grande'
        },
        questions: {
            now: 'Pergunta atual',
            waitingTitle: 'Ouvindo',
            waitingHint: 'Os viewers perguntam com !{keyword}',
            queue: '{count} na fila'
        },
        banners: {
            connecting: 'Conectando overlay…',
            waiting: 'Aguardando dados do painel…',
            unauthorized: 'Link de overlay inválido ou expirado. Gere um novo no painel.'
        },
        gate: {
            invalidLink: 'Link de overlay inválido. Gere um novo no painel.'
        },
        apps: {
            rouletteErrorTitle: 'Overlay de Roleta',
            bitsRouletteErrorTitle: 'Overlay de Roleta por bits',
            trendsErrorTitle: 'Overlay de Tendências',
            questionsErrorTitle: 'Overlay de Perguntas'
        }
    }
};
