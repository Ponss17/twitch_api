import { fetchAdmin, logout, checkAuth } from './auth.js';

interface AdminUser {
    userId: string;
    login: string;
    displayName: string;
    apiKey: string;
    isActive?: boolean;
    blockedReason?: string;
    profileImageUrl?: string;
}

const renderUsers = (users: AdminUser[]) => {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    tbody.innerHTML = users
        .map(
            (user) => `
        <tr class="${user.isActive === false ? 'blocked' : ''}">
            <td>
                <div class="user-info">
                    <img src="${user.profileImageUrl || 'https://static-cdn.jtvnw.net/user-default-pictures-uv/cdd517fe-def4-11e9-948e-784f43822e80-profile_image-70x70.png'}" alt="${user.displayName}" class="avatar">
                    <span>${user.displayName} (${user.login})</span>
                </div>
            </td>
            <td><code>${user.apiKey}</code></td>
            <td>
                <span class="status-badge ${user.isActive !== false ? 'active' : 'inactive'}">
                    ${user.isActive !== false ? 'Activo' : 'Bloqueado'}
                </span>
                ${user.blockedReason ? `<br><small>${user.blockedReason}</small>` : ''}
            </td>
            <td>
                ${
                    user.isActive !== false
                        ? `<button class="btn-block" onclick="window.blockUser('${user.userId}')">Bloquear</button>`
                        : `<button class="btn-unblock" onclick="window.unblockUser('${user.userId}')">Desbloquear</button>`
                }
            </td>
        </tr>
    `
        )
        .join('');
};

const loadUsers = async () => {
    try {
        const res = await fetchAdmin('/api/admin/users');
        if (!res.ok) throw new Error('Failed to load users');
        const users: AdminUser[] = await res.json();
        renderUsers(users);
    } catch (e) {
        console.error(e);
        alert('Error cargando usuarios.');
    }
};

declare global {
    interface Window {
        blockUser: (id: string) => Promise<void>;
        unblockUser: (id: string) => Promise<void>;
        logout: () => void;
    }
}

window.blockUser = async (userId: string) => {
    const reason = prompt('¿Razón del bloqueo?');
    if (reason === null) return;

    try {
        const res = await fetchAdmin(`/api/admin/users/${userId}/status`, {
            method: 'POST',
            body: JSON.stringify({ isActive: false, reason })
        });
        if (res.ok) loadUsers();
        else alert('Error al bloquear usuario');
    } catch (e) {
        console.error(e);
        alert('Error de conexión');
    }
};

window.unblockUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de desbloquear a este usuario?')) return;

    try {
        const res = await fetchAdmin(`/api/admin/users/${userId}/status`, {
            method: 'POST',
            body: JSON.stringify({ isActive: true })
        });
        if (res.ok) loadUsers();
        else alert('Error al desbloquear usuario');
    } catch (e) {
        console.error(e);
        alert('Error de conexión');
    }
};

window.logout = logout;

// Initialize
checkAuth();
loadUsers();
