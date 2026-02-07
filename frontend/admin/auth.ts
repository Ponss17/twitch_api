export const ADMIN_AUTH_KEY = 'admin_password';

export const getAdminPassword = (): string | null => {
    return sessionStorage.getItem(ADMIN_AUTH_KEY);
};

export const setAdminPassword = (password: string): void => {
    sessionStorage.setItem(ADMIN_AUTH_KEY, password);
};

export const logout = (): void => {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    window.location.href = '/api/twitch/admin';
};

export const checkAuth = (): void => {
    if (!getAdminPassword()) {
        window.location.href = '/api/twitch/admin';
    } else {
        const dashboard = document.getElementById('dashboard-page');
        if (dashboard) dashboard.style.display = 'flex';
    }
};

export const fetchAdmin = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const password = getAdminPassword();
    if (!password) {
        throw new Error('No admin password found');
    }

    const headers = new Headers(options.headers);
    headers.set('x-admin-password', password);
    headers.set('Content-Type', 'application/json');

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (response.status === 401) {
        logout();
    }

    return response;
};
