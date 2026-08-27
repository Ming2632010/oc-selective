const TOKEN_KEY = 'oc_token';
const STUDENT_KEY = 'oc_student_id';
const TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

// The auth token lives in localStorage for client fetches. We also mirror it
// into a cookie so the server-side proxy (src/proxy.ts) can read it to enforce
// authentication and subscription access on navigations.
function setTokenCookie(token: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${TOKEN_MAX_AGE_SECONDS}; samesite=lax`;
}

function clearTokenCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; samesite=lax`;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  setTokenCookie(token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  clearTokenCookie();
}

export function getStudentId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STUDENT_KEY);
}

export function setStudentId(studentId: string) {
  localStorage.setItem(STUDENT_KEY, studentId);
}

export function clearStudentId() {
  localStorage.removeItem(STUDENT_KEY);
}

export function clearSession() {
  clearToken();
  clearStudentId();
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, { ...init, headers });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}
