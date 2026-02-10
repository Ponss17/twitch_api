import { fetchAdmin, logout, checkAuth } from './auth.js';
let userChart = null;
const renderChart = (users) => {
    const ctx = document.getElementById('usersChart');
    if (!ctx)
        return;
    if (userChart)
        userChart.destroy();
    const labels = users.map((u) => u.displayName);
    const data = users.map((u) => u.totalRequests || 0);
    userChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Requests',
                    data: data,
                    backgroundColor: 'rgba(145, 70, 255, 0.5)',
                    borderColor: 'rgba(145, 70, 255, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#efeff1'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#efeff1'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#efeff1'
                    }
                }
            }
        }
    });
};
const renderUsers = (users) => {
    const tbody = document.getElementById('users-table-body');
    if (!tbody)
        return;
    if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="loading-cell">No se encontraron usuarios.</td></tr>`;
        return;
    }
    tbody.innerHTML = users
        .map((user) => `
        <tr class="${user.isActive === false ? 'blocked' : ''}">
            <td>
                <div class="user-info">
                    <img src="${user.profileImageUrl || 'https://static-cdn.jtvnw.net/user-default-pictures-uv/cdd517fe-def4-11e9-948e-784f43822e80-profile_image-70x70.png'}" alt="${user.displayName}" class="avatar">
                    <div class="details">
                        <span class="name">${user.displayName}</span>
                        <span class="login">(${user.login})</span>
                        <br>
                        <small class="meta">Creado: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Desconocido'}</small>
                    </div>
                </div>
            </td>
            <td>
                <code class="api-key">${user.apiKey}</code>
                <button class="btn-icon" onclick="window.resetKey('${user.userId}')" title="Reset Key">
                    <i class="fa-solid fa-rotate"></i>
                </button>
            </td>
            <td class="stats-cell">
                <div>Reqs: <strong>${user.totalRequests || 0}</strong></div>
                <small>Última vez: ${user.lastActive ? new Date(user.lastActive).toLocaleString() : 'Sin actividad'}</small>
            </td>
            <td>
                <div class="rate-limit-cell">
                    <span class="rate-value">${user.customRateLimit || '120'}</span>
                    <button class="btn-icon-alt" onclick="window.updateRateLimit('${user.userId}', ${user.customRateLimit || 120})" title="Editar Límite">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                </div>
            </td>
            <td>
                <span class="status-badge ${user.isActive !== false ? 'active' : 'inactive'}">
                    ${user.isActive !== false ? 'Activo' : 'Bloqueado'}
                </span>
                ${user.blockedReason ? `<br><small class="reason">${user.blockedReason}</small>` : ''}
            </td>
            <td class="actions-cell">
                ${user.isActive !== false
                ? `<button class="btn-block" onclick="window.blockUser('${user.userId}')">
                               <i class="fa-solid fa-ban"></i> Bloquear
                           </button>`
                : `<button class="btn-unblock" onclick="window.unblockUser('${user.userId}')">
                               <i class="fa-solid fa-check"></i> Desbloquear
                           </button>`}
                <button class="btn-delete" onclick="window.deleteUser('${user.userId}')" title="Eliminar Usuario">
                    <i class="fa-solid fa-trash"></i> Eliminar
                </button>
            </td>
        </tr>
    `)
        .join('');
};
const createToastContainer = () => {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
};
const showToast = (title, message, type = 'info') => {
    const container = createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success'
        ? 'fa-circle-check'
        : type === 'error'
            ? 'fa-circle-exclamation'
            : 'fa-circle-info';
    toast.innerHTML = `
        <i class="fa-solid ${icon} toast-icon"></i>
        <div class="toast-content">
            <span class="toast-title">${title}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;
    container.appendChild(toast);
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
};
let allUsersCache = [];
const setupSearch = () => {
    const searchInput = document.getElementById('user-search');
    if (!searchInput)
        return;
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allUsersCache.filter((user) => user.displayName.toLowerCase().includes(query) ||
            user.login.toLowerCase().includes(query) ||
            user.userId.includes(query));
        renderUsers(filtered);
    });
};
const loadUsers = async () => {
    console.log('Starting loadUsers...');
    try {
        console.log('Fetching users from /api/twitch/admin/users...');
        const res = await fetchAdmin('/api/twitch/admin/users');
        console.log('Fetch response status:', res.status);
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Fetch failed:', errorText);
            throw new Error(`Failed to load users: ${res.status} ${res.statusText}`);
        }
        const users = await res.json();
        console.log('Users/Data loaded:', users);
        allUsersCache = users; // Cache for search
        if (users.length === 0) {
            console.warn('No users returned from API');
            showToast('Aviso', 'No se encontraron usuarios', 'info');
        }
        renderUsers(users);
        renderChart(users);
        console.log('Users rendered successfully');
    }
    catch (e) {
        console.error('Error in loadUsers:', e);
        showToast('Error', 'Error cargando usuarios. Revisa la consola.', 'error');
    }
};
window.blockUser = async (userId) => {
    const reason = prompt('¿Razón del bloqueo?');
    if (reason === null)
        return;
    try {
        const res = await fetchAdmin(`/api/twitch/admin/users/${userId}/status`, {
            method: 'POST',
            body: JSON.stringify({ isActive: false, reason })
        });
        if (res.ok) {
            loadUsers();
            showToast('Éxito', 'Usuario bloqueado correctamente', 'success');
        }
        else {
            showToast('Error', 'No se pudo bloquear al usuario', 'error');
        }
    }
    catch (e) {
        console.error(e);
        showToast('Error', 'Error de conexión', 'error');
    }
};
window.unblockUser = async (userId) => {
    if (!confirm('¿Estás seguro de desbloquear a este usuario?'))
        return;
    try {
        const res = await fetchAdmin(`/api/twitch/admin/users/${userId}/status`, {
            method: 'POST',
            body: JSON.stringify({ isActive: true })
        });
        if (res.ok) {
            loadUsers();
            showToast('Éxito', 'Usuario desbloqueado', 'success');
        }
        else {
            showToast('Error', 'No se pudo desbloquear al usuario', 'error');
        }
    }
    catch (e) {
        console.error(e);
        showToast('Error', 'Error de conexión', 'error');
    }
};
window.resetKey = async (userId) => {
    if (!confirm('¿Generar nueva API Key? La anterior dejará de funcionar.'))
        return;
    try {
        const res = await fetchAdmin(`/api/twitch/admin/users/${userId}/reset-key`, {
            method: 'POST'
        });
        if (res.ok) {
            loadUsers();
            showToast('API Key Generada', 'El usuario tiene una nueva clave', 'success');
        }
        else {
            showToast('Error', 'No se pudo resetear la clave', 'error');
        }
    }
    catch (e) {
        console.error(e);
        showToast('Error', 'Error de conexión', 'error');
    }
};
window.deleteUser = async (userId) => {
    if (!confirm('¿ELIMINAR usuario permanentemente? Esta acción no se puede deshacer.'))
        return;
    try {
        const res = await fetchAdmin(`/api/twitch/admin/users/${userId}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            loadUsers();
            showToast('Usuario Eliminado', 'Se ha borrado el usuario y sus datos', 'success');
        }
        else {
            showToast('Error', 'No se pudo eliminar al usuario', 'error');
        }
    }
    catch (e) {
        console.error(e);
        showToast('Error', 'Error de conexión', 'error');
    }
};
window.updateRateLimit = async (userId, currentLimit) => {
    const input = prompt('Asignar nuevo límite de peticiones (req/min):', currentLimit.toString());
    if (input === null)
        return;
    const limit = parseInt(input);
    if (isNaN(limit) || limit < 0) {
        showToast('Error', 'El límite debe ser un número válido >= 0', 'error');
        return;
    }
    try {
        const res = await fetchAdmin(`/api/twitch/admin/users/${userId}/rate-limit`, {
            method: 'POST',
            body: JSON.stringify({ limit })
        });
        if (res.ok) {
            loadUsers();
            showToast('Éxito', `Límite actualizado a ${limit} req/min`, 'success');
        }
        else {
            const err = await res.json();
            showToast('Error', err.error || 'No se pudo actualizar el límite', 'error');
        }
    }
    catch (e) {
        console.error(e);
        showToast('Error', 'Error de conexión', 'error');
    }
};
window.logout = logout;
console.log('Dashboard script loaded');
checkAuth();
setupSearch();
loadUsers();
