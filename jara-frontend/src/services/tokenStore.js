/**
 * Access-token holder. In-memory only (survives navigation, cleared on
 * full page reload). AuthContext sets it after login/refresh; the axios
 * interceptor reads it on every request.
 *
 * Not stored in localStorage: keeps the token out of reach of any XSS
 * payload that reads storage.
 */
let accessToken = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}
