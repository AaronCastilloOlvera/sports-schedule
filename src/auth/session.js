// JWT session for the single admin. Stored in localStorage so a reload keeps you signed in;
// the backend's 24h expiry is the real limit.
const TOKEN_KEY = 'auth_token';
export const LOGOUT_EVENT = 'auth-logout';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null; // storage blocked (private mode) — behaves as signed out
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // storage blocked: the session just won't survive a reload
  }
}

/** Drops the token and tells the app to show the login screen. */
export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // nothing stored to remove
  }
  window.dispatchEvent(new Event(LOGOUT_EVENT));
}

/** True when a token exists and its `exp` is still in the future (decoded locally, not verified). */
export function hasValidToken() {
  const token = getToken();
  if (!token) return false;
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(base64 + '='.repeat((4 - base64.length % 4) % 4)));
    return typeof exp === 'number' && exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
