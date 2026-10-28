import { devAccessEnabled, getDevToken, clearDevAccess, resolveDevAccessBase } from '../services/devAccess';
import axios from 'axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { resolveBackendUrl, formatApiError } from './apiContract';
export { formatApiError } from './apiContract';

/* =========================
   BASE URL
========================= */
export const BASE_URL = resolveBackendUrl(import.meta.env);
export const SOCKET_URL = BASE_URL;
export const SOCKET_PROGRESS_ENABLED =
  !devAccessEnabled && import.meta.env.VITE_ENABLE_SOCKET_PROGRESS === 'true';

/* =========================
   WHATSAPP CONFIG (FIXED)
========================= */
export const whatsappApiMode =
  import.meta.env.VITE_WHATSAPP_API_MODE || 'api';

export const whatsappSendPath =
  import.meta.env.VITE_WHATSAPP_SEND_PATH ||
  '/api/communications/whatsapp/send';

/* =========================
   AUTH TOKEN
========================= */
export const getStoredAuthToken = () => {
  const storedAuth = localStorage.getItem('auth-storage');

  if (!storedAuth) return null;

  try {
    const parsed = JSON.parse(storedAuth);
    return parsed?.state?.token || null;
  } catch {
    return null;
  }
};

/* =========================
   ERROR FORMATTER
========================= */
/* =========================
   AXIOS INSTANCE
========================= */
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
  withCredentials: !devAccessEnabled,
});

/* =========================
   REQUEST INTERCEPTOR
========================= */
api.interceptors.request.use(
  (config) => {
    if (devAccessEnabled) {
      const base = resolveDevAccessBase(config.baseURL ?? BASE_URL);
      const target = new URL(config.url, base);
      if (target.origin !== new URL(resolveDevAccessBase(BASE_URL)).origin) throw new Error('Development request origin blocked');
      const devToken = getDevToken();
      if (!devToken) throw new Error('Development access required');
      config.headers['X-Dev-Access-Token'] = devToken;
    }
    const token = getStoredAuthToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    // Handle FormData safely
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    } else {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================
   RESPONSE INTERCEPTOR
========================= */
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error?.response?.status;
    const message = formatApiError(error);

    if (devAccessEnabled && error?.response?.data?.code === 'dev_access_required') {
      clearDevAccess();
      return Promise.reject(new Error('Development session expired. Authenticate again.'));
    }
    if (status === 401) {
      delete api.defaults.headers.common.Authorization;
      localStorage.removeItem('auth-storage');

      if (!['/login', '/register'].includes(window.location.pathname)) {
        window.location.replace('/login');
      }
    } else if (status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (status >= 400) {
      console.error('API Error:', message);
    }

    return Promise.reject(error);
  }
);

/* =========================
   API WRAPPER
========================= */
export const apiWrapper = async ({
  url,
  method = 'GET',
  data,
  params,
  headers = {},
  responseType,
}) => {
  return api({
    url,
    method,
    data,
    params,
    headers,
    responseType,
  });
};

/* =========================
   SOCKET CLIENT
========================= */
let socketInstance = null;

export const getSocketClient = () => {
  if (devAccessEnabled) throw new Error('Sockets blocked by development gateway');
  const token = getStoredAuthToken();

  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      auth: { token },
    });
  } else {
    socketInstance.auth = { token };
  }

  return socketInstance;
};

export default api;
