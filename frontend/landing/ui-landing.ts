import { UIMessages } from '../shared/i18n/uiMessages.js';

export const LandingUI = {
    setupHeroAnimation(heroCodeDisplay: HTMLElement) {
        if (!heroCodeDisplay) return;

        heroCodeDisplay.innerHTML = `
            <div class="twitch-chat-container">
                <div class="chat-messages" id="sim-messages">
                    <div class="chat-line" style="opacity:0.5"><span class="chat-text">${UIMessages.ChatSim.welcome}</span></div>
                </div>
                <div class="chat-input-area">
                    <div class="fake-input" id="sim-input-box">
                        <div class="input-icon-area">
                         <img src="/img/badge-broadcaster.png" class="badge-icon input-badge" alt="Broadcaster">
                        </div>
                        <div class="input-content-wrapper" style="position:relative; flex:1;">
                            <span class="input-text" id="sim-input-text"></span>
                            <span class="input-placeholder" id="sim-placeholder">${UIMessages.ChatSim.placeholder}</span>
                        </div>
                    </div>
                    <div class="input-actions">
                        <button class="twitch-btn">${UIMessages.ChatSim.btnText}</button>
                    </div>
                </div>
            </div>
        `;

        const messagesContainer = document.getElementById('sim-messages')!;
        const inputText = document.getElementById('sim-input-text')!;
        const placeholder = document.getElementById('sim-placeholder')!;
        const inputBox = document.getElementById('sim-input-box')!;

        const scenarios = [
            {
                cmd: '!followage',
                response: `<span class="chat-badges"><img src="/img/badge-bot.png" class="badge-icon"></span><span class="chat-username" style="color:#00f2ea">LosPerrisBot</span><span class="chat-colon">:</span><span class="chat-text">${UIMessages.ChatSim.followage('ponss17', 'LosPerris', '1 año, 4 meses y 20 días')}</span>`
            },
            {
                cmd: '!clip',
                response: `<span class="chat-badges"><img src="/img/badge-bot.png" class="badge-icon"></span><span class="chat-username" style="color:#00f2ea">LosPerrisBot</span><span class="chat-colon">:</span><span class="chat-text">${UIMessages.ChatSim.clip('ponss17', 'https://clips.twitch.tv/WiseDeliciousCurryHassanChop-Df293...')}</span>`
            },
            {
                cmd: '!so  @mynana17',
                response: `<span class="chat-badges"><img src="/img/badge-bot.png" class="badge-icon"></span><span class="chat-username" style="color:#00f2ea">LosPerrisBot</span><span class="chat-colon">:</span><span class="chat-text">${UIMessages.ChatSim.shoutout('mynana17', 'Just Chatting')}</span>`
            }
        ];

        let currentScenario = 0;

        const typeWriter = (text: string) => {
            return new Promise((resolve) => {
                inputBox.classList.add('typing');
                placeholder.style.display = 'none';
                inputText.innerText = '';

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

        const addMessage = (html: string) => {
            const div = document.createElement('div');
            div.className = 'chat-line';
            div.innerHTML = html;
            messagesContainer.appendChild(div);
            if (messagesContainer.children.length > 5) {
                messagesContainer.removeChild(messagesContainer.children[0]);
            }
        };

        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

        const runSimulation = async () => {
            while (true) {
                const scenario = scenarios[currentScenario];

                await sleep(1500);
                await typeWriter(scenario.cmd);
                inputText.innerText = '';
                placeholder.style.display = 'block';
                inputBox.classList.remove('typing');

                addMessage(`
                    <span class="chat-badges"><img src="/img/badge-broadcaster.png" class="badge-icon" alt="Broadcaster"></span>
                    <span class="chat-username" style="color:#FF69B4">ponss17</span>
                    <span class="chat-colon">:</span>
                    <span class="chat-text">${scenario.cmd}</span>
                `);

                await sleep(1500);
                addMessage(scenario.response);

                currentScenario = (currentScenario + 1) % scenarios.length;
                if (currentScenario === 0) {
                    await sleep(2000);
                    await typeWriter('/clear');
                    await sleep(500);
                    inputText.innerText = '';
                    placeholder.style.display = 'block';
                    inputBox.classList.remove('typing');

                    messagesContainer.innerHTML = `<div class="chat-line" style="opacity:0.5"><span class="chat-text">${UIMessages.ChatSim.welcome}</span></div>`;
                    await sleep(1000);
                }
            }
        };

        runSimulation();
    }
};
