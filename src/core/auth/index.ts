export { getSession, saveSession, SESSION_KEY } from './sessionStorage';
export { clearValidateCache } from './validateCache';
export { invalidateSession, initAuthSync } from './sessionLifecycle';
export { mergeSessionFromValidate, resolveDegradedSession } from './sessionMerge';
export { authHeaders, type AuthHeaderOptions } from './authHeaders';
export {
    stripSensitiveQueryParams,
    resolveSessionFromUrl,
    readOptimisticAuthState,
    startTwitchLogin,
    logout
} from './oauthFlow';
export { validateSession } from './validateSession';
export { apiFetch } from './apiFetch';
export { fetchRevealApiKey, type RevealApiKeyResult } from './revealApiKey';
export {
    markDashboardSplashForFreshLogin,
    clearDashboardSplashFlags,
    shouldShowDashboardSplash
} from '@/features/dashboard/lib/splashFlags';
