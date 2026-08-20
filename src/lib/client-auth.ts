const TOKEN_KEY = 'oc_token';
const STUDENT_KEY = 'oc_student_id';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
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
