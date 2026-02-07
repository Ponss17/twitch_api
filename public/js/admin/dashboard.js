import { fetchAdmin, logout, checkAuth } from './auth.js';
const renderUsers = (users) => {
    const tbody = document.getElementById('users-table-body');
    if (!tbody)
        return;
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
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `)
        .join('');
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
        if (users.length === 0) {
            console.warn('No users returned from API');
        }
        renderUsers(users);
        console.log('Users rendered successfully');
    }
    catch (e) {
        console.error('Error in loadUsers:', e);
        alert('Error cargando usuarios. Revisa la consola.');
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
        if (res.ok)
            loadUsers();
        else
            alert('Error al bloquear usuario');
    }
    catch (e) {
        console.error(e);
        alert('Error de conexión');
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
        if (res.ok)
            loadUsers();
        else
            alert('Error al desbloquear usuario');
    }
    catch (e) {
        console.error(e);
        alert('Error de conexión');
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
            alert('Nueva API Key generada.');
            loadUsers();
        }
        else {
            alert('Error al resetear key');
        }
    }
    catch (e) {
        console.error(e);
        alert('Error de conexión');
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
        }
        else {
            alert('Error al eliminar usuario');
        }
    }
    catch (e) {
        console.error(e);
        alert('Error de conexión');
    }
};
window.logout = logout;
// Initialize
// Initialize
console.log('Dashboard script loaded');
checkAuth();
loadUsers();
