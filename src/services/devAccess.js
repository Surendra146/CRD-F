// Deliberately volatile: a refresh always requires a new development login.
let token = null;
let timer;
const listeners = new Set();
export const devAccessEnabled = import.meta.env?.VITE_DEV_ACCESS_ENABLED === 'true';
export const getDevToken = () => token;
export const resolveDevAccessBase = (base, origin = globalThis.location?.origin) => new URL(base || '/', origin).href;
export const subscribeDevAccess = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
export function clearDevAccess() {
  token = null;
  clearTimeout(timer);
  listeners.forEach((listener) => listener());
}
export async function loginDevAccess(base, password) {
  const response = await fetch(new URL('/dev-access/login', resolveDevAccessBase(base)), {
    method: 'POST', credentials: 'omit', redirect: 'error',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Development access failed');
  if (!/^[A-Za-z0-9_-]{43}$/.test(data.token) || !(data.expires_in > 0 && data.expires_in <= 900)) {
    throw new Error('Invalid gateway session');
  }
  clearDevAccess();
  token = data.token;
  timer = setTimeout(clearDevAccess, data.expires_in * 1000);
  listeners.forEach((listener) => listener());
}
export async function logoutDevAccess(base) {
  const current = token;
  clearDevAccess();
  if (!current) return;
  const response = await fetch(new URL('/dev-access/logout', resolveDevAccessBase(base)), {
    method: 'POST', credentials: 'omit', redirect: 'error',
    headers: { 'Content-Type': 'application/json', 'X-Dev-Access-Token': current }, body: '{}',
  });
  if (!response.ok) throw new Error('Gateway revocation failed; session expires within 15 minutes.');
}
