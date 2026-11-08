import type { NavigateFunction } from 'react-router-dom';

/** Redirect unauthenticated users to /auth and remember where to return. */
export function requireAuth(
  userId: string | null | undefined,
  navigate: NavigateFunction,
  opts?: { returnTo?: string; toast?: (msg: { title: string; description?: string }) => void }
): boolean {
  if (userId && userId !== 'current-user-id') return true;
  const returnTo =
    opts?.returnTo ||
    (typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.search}`
      : '/');
  try {
    sessionStorage.setItem('rhinofit.authReturnTo', returnTo);
  } catch {
    /* ignore */
  }
  opts?.toast?.({
    title: 'Sign in required',
    description: 'Log in to use this feature.',
  });
  navigate('/auth', { state: { from: returnTo } });
  return false;
}

export function consumeAuthReturnTo(): string | null {
  try {
    const v = sessionStorage.getItem('rhinofit.authReturnTo');
    if (v) sessionStorage.removeItem('rhinofit.authReturnTo');
    return v;
  } catch {
    return null;
  }
}
