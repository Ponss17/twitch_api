export const ADMIN_AUTH_KEY = 'admin_password';

export const getAdminPassword = (): string | null => {
    return sessionStorage.getItem(ADMIN_AUTH_KEY);
};

export const setAdminPassword = (password: string): void => {
    sessionStorage.setItem(ADMIN_AUTH_KEY, password);
};

const getApiBase = (): string => {
    const path = window.location.pathname;
    if (path.includes('/admin')) {
        return path.split('/admin')[0];
    }
    return '';
};

export const logout = (): void => {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    window.location.href = `${getApiBase()}/admin`;
};

export const checkAuth = (): void => {
    const apiBase = getApiBase();
    const urlParams = new URLSearchParams(window.location.search);
    const sessionToken = urlParams.get('session');

    if (sessionToken) {
        setAdminPassword(sessionToken);
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
    }

    if (!getAdminPassword()) {
        const isLoginPage =
            window.location.pathname.endsWith('/admin') ||
            window.location.pathname.endsWith('/admin/');
        if (!isLoginPage) {
            window.location.href = `${apiBase}/admin`;
        }
    } else {
        const dashboard = document.getElementById('dashboard-page');
        if (dashboard) dashboard.style.display = 'flex';

        if (
            window.location.pathname.endsWith('/admin') ||
            window.location.pathname.endsWith('/admin/')
        ) {
            window.location.href = `${apiBase}/admin-dashboard`;
        }
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
