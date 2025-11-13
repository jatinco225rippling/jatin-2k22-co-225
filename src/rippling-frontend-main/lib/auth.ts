export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('boostly_token');
}
