document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const userDisplayName = document.getElementById('user-display-name');
    const userIdInput = document.getElementById('user-id');
    const userTokenInput = document.getElementById('user-token');
    const toggleTokenBtn = document.getElementById('toggle-token');
    const logoutBtn = document.getElementById('logout-btn');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const botSelectFollow = document.getElementById('bot-select-follow');
    const commandOutputFollow = document.getElementById('command-output-follow');
    const testChannelInput = document.getElementById('test-channel');
    const testUserInput = document.getElementById('test-user');
    const runTestBtn = document.getElementById('run-test-btn');
    const testResultText = document.getElementById('test-result-text');
    const testResultContainer = document.getElementById('test-result-container');
    const botSelectClip = document.getElementById('bot-select-clip');
    const commandOutputClip = document.getElementById('command-output-clip');
    const clipsGallery = document.getElementById('clips-gallery');
    const refreshClipsBtn = document.getElementById('refresh-clips-btn');
    let savedSession = null;
    try {
        savedSession = JSON.parse(localStorage.getItem('twitch_api_session'));
    } catch (e) { }

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || savedSession?.token;
    const userId = params.get('userId') || savedSession?.userId;
    const login = params.get('login') || savedSession?.login;
    const displayName = params.get('displayName') || savedSession?.displayName;

    const isNewLogin = !!params.get('token');

    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        let currentUrl = window.location.href.split('?')[0];
        currentUrl = currentUrl.replace('://www.', '://');
        loginBtn.href = `auth/twitch?redirect_origin=${encodeURIComponent(currentUrl)}`;
    }

    if (token && userId) {
        initDashboard();
    }

    function initDashboard() {
        if (isNewLogin) {
            localStorage.setItem('twitch_api_session', JSON.stringify({ token, userId, login, displayName }));
        }

        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        userDisplayName.textContent = displayName || login;
        userIdInput.value = userId;
        userTokenInput.value = token;

        if (isNewLogin) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        updateFollowCommand();
        updateClipCommand();
        setupTabs();

        const toast = document.getElementById('toast');
        if (toast && isNewLogin) {
            toast.textContent = "⚠ Nueva sesión: TUS COMANDOS ANTIGUOS YA NO SIRVEN. Actualízalos.";
            toast.style.background = "var(--warning-color)";
            toast.classList.remove('hidden');
            setTimeout(() => {
                toast.classList.add('hidden');
                toast.style.background = "var(--accent-color)";
                toast.textContent = "Copiado al portapapeles!";
            }, 5000);
        }
    }

    function setupTabs() {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                const targetId = btn.getAttribute('data-tab');
                const targetContent = document.getElementById(targetId);
                targetContent.classList.add('active');
                if (targetId === 'tab-clips') {
                    loadClips();
                }
            });
        });
    }

    async function loadClips() {
        clipsGallery.innerHTML = '<div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Cargando clips...</div>';

        try {
            const res = await fetch(`api/get-clips?channel=${login}&token=${token}`);
            if (!res.ok) throw new Error('Error fetch');
            const data = await res.json();

            renderClips(data);
        } catch (error) {
            clipsGallery.innerHTML = '<div style="text-align:center; padding:20px; color:var(--warning-color)">Error cargando clips.</div>';
        }
    }

    function renderClips(clips) {
        if (clips.length === 0) {
            clipsGallery.innerHTML = '<div style="text-align:center; padding:20px;">No hay clips recientes.</div>';
            return;
        }

        clipsGallery.innerHTML = '';
        clips.forEach(clip => {
            const card = document.createElement('div');
            card.className = 'clip-card';
            card.innerHTML = `
                <a href="${clip.url}" target="_blank" class="clip-link">
                    <img src="${clip.thumbnail_url}" class="clip-thumb" alt="${clip.title}">
                    <div class="clip-info">
                        <div class="clip-title" title="${clip.title}">${clip.title}</div>
                        <div class="clip-meta">
                            <span><i class="fa-solid fa-eye"></i> ${clip.view_count}</span>
                            <span>${new Date(clip.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </a>
            `;
            clipsGallery.appendChild(card);
        });
    }

    if (refreshClipsBtn) {
        refreshClipsBtn.addEventListener('click', loadClips);
    }

    function updateFollowCommand() {
        if (!login) return;
        const bot = botSelectFollow.value;
        const domain = `${CONFIG.siteUrl}/api/twitch`;
        const tokenParam = token ? `&token=${token}` : '';
        let cmd = '';

        if (bot === 'nightbot') cmd = `$(urlfetch ${domain}/api/followage?channel=${login}&user=$(touser)${tokenParam})`;
        else if (bot === 'streamelements' || bot === 'fossabot') cmd = `$(customapi ${domain}/api/followage?channel=${login}&user=\${user}${tokenParam})`;
        else if (bot === 'wizebot') cmd = `$(urlfetch ${domain}/api/followage?channel=${login}&user=$(user_name)${tokenParam})`;

        const fullCommand = `!addcom !followage ${cmd}`;

        commandOutputFollow.dataset.realValue = fullCommand;

        if (token) {
            const maskedToken = '•'.repeat(20);
            commandOutputFollow.value = fullCommand.replace(token, maskedToken);
        } else {
            commandOutputFollow.value = fullCommand;
        }
    }

    function updateClipCommand() {
        if (!login) return;
        const bot = botSelectClip.value;
        const domain = `${CONFIG.siteUrl}/api/twitch`;
        const tokenParam = token ? `&token=${token}` : '';
        let cmd = '';

        if (bot === 'nightbot' || bot === 'wizebot') cmd = `$(urlfetch ${domain}/api/create-clip?channel=${login}${tokenParam})`;
        else cmd = `$(customapi ${domain}/api/create-clip?channel=${login}${tokenParam})`;

        const fullCommand = `!addcom !clip ${cmd}`;

        commandOutputClip.dataset.realValue = fullCommand;

        if (token) {
            const maskedToken = '•'.repeat(20);
            commandOutputClip.value = fullCommand.replace(token, maskedToken);
        } else {
            commandOutputClip.value = fullCommand;
        }
    }

    botSelectFollow.addEventListener('change', updateFollowCommand);
    botSelectClip.addEventListener('change', updateClipCommand);

    if (runTestBtn) {
        if (login) { testChannelInput.value = login; testUserInput.value = login; }

        runTestBtn.addEventListener('click', async () => {
            const ch = testChannelInput.value || login;
            const u = testUserInput.value || login;

            testResultText.textContent = '...';
            testResultContainer.classList.remove('hidden');

            try {
                const r = await fetch(`api/followage?channel=${ch}&user=${u}&token=${token}`);
                const t = await r.text();
                testResultText.textContent = t;
            } catch (e) {
                testResultText.textContent = "Error de conexión.";
            }
        });
    }

    toggleTokenBtn.addEventListener('click', () => {
        userTokenInput.type = userTokenInput.type === 'password' ? 'text' : 'password';
    });

    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = document.getElementById(btn.dataset.target);
            if (target) {
                const valueToCopy = target.dataset.realValue || target.value;
                target.select();
                navigator.clipboard.writeText(valueToCopy);
                const t = document.getElementById('toast');
                t.classList.remove('hidden');
                setTimeout(() => t.classList.add('hidden'), 2000);
            }
        });
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('twitch_api_session');
        window.location.href = window.location.origin;
    });

    const heroCodeDisplay = document.getElementById('hero-code-display');
    if (heroCodeDisplay) {
        const scenes = [
            `
            <div class="code-line"><span class="c-purple">const</span> <span class="c-blue">streamer</span> = <span class="c-green">"LosPerris"</span>;</div>
            <div class="code-line"><span class="c-purple">await</span> api.checkFollow(<span class="c-blue">user</span>);</div>
            <div class="code-result">// ⏳ Tiempo seguido:</div>
            <div class="code-output">"2 años, 3 meses y 1 día"</div>
            `,
            `
            <div class="code-line"><span class="c-purple">const</span> <span class="c-blue">streamer</span> = <span class="c-green">"LosPerris"</span>;</div>
            <div class="code-line"><span class="c-purple">await</span> api.createClip();</div>
            <div class="code-result">// 🎬 Clip generado:</div>
            <div class="code-output">"twitch.tv/LosPerris/clip..."</div>
            `
        ];

        let currentScene = 0;

        setInterval(() => {
            heroCodeDisplay.classList.add('fade-out');

            setTimeout(() => {
                currentScene = (currentScene + 1) % scenes.length;
                heroCodeDisplay.innerHTML = scenes[currentScene];
                heroCodeDisplay.classList.remove('fade-out');
            }, 500);

        }, 7000);
    }

});
