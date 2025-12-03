// App version for tracking updates and cache busting
export const APP_VERSION = '1.0.0';
export const BUILD_DATE = '2025-12-03';

// Used for PWA cache invalidation
export const getVersionString = () => `v${APP_VERSION} (${BUILD_DATE})`;
