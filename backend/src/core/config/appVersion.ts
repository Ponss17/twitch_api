/** npm exposes npm_package_version for scripts; APP_VERSION is the runtime override on Vercel. */
export const APP_VERSION =
    process.env.APP_VERSION || process.env.npm_package_version || '5.0.0';
