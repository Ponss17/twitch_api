document.addEventListener('DOMContentLoaded', () => {
    // Referencias DOM
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const userDisplayName = document.getElementById('user-display-name');
    const userIdInput = document.getElementById('user-id');
    const userTokenInput = document.getElementById('user-token');
    const botSelect = document.getElementById('bot-select');
    const commandOutput = document.getElementById('command-output');
    const logoutBtn = document.getElementById('logout-btn');
    const toggleTokenBtn = document.getElementById('toggle-token');

    // Parse URL params
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userId = params.get('userId');
    const login = params.get('login');
    const displayName = params.get('displayName');
    const error = params.get('error');

    if (error) {
        alert('Error en la autenticación. Intenta de nuevo.');
        cleanUrl();
    }

    if (token && userId) {
        // Show Dashboard
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        dashboardSection.classList.add('fade-in');

        // Populate Data
        userDisplayName.textContent = displayName || login;
        userIdInput.value = userId;
        userTokenInput.value = token;

        // Limpiar URL para limpieza visual
        cleanUrl();

        // Generar comando inicial
        updateCommand();
    }

    // Toggle Token Visibility
    toggleTokenBtn.addEventListener('click', () => {
        if (userTokenInput.type === 'password') {
            userTokenInput.type = 'text';
            toggleTokenBtn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
        } else {
            userTokenInput.type = 'password';
            toggleTokenBtn.innerHTML = '<i class="fa-regular fa-eye"></i>';
        }
    });

    // Copy Buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);

            targetEl.select();
            targetEl.setSelectionRange(0, 99999); // Mobile
            navigator.clipboard.writeText(targetEl.value).then(() => {
                showToast();
            });
        });
    });

    // Bot Select Change
    botSelect.addEventListener('change', updateCommand);

    // Logout
    logoutBtn.addEventListener('click', () => {
        window.location.href = window.location.origin;
    });

    // Funciones Helper
    function cleanUrl() {
        window.history.replaceState({}, document.title, "/");
    }

    function showToast() {
        const toast = document.getElementById('toast');
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    function updateCommand() {
        const bot = botSelect.value;
        const currentDomain = window.location.origin; // e.g., http://localhost:3000
        // En producción, esto debería ser el dominio público real.
        // Si está en localhost y el bot intenta llamar a localhost, fallará.
        // El usuario necesita un túnel (ngrok) o deployar esto.

        // Asumimos que el usuario lo usará donde el bot pueda alcanzarlo.
        const apiUrl = `${currentDomain}/api/followage?channel=${login}&user=$(touser)`;

        let command = "";

        switch (bot) {
            case 'nightbot':
                command = `$(urlfetch ${currentDomain}/api/followage?channel=${login}&user=$(touser))`;
                break;
            case 'streamelements':
                command = `$(urlfetch ${currentDomain}/api/followage?channel=${login}&user=$(user))`;
                // StreamElements usa $(user) para el sender o $(1) para argumentos.
                // Ajustamos para verificar al sender si no hay argumentos, o lógica compleja.
                // Simplifiquemos: verifica al $(touser) si existe, o al $(user).
                // SE custom api: ${currentDomain}/api/followage?channel=${login}&user={user}
                command = `$(customapi ${currentDomain}/api/followage?channel=${login}&user=\${user})`;
                break;
            case 'fossabot':
                command = `$(customapi ${currentDomain}/api/followage?channel=${login}&user=$(user))`;
                break;
            case 'wizebot':
                command = `$(urlfetch ${currentDomain}/api/followage?channel=${login}&user=$(user_name))`;
                break;
            default:
                command = `API URL: ${currentDomain}/api/followage?channel=${login}&user=USERNAME`;
        }

        commandOutput.value = `!addcom !followage ${command}`;
    }
});
