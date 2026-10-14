import axios from 'axios';
import { getAccessToken, setAccessToken, clearAccessToken } from './tokenStore';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,   // sends the httpOnly refresh cookie
  timeout: 30000,
});

// --- Request: attach the current access token ------------------------------
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Response: on 401, try /refresh once and replay the original request ---
// Dedupe concurrent refreshes so parallel requests share one refresh call.
let refreshPromise = null;

async function tryRefresh() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${import.meta.env.VITE_API_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      )
      .then((res) => {
        setAccessToken(res.data.accessToken);
        return res.data;
      })
      .catch((err) => {
        clearAccessToken();
        throw err;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    // Never retry the refresh endpoint itself (avoid recursion).
    const isAuthCall = original?.url?.includes('/auth/');
    if (status === 401 && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        const { accessToken } = await tryRefresh();
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        // fall through — user needs to log in again
      }
    }
    return Promise.reject(error);
  },
);
