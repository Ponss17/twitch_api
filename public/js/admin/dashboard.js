import { fetchAdmin, logout, checkAuth } from './auth.js';
let userChart = null;
// State
let _currentSection = 'overview';
// Navigation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
window.switchSection = (sectionId) => {
    _currentSection = sectionId;
    document.querySelectorAll('.admin-section').forEach((s) => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));
    document.getElementById(`section-${sectionId}`)?.classList.add('active');
    const btn = document.querySelector(`button[onclick*="switchSection('${sectionId}')"]`);
    if (btn)
        btn.classList.add('active');
    const titles = {
        overview: 'Resumen General',
        users: 'Gestión de Usuarios',
        system: 'Salud del Sistema',
        limits: 'Límites & Tráfico',
        logs: 'Logs del Sistema',
        security: 'Seguridad & Admins',
        config: 'Configuración'
    };
    const titleElem = document.getElementById('current-section-title');
    if (titleElem)
        titleElem.textContent = titles[sectionId] || 'Panel Admin';
    if (sectionId === 'overview') {
        loadGlobalStats();
        loadUsers();
    }
    else if (sectionId === 'users') {
        loadUsers();
    }
    else if (sectionId === 'system') {
        loadSystemStatus();
    }
    else if (sectionId === 'config') {
        loadConfig();
    }
    else if (sectionId === 'security') {
        loadAdmins();
    }
    else if (sectionId === 'logs') {
        window.refreshLogs();
    }
};
window.refreshLogs = async () => {
    const list = document.getElementById('logs-list');
    if (!list)
        return;
    try {
        const response = await fetchAdmin('/api/twitch/admin/logs');
        const logs = await response.json();
        if (!logs.length) {
            list.innerHTML = '<div class="loading-cell">No hay logs registrados todavía.</div>';
            return;
        }
        list.innerHTML = logs
            .map(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (log) => `
            <div class="log-item level-${log.level}">
                <span class="log-time">${new Date(log.timestamp).toLocaleTimeString()}</span>
                <span class="log-level ${log.level}">${log.level}</span>
                <span class="log-message">${log.message}${log.details ? ` <small style="opacity:0.5">(${JSON.stringify(log.details)})</small>` : ''}</span>
            </div>
        `)
            .join('');
        list.scrollTop = 0;
    }
    catch (_e) {
        showToast('Error', 'Error al cargar logs', 'error');
    }
};
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
    try {
        const res = await fetchAdmin('/api/twitch/admin/users');
        if (!res.ok)
            throw new Error(`Failed to load users: ${res.status}`);
        const users = await res.json();
        allUsersCache = users;
        renderUsers(users);
        renderChart(users);
    }
    catch (_e) {
        console.error('Error in loadUsers:', _e);
        showToast('Error', 'Error cargando usuarios', 'error');
    }
};
const loadGlobalStats = async () => {
    try {
        const res = await fetchAdmin('/api/twitch/admin/stats/global');
        if (!res.ok)
            throw new Error('Failed to load global stats');
        const stats = await res.json();
        const totalUsersEl = document.getElementById('kpi-total-users');
        const totalReqsEl = document.getElementById('kpi-total-requests');
        const activeUsersEl = document.getElementById('kpi-active-users');
        if (totalUsersEl)
            totalUsersEl.innerText = stats.totalUsers;
        if (totalReqsEl)
            totalReqsEl.innerText = stats.totalRequests;
        if (activeUsersEl)
            activeUsersEl.innerText = stats.activeUsers;
    }
    catch (_e) {
        console.error('Error loadGlobalStats:', _e);
    }
};
const loadSystemStatus = async () => {
    const container = document.getElementById('system-status-container');
    if (!container)
        return;
    try {
        const res = await fetchAdmin('/api/twitch/admin/system/status');
        if (!res.ok)
            throw new Error('Failed to load system status');
        const data = await res.json();
        container.innerHTML = Object.entries(data.services)
            .map(([name, info]) => `
            <div class="status-item">
                <div class="status-info">
                    <div class="status-indicator ${info.status}"></div>
                    <div>
                        <div style="font-weight: 700; text-transform: capitalize;">${name.replace('_', ' ')}</div>
                        <small style="color: var(--text-secondary)">${info.latency || 'vía HTTPS'}</small>
                    </div>
                </div>
                <span class="status-badge ${info.status === 'ok' ? 'active' : 'inactive'}">
                    ${info.status === 'ok' ? 'Online' : info.status === 'maintenance' ? 'Mant.' : 'Error'}
                </span>
            </div>
        `)
            .join('');
    }
    catch (_e) {
        container.innerHTML = `<div class="error-msg" style="display:block">Error cargando estado del sistema</div>`;
    }
};
const loadConfig = async () => {
    const container = document.getElementById('config-list-container');
    if (!container)
        return;
    try {
        const configMock = [
            { key: 'NODE_ENV', value: 'production' },
            { key: 'PORT', value: '3000' },
            { key: 'TWITCH_CLIENT_ID', value: '********' },
            { key: 'GROQ_API_KEY', value: 'Suministrada ✅' },
            { key: 'ADMIN_ENABLED', value: 'true' }
        ];
        container.innerHTML = configMock
            .map((item) => `
            <div class="config-item">
                <span class="config-key">${item.key}</span>
                <span class="config-value">${item.value}</span>
            </div>
        `)
            .join('');
    }
    catch (_e) {
        container.innerHTML = `<div class="error-msg" style="display:block">Error cargando configuración</div>`;
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
    catch (_e) {
        console.error(_e);
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
    catch (_e) {
        console.error(_e);
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
    catch (_e) {
        console.error(_e);
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
            showToast('Éxito', 'Se ha borrado el usuario y sus datos', 'success');
        }
        else {
            showToast('Error', 'No se pudo eliminar al usuario', 'error');
        }
    }
    catch (_e) {
        console.error(_e);
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
    catch (_e) {
        console.error(_e);
        showToast('Error', 'Error de conexión', 'error');
    }
};
window.addAdminPrompt = async () => {
    const userId = prompt('Ingresa el Twitch ID numérico del nuevo administrador:');
    if (!userId)
        return;
    try {
        const res = await fetchAdmin('/api/twitch/admin/admins', {
            method: 'POST',
            body: JSON.stringify({ userId })
        });
        if (res.ok) {
            showToast('Éxito', 'Administrador añadido correctamente', 'success');
            loadAdmins();
        }
        else {
            const err = await res.json();
            showToast('Error', err.error || 'No se pudo añadir al admin', 'error');
        }
    }
    catch (_e) {
        showToast('Error', 'Error de conexión', 'error');
    }
};
window.removeAdmin = async (userId) => {
    if (!confirm('¿Quitar permisos de administrador a este usuario?'))
        return;
    try {
        const res = await fetchAdmin(`/api/twitch/admin/admins/${userId}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            showToast('Éxito', 'Permisos revocados', 'success');
            loadAdmins();
        }
        else {
            const err = await res.json();
            showToast('Error', err.error || 'No se pudo quitar al admin', 'error');
        }
    }
    catch (_e) {
        showToast('Error', 'Error de conexión', 'error');
    }
};
const loadAdmins = async () => {
    const tbody = document.getElementById('admins-table-body');
    if (!tbody)
        return;
    try {
        const res = await fetchAdmin('/api/twitch/admin/admins');
        if (!res.ok)
            throw new Error('Failed to load admins');
        const { admins, rootId } = await res.json();
        if (admins.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: var(--text-muted)">No hay administradores adicionales</td></tr>`;
            return;
        }
        tbody.innerHTML = admins
            .map((admin) => {
                const isRoot = admin.userId === rootId;
                return `
            <tr>
                <td>
                    <div style="font-weight: 600;">${admin.displayName}</div>
                    <small style="color: var(--text-muted)">@${admin.login}</small>
                </td>
                <td><code style="background: #222; padding: 2px 6px; border-radius: 4px;">${admin.userId}</code></td>
                <td>
                    <span class="status-badge ${isRoot ? 'active' : 'warn'}" style="font-size: 11px;">
                        ${isRoot ? 'Root Admin' : 'Admin Delegado'}
                    </span>
                </td>
                <td>
                    ${!isRoot
                        ? `
                        <button class="action-btn delete" onclick="window.removeAdmin('${admin.userId}')" title="Quitar Permisos">
                            <i class="fa-solid fa-user-minus"></i>
                        </button>
                    `
                        : '<small style="color: var(--text-muted)">Protegido</small>'}
                </td>
            </tr>
        `;
            })
            .join('');
    }
    catch (_e) {
        tbody.innerHTML = `<tr><td colspan="4" class="error-msg" style="display:block">Error cargando administradores</td></tr>`;
    }
};
window.logout = logout;
console.log('Dashboard script loaded');
checkAuth();
setupSearch();
window.switchSection('overview');
