/** Fragmento i18n: legal (pt). */
export const legal = {
legal: {
        introTerms: 'Estes termos regulam o acesso e o uso do **LosPerrisBot**, disponível em [ttv.losperris.dev](https://ttv.losperris.dev). Ao usar o site, conectar sua conta Twitch (o app aparece como **LosPerris - API**) ou usar sua API Key, você concorda com estas condições e com a política de privacidade.',
        introPrivacy: 'Esta política descreve o tratamento de informações pessoais em [ttv.losperris.dev](https://ttv.losperris.dev) pelo **LosPerrisBot**. Ao conectar o Twitch, o app autorizado é identificado como **LosPerris - API**.',
        introCookies: 'Este documento complementa a política de privacidade e descreve o uso de armazenamento local e tecnologias similares no **LosPerrisBot**. Não usamos cookies de publicidade nem vendemos dados derivados da navegação.',
        sections: [
            {
                title: 'Descrição do Serviço',
                content: 'Oferecemos um painel interativo para Twitch que permite aos streamers interagir com seu público por meio de comandos, minijogos e um overlay na tela. Não armazenamos áudio, vídeo ou credenciais bancárias.'
            },
            {
                title: 'Obrigações do Usuário',
                content: 'Ao fazer login, você confirma que é o titular da conta Twitch ou está autorizado a usá-la. Você pode exportar ou excluir seus dados na aba Configurações do painel a qualquer momento.'
            },
            {
                title: 'Condutas Proibidas',
                content: 'É proibido usar o serviço para spam em massa, atividades ilegais ou qualquer ação que viole os Termos de Serviço da Twitch. Reservamo-nos o direito de revogar o acesso a contas que abusem dos limites da API.'
            },
            {
                title: 'Limitação de Responsabilidade',
                content: 'O serviço é fornecido "como está". Não garantimos disponibilidade de 100% nem nos responsabilizamos por danos diretos ou indiretos resultantes de interrupções, perda de dados ou alterações na API da Twitch.'
            },
            {
                title: 'Suspensão do Serviço',
                content: 'Podemos suspender temporariamente o acesso para manutenção ou caso detectemos tráfego anômalo que coloque a infraestrutura compartilhada em risco.'
            },
            {
                title: 'Modificações',
                content: 'Podemos modificar estes termos a qualquer momento. O uso continuado do serviço após as alterações constitui sua aceitação.'
            },
            {
                title: 'Quem gerencia os dados',
                content: 'Seus dados são tratados pelo LosPerrisBot, operando sob a infraestrutura descrita abaixo. Atuamos como intermediários entre sua conta Twitch e as funcionalidades do painel.'
            },
            {
                title: 'Dados que coletamos',
                content: 'Coletamos seu ID Twitch, login, status de afiliado e data de criação da conta para a autenticação principal. Armazenamos suas configurações personalizadas (comandos, minijogos) e um log temporário dos últimos 200 eventos no seu canal.'
            },
            {
                title: 'Dados que não coletamos',
                content: 'Não armazenamos senhas (usamos OAuth2). Não coletamos, lemos ou armazenamos mensagens do chat além das invocações de comandos específicos do bot. Não coletamos dados de pagamento ou endereço.'
            },
            {
                title: 'Uso dos Dados',
                content: 'Seus dados são usados exclusivamente para habilitar as funcionalidades do seu painel, processar suas configurações de minijogos e estatísticas. Não vendemos nem transferimos dados a terceiros para fins publicitários.'
            },
            {
                title: 'Provedores e terceiros',
                content: 'Compartilhamos dados mínimos estritamente necessários com nossos provedores de infraestrutura: Twitch (autenticação e consultas), Supabase (armazenamento de perfil), Vercel (hospedagem e métricas), Groq (processamento de texto na Bola 8 Mágica) e Discord (apenas se você enviar feedback voluntário).'
            },
            {
                title: 'Retenção de Dados',
                content: 'Perfis e configurações são mantidos enquanto a conta estiver ativa. Os logs de atividade do canal são truncados automaticamente para os 200 eventos mais recentes por usuário. Se você excluir sua conta, eles são apagados imediatamente do banco de dados principal.'
            },
            {
                title: 'Direitos do Usuário',
                content: 'Você tem o direito de saber quais dados temos, corrigir dados incorretos e exportar ou excluir sua conta na seção Configurações do painel a qualquer momento. A exclusão é permanente.'
            },
            {
                title: 'Cookies e armazenamento local',
                content: 'Usamos cookies de sessão criptografados e armazenamento local (localStorage/IndexedDB) estritamente necessários para manter sua sessão ativa, armazenar estatísticas em cache e persistir suas preferências do painel (modo escuro, idioma).'
            },
            {
                title: 'Menores',
                content: 'O serviço é destinado a usuários com mais de 13 anos (ou a idade mínima exigida pela Twitch em seu país). Não coletamos intencionalmente dados de menores abaixo dessa idade.'
            },
            {
                title: 'Segurança',
                content: 'Implementamos criptografia em trânsito (HTTPS) e em repouso via Supabase. Seu token de sessão tem validade curta e é renovado automaticamente. Nunca expomos tokens da API da Twitch ao cliente.'
            },
            {
                title: 'Atualizações',
                content: 'Esta política pode ser atualizada. A data da última revisão estará sempre visível no rodapé deste documento.'
            },
            {
                title: 'Armazenamento Local',
                content: 'O LocalStorage é usado para reter sua API Key, suas preferências do painel e acelerar o carregamento das páginas armazenando respostas temporárias em cache.'
            },
            {
                title: 'Service Worker',
                content: 'Podemos usar Service Workers para suportar notificações ou funcionalidades offline do painel, que residem no seu dispositivo local.'
            },
            {
                title: 'Métricas de Desempenho',
                content: 'Usamos o Vercel Web Vitals e Speed Insights de forma anônima para monitorar tempos de carregamento e identificar gargalos na plataforma.'
            },
            {
                title: 'Limpeza do armazenamento',
                content: 'Você pode limpar todo o armazenamento local fazendo logout, limpando os dados do site no seu navegador ou usando o botão de limpar estatísticas nas Configurações.'
            }
        ]
    },

verifying: {
        authenticated: 'AUTENTICADO',
        accessGranted: 'Acesso concedido. Redirecionando...',
        cacheActive: 'Cache local ativo — carregamento rápido.',
        noCache: 'Sincronizando perfil seguro...',
    }
};
