import { Messages } from './utils/messages.js';

export const UI = {
    escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    showToast(message, type = 'success') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = type === 'success' ? 'fa-check-circle' : 'fa-triangle-exclamation';

        toast.innerHTML = `
            <i class="fa-solid ${icon}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('hiding');
            toast.addEventListener('animationend', () => {
                if (toast.parentElement) {
                    toast.remove();
                }
            });
        }, 4000);
    },

    copyToClipboard(text) {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            this.showToast(`<i class="fa-solid fa-check"></i> ${Messages.Clipboard.copied}`);
        }).catch(() => {
            this.showToast(`<i class="fa-solid fa-xmark"></i> ${Messages.Clipboard.error}`, 'error');
        });
    },

    setupClipboard() {
        if (this.clipboardInitialized) return;
        this.clipboardInitialized = true;

        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.copy-btn');
            if (!btn) return;

            const targetId = btn.dataset.target;
            if (targetId) {
                const target = document.getElementById(targetId);
                if (target) {
                    const valueToCopy = target.dataset.realValue || target.value || target.innerText;
                    this.copyToClipboard(valueToCopy);
                }
            }
        });
    },

    setupHeroAnimation(heroCodeDisplay) {
        if (!heroCodeDisplay) return;

        heroCodeDisplay.innerHTML = `
            <div class="twitch-chat-container">
                <div class="chat-messages" id="sim-messages">
                    <div class="chat-line" style="opacity:0.5"><span class="chat-text">${Messages.ChatSim.welcome}</span></div>
                </div>
                <div class="chat-input-area">
                    <div class="fake-input" id="sim-input-box">
                        <div class="input-icon-area">
                             <img src="https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/1" class="badge-icon input-badge" alt="Broadcaster">
                        </div>
                        <div class="input-content-wrapper" style="position:relative; flex:1;">
                            <span class="input-text" id="sim-input-text"></span>
                            <span class="input-placeholder" id="sim-placeholder">${Messages.ChatSim.placeholder}</span>
                        </div>
                    </div>
                    <div class="input-actions">
                        <button class="twitch-btn">${Messages.ChatSim.btnText}</button>
                    </div>
                </div>
            </div>
        `;

        const messagesContainer = document.getElementById('sim-messages');
        const inputText = document.getElementById('sim-input-text');
        const placeholder = document.getElementById('sim-placeholder');
        const inputBox = document.getElementById('sim-input-box');

        const scenarios = [
            {
                cmd: "!followage",
                response: `<span class="chat-badges"><img src="https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/1" class="badge-icon"></span><span class="chat-username" style="color:#00f2ea">LosPerrisBot</span><span class="chat-colon">:</span><span class="chat-text">${Messages.ChatSim.followage('ponss17', 'LosPerris', '1 año, 4 meses y 20 días')}</span>`
            },
            {
                cmd: "!clip",
                response: `<span class="chat-badges"><img src="https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/1" class="badge-icon"></span><span class="chat-username" style="color:#00f2ea">LosPerrisBot</span><span class="chat-colon">:</span><span class="chat-text">${Messages.ChatSim.clip('ponss17', 'https://clips.twitch.tv/WiseDeliciousCurryHassanChop-Df293...')}</span>`
            },
            {
                cmd: "!so  @mynana17",
                response: `<span class="chat-badges"><img src="https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/1" class="badge-icon"></span><span class="chat-username" style="color:#00f2ea">LosPerrisBot</span><span class="chat-colon">:</span><span class="chat-text">${Messages.ChatSim.shoutout('mynana17', 'Just Chatting')}</span>`
            }
        ];

        let currentScenario = 0;

        const typeWriter = (text) => {
            return new Promise(resolve => {
                inputBox.classList.add('typing');
                placeholder.style.display = 'none';
                inputText.innerText = "";

                let i = 0;
                const interval = setInterval(() => {
                    inputText.innerText += text.charAt(i);
                    i++;
                    if (i > text.length - 1) {
                        clearInterval(interval);
                        setTimeout(resolve, 500);
                    }
                }, 100);
            });
        };

        const addMessage = (html) => {
            const div = document.createElement('div');
            div.className = 'chat-line';
            div.innerHTML = html;
            messagesContainer.appendChild(div);
            if (messagesContainer.children.length > 5) {
                messagesContainer.removeChild(messagesContainer.children[0]);
            }
        };

        const sleep = (ms) => new Promise(r => setTimeout(r, ms));

        const runSimulation = async () => {
            while (true) {
                const scenario = scenarios[currentScenario];

                await sleep(1500);
                await typeWriter(scenario.cmd);
                inputText.innerText = "";
                placeholder.style.display = 'block';
                inputBox.classList.remove('typing');

                addMessage(`
                    <span class="chat-badges"><img src="https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/1" class="badge-icon" alt="Broadcaster"></span>
                    <span class="chat-username" style="color:#FF69B4">ponss17</span>
                    <span class="chat-colon">:</span>
                    <span class="chat-text">${scenario.cmd}</span>
                `);

                await sleep(1500);
                addMessage(scenario.response);

                currentScenario = (currentScenario + 1) % scenarios.length;
                if (currentScenario === 0) {
                    await sleep(2000);
                    await typeWriter("/clear");
                    await sleep(500);
                    inputText.innerText = "";
                    placeholder.style.display = 'block';
                    inputBox.classList.remove('typing');

                    messagesContainer.innerHTML = `<div class="chat-line" style="opacity:0.5"><span class="chat-text">${Messages.ChatSim.welcome}</span></div>`;
                    await sleep(1000);
                }
            }
        };

        runSimulation();
    },

    setButtonLoading(button, isLoading) {
        if (!button) return;

        if (isLoading) {
            button.classList.add('btn-loading');
            button.disabled = true;
            button.dataset.originalText = button.textContent;
        } else {
            button.classList.remove('btn-loading');
            button.disabled = false;
            if (button.dataset.originalText) {
                button.textContent = button.dataset.originalText;
            }
        }
    },

    disableButton(button) {
        if (!button) return;
        button.disabled = true;
        button.classList.add('btn-disabled');
    },

    enableButton(button) {
        if (!button) return;
        button.disabled = false;
        button.classList.remove('btn-disabled');
    },

    setCardLoading(card, isLoading) {
        if (!button) return;

        if (isLoading) {
            card.classList.add('card-loading');
        } else {
            card.classList.remove('card-loading');
        }
    }

};
