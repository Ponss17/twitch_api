export const ADMIN_AUTH_KEY = 'admin_password';
export const getAdminPassword = () => {
    return sessionStorage.getItem(ADMIN_AUTH_KEY);
};
export const setAdminPassword = (password) => {
    sessionStorage.setItem(ADMIN_AUTH_KEY, password);
};
export const logout = () => {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    window.location.href = '/api/twitch/admin';
};
export const checkAuth = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionToken = urlParams.get('session');
    if (sessionToken) {
        setAdminPassword(sessionToken);
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
    }
    if (!getAdminPassword()) {
        const isLoginPage = window.location.pathname.includes('/admin') &&
            !window.location.pathname.includes('dashboard');
        if (!isLoginPage) {
            window.location.href = '/api/twitch/admin';
        }
    }
    else {
        const dashboard = document.getElementById('dashboard-page');
        if (dashboard)
            dashboard.style.display = 'flex';
        // Si estamos en la página de login pero ya tenemos sesión, ir al dashboard
        if (window.location.pathname.endsWith('/admin')) {
            window.location.href = '/api/twitch/admin-dashboard';
        }
    }
};
export const fetchAdmin = async (url, options = {}) => {
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
