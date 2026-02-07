export const ADMIN_AUTH_KEY = 'admin_password';
export const getAdminPassword = () => {
    return sessionStorage.getItem(ADMIN_AUTH_KEY);
};
export const setAdminPassword = (password) => {
    sessionStorage.setItem(ADMIN_AUTH_KEY, password);
};
export const logout = () => {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    window.location.href = '/admin'; // This matches the route defined in app.ts
};
export const checkAuth = () => {
    if (!getAdminPassword()) {
        window.location.href = '/admin';
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
