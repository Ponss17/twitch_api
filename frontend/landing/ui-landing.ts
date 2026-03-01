import { UIMessages } from '../shared/i18n/uiMessages.js';

export const LandingUI = {
    setupHeroAnimation(heroCodeDisplay: HTMLElement) {
        if (!heroCodeDisplay) return;

        const base = window.location.pathname.includes('/api/twitch') ? '/api/twitch' : '';

        const mkBadge = (src: string, alt = '') => {
            const img = document.createElement('img');
            img.src = `${base}/img/${src}`;
            img.className = 'badge-icon';
            img.alt = alt;
            return img;
        };

        const badgeBroadcaster = mkBadge('badge-broadcaster.png', 'Broadcaster');
        const badgeBot = mkBadge('badge-bot.png', 'Bot');

        heroCodeDisplay.innerHTML = `
            <div class="twitch-chat-container">
                <div class="chat-messages" id="sim-messages">
                    <div class="chat-line" style="opacity:0.5"><span class="chat-text">${UIMessages.ChatSim.welcome}</span></div>
                </div>
                <div class="chat-input-area">
                    <div class="fake-input" id="sim-input-box">
                        <div class="input-icon-area" id="sim-input-badge"></div>
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

        document
            .getElementById('sim-input-badge')!
            .appendChild(badgeBroadcaster.cloneNode() as HTMLElement);

        const messagesContainer = document.getElementById('sim-messages')!;
        const inputText = document.getElementById('sim-input-text')!;
        const placeholder = document.getElementById('sim-placeholder')!;
        const inputBox = document.getElementById('sim-input-box')!;

        const scenarios = [
            {
                cmd: '!followage',
                response: UIMessages.ChatSim.followage(
                    'ponss17',
                    'LosPerris',
                    '1 año, 4 meses y 20 días'
                )
            },
            {
                cmd: '!clip',
                response: UIMessages.ChatSim.clip(
                    'ponss17',
                    'https://clips.twitch.tv/WiseDeliciousCurryHassanChop-Df293...'
                )
            },
            {
                cmd: '!so  @mynana17',
                response: UIMessages.ChatSim.shoutout('mynana17', 'Just Chatting')
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

        const addUserMessage = (cmd: string): HTMLElement => {
            const line = document.createElement('div');
            line.className = 'chat-line';
            const badgeWrap = document.createElement('span');
            badgeWrap.className = 'chat-badges';
            badgeWrap.appendChild(badgeBroadcaster.cloneNode() as HTMLElement);
            const user = document.createElement('span');
            user.className = 'chat-username';
            user.style.color = '#FF69B4';
            user.textContent = 'ponss17';
            const colon = document.createElement('span');
            colon.className = 'chat-colon';
            colon.textContent = ':';
            const text = document.createElement('span');
            text.className = 'chat-text';
            text.textContent = cmd;
            line.append(badgeWrap, user, colon, text);
            return line;
        };

        const addBotMessage = (html: string): HTMLElement => {
            const line = document.createElement('div');
            line.className = 'chat-line';
            const badgeWrap = document.createElement('span');
            badgeWrap.className = 'chat-badges';
            badgeWrap.appendChild(badgeBot.cloneNode() as HTMLElement);
            const user = document.createElement('span');
            user.className = 'chat-username';
            user.style.color = '#00f2ea';
            user.textContent = 'LosPerrisBot';
            const colon = document.createElement('span');
            colon.className = 'chat-colon';
            colon.textContent = ':';
            const text = document.createElement('span');
            text.className = 'chat-text';
            text.innerHTML = html;
            line.append(badgeWrap, user, colon, text);
            return line;
        };

        const appendMessage = (el: HTMLElement) => {
            messagesContainer.appendChild(el);
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

                appendMessage(addUserMessage(scenario.cmd));

                await sleep(1500);
                appendMessage(addBotMessage(scenario.response));

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
