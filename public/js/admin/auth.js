var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// frontend/admin/auth.ts
var ADMIN_AUTH_KEY = "admin_password";
var getAdminPassword = /* @__PURE__ */ __name(() => {
  return sessionStorage.getItem(ADMIN_AUTH_KEY);
}, "getAdminPassword");
var setAdminPassword = /* @__PURE__ */ __name((password) => {
  sessionStorage.setItem(ADMIN_AUTH_KEY, password);
}, "setAdminPassword");
var getApiBase = /* @__PURE__ */ __name(() => {
  const path = window.location.pathname;
  if (path.includes("/admin")) {
    return path.split("/admin")[0];
  }
  return "";
}, "getApiBase");
var logout = /* @__PURE__ */ __name(() => {
  sessionStorage.removeItem(ADMIN_AUTH_KEY);
  window.location.href = `${getApiBase()}/admin`;
}, "logout");
var checkAuth = /* @__PURE__ */ __name(() => {
  const apiBase = getApiBase();
  const urlParams = new URLSearchParams(window.location.search);
  const sessionToken = urlParams.get("session");
  if (sessionToken) {
    setAdminPassword(sessionToken);
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }
  if (!getAdminPassword()) {
    const isLoginPage = window.location.pathname.endsWith("/admin") || window.location.pathname.endsWith("/admin/");
    if (!isLoginPage) {
      window.location.href = `${apiBase}/admin`;
    }
  } else {
    const dashboard = document.getElementById("dashboard-page");
    if (dashboard) dashboard.style.display = "flex";
    if (window.location.pathname.endsWith("/admin") || window.location.pathname.endsWith("/admin/")) {
      window.location.href = `${apiBase}/admin-dashboard`;
    }
  }
}, "checkAuth");
var fetchAdmin = /* @__PURE__ */ __name(async (url, options = {}) => {
  const password = getAdminPassword();
  if (!password) {
    throw new Error("No admin password found");
  }
  const headers = new Headers(options.headers);
  headers.set("x-admin-api-key", password);
  headers.set("Content-Type", "application/json");
  const response = await fetch(url, {
    ...options,
    headers
  });
  if (response.status === 401) {
    console.warn("Admin Unauthorized (401). Logging out...");
    logout();
  }
  return response;
}, "fetchAdmin");
export {
  ADMIN_AUTH_KEY,
  checkAuth,
  fetchAdmin,
  getAdminPassword,
  logout,
  setAdminPassword
};
