export const PerriBot = {
    session: null,
    isOpen: false,

    history: [],

    init(session) {
        this.session = session;
        this.injectHTML();
        this.setupListeners();
        const botAvatar = './img/LosPerris_progra.webp';
        this.addMessage('bot', `Saludos. Soy Perri, su asistente de programación. 🦆\n¿En qué puedo serle útil hoy?`, false, botAvatar);
    },

    injectHTML() {
        const root = document.createElement('div');
        root.id = 'perri-root';
        root.innerHTML = `
            <div class="perri-window" id="perri-window">
                <div class="perri-header">
                    <div class="perri-title">
                        <img src="./img/LosPerris_progra.webp" class="perri-header-icon" alt="Bot"> LosPerris Bot <span class="beta-badge">BETA</span>
                    </div>
                    <div class="perri-close" id="perri-close">
                        <i class="fa-solid fa-chevron-down"></i>
                    </div>
                </div>
                <div class="perri-messages" id="perri-messages"></div>
                <div class="perri-input-area">
                    <input type="text" class="perri-input" id="perri-input" placeholder="Escribe aquí... (Ej: !follow command)">
                    <button class="perri-send" id="perri-send">
                        <i class="fa-solid fa-paper-plane"></i>
                    </button>
                </div>
            </div>
            <div class="perri-fab" id="perri-fab" title="Hablar con Perri">
                <img src="./img/LosPerris_progra.webp" alt="Perri">
            </div>
        `;
        document.body.appendChild(root);
    },

    setupListeners() {
        const fab = document.getElementById('perri-fab');
        const window = document.getElementById('perri-window');
        const closeBtn = document.getElementById('perri-close');
        const input = document.getElementById('perri-input');
        const sendBtn = document.getElementById('perri-send');

        const toggleChat = () => {
            this.isOpen = !this.isOpen;
            if (this.isOpen) {
                window.classList.add('open');
                input.focus();
                fab.style.display = 'none';
            } else {
                window.classList.remove('open');
                fab.style.display = 'flex';
            }
        };

        fab.onclick = toggleChat;
        closeBtn.onclick = toggleChat;

        const sendMessage = async () => {
            const text = input.value.trim();
            if (!text) return;

            const userAvatar = this.session.profile_image_url || 'https://static-cdn.jtvnw.net/user-default-pictures-uuid/0a430946-3725-41a4-998f-16e6f4370258-profile_image-70x70.png';
            this.addMessage('user', text, false, userAvatar);

            this.history.push({ role: 'user', content: text });

            input.value = '';
            input.disabled = true;
            sendBtn.disabled = true;

            const botAvatar = './img/LosPerris_progra.webp';
            const loadingId = this.addMessage('bot', '...', true, botAvatar);

            try {
                const { apiKey, token } = this.session;
                const tokenParam = apiKey ? `apiKey=${apiKey}` : `token=${token}`;

                const res = await fetch('api/ai/chat?' + tokenParam, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: text,
                        history: this.history
                    })
                });

                const data = await res.json();

                document.getElementById(loadingId)?.remove();

                if (!res.ok) throw new Error(data.error || 'Error desconocido');
                let finalText = data.result;
                if (apiKey) finalText = finalText.replace(/{{API_KEY}}/g, apiKey);
                else if (token) finalText = finalText.replace(/{{API_KEY}}/g, token);

                this.addMessage('bot', finalText, false, botAvatar);

                this.history.push({ role: 'assistant', content: finalText });

                if (this.history.length > 10) this.history = this.history.slice(-10);

            } catch (err) {
                console.error(err);
                document.getElementById(loadingId)?.remove();
                this.addMessage('bot', 'Algo falló, señor. 🧐\n' + err.message, false, botAvatar);
            } finally {
                input.disabled = false;
                sendBtn.disabled = false;
                input.focus();
            }
        };

        sendBtn.onclick = sendMessage;
        input.onkeypress = (e) => {
            if (e.key === 'Enter') sendMessage();
        };

        document.getElementById('perri-messages').addEventListener('click', (e) => {
            const codeBlock = e.target.closest('pre');
            if (codeBlock) {
                const code = codeBlock.querySelector('code');
                if (code) {
                    navigator.clipboard.writeText(code.innerText);
                    const originalBorder = codeBlock.style.borderColor;
                    codeBlock.style.borderColor = '#4caf50';
                    setTimeout(() => codeBlock.style.borderColor = originalBorder, 300);
                }
            }
        });
    },

    addMessage(role, text, isLoading = false, avatarUrl = '') {
        const container = document.getElementById('perri-messages');
        const msgRow = document.createElement('div');
        msgRow.className = `message ${role}`;

        const imgHtml = `<img src="${avatarUrl}" class="message-avatar" alt="${role}">`;

        let contentHtml = '';
        if (isLoading) {
            msgRow.id = 'perri-loading-' + Date.now();
            contentHtml = '<div class="message-content"><i class="fa-solid fa-ellipsis fa-bounce"></i></div>';
        } else {
            let processedText = '';

            const parts = text.split(/(```[\s\S]*?```)/g);

            processedText = parts.map(part => {
                if (part.startsWith('```')) {
                    const cleanCode = part.replace(/^```\w*\n?/, '').replace(/```$/, '').trim();
                    return `<pre><code>${cleanCode}</code></pre>`;
                } else {
                    let cleanText = part.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    return cleanText.replace(/\n/g, '<br>');
                }
            }).join('');

            contentHtml = `<div class="message-content">${processedText}</div>`;
        }

        msgRow.innerHTML = imgHtml + contentHtml;

        container.appendChild(msgRow);
        container.scrollTop = container.scrollHeight;
        return msgRow.id;
    }
};
