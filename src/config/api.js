import axios from 'axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const backendOrigin =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5001';

export const BASE_URL = backendOrigin.replace(/\/$/, '');
export const SOCKET_URL = BASE_URL;

export const whatsappApiMode = import.meta.env.VITE_WHATSAPP_API_MODE || 'api';
export const whatsappSendPath =
  import.meta.env.VITE_WHATSAPP_SEND_PATH || '/api/communications/whatsapp/send';
export const whatsappProvider =
  import.meta.env.VITE_WHATSAPP_PROVIDER || 'meta_cloud';
export const whatsappGraphVersion =
  import.meta.env.VITE_WHATSAPP_GRAPH_VERSION || 'v23.0';
export const whatsappPhoneNumberId =
  import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID || '';

export const formatApiError = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  'An error occurred';

export const getStoredAuthToken = () => {
  const storedAuth = localStorage.getItem('auth-storage');

  if (!storedAuth) return null;

  try {
    const parsed = JSON.parse(storedAuth);
    return parsed?.state?.token || null;
  } catch (error) {
    console.warn('Failed to parse auth storage:', error);
    return null;
  }
};

/* =========================
   BASE AXIOS CONFIG
========================= */
export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* =========================
   REQUEST INTERCEPTOR
========================= */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getStoredAuthToken();

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================
   RESPONSE INTERCEPTOR
========================= */
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = formatApiError(error);

    if (status === 401) {
      delete axiosInstance.defaults.headers.common.Authorization;
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
   RATE LIMIT QUEUE SYSTEM
========================= */
const requestQueue = [];
let activeRequests = 0;

const MAX_CONCURRENT_REQUESTS = 5;
const REQUEST_DELAY_MS = 100;

const processQueue = () => {
  if (!requestQueue.length || activeRequests >= MAX_CONCURRENT_REQUESTS) {
    return;
  }

  const nextRequest = requestQueue.shift();

  if (!nextRequest) return;

  activeRequests += 1;

  nextRequest()
    .finally(() => {
      activeRequests -= 1;

      setTimeout(() => {
        processQueue();
      }, REQUEST_DELAY_MS);
    });
};

const enqueueRequest = (requestFn) =>
  new Promise((resolve, reject) => {
    const queuedRequest = () =>
      requestFn()
        .then(resolve)
        .catch(reject);

    requestQueue.push(queuedRequest);
    processQueue();
  });

/* =========================
   AXIOS WRAPPER
========================= */
export const apiWrapper = async ({
  url,
  method = 'GET',
  data,
  params,
  headers = {},
  responseType,
}) => {
  return enqueueRequest(() =>
    axiosInstance({
      url,
      method,
      data,
      params,
      headers,
      responseType,
    })
  );
};

/* =========================
   FETCH STYLE WRAPPER
========================= */
export const fetchWrapper = async (url, options = {}) => {
  const {
    method = 'GET',
    body,
    headers = {},
    params,
    responseType,
  } = options;

  let parsedBody = body;

  if (body && typeof body === 'string') {
    try {
      parsedBody = JSON.parse(body);
    } catch {
      parsedBody = body;
    }
  }

  const response = await apiWrapper({
    url,
    method,
    data: parsedBody,
    params,
    headers,
    responseType,
  });

  return response.data;
};

/* =========================
   SOCKET CLIENT
========================= */
let socketInstance = null;

export const getSocketClient = () => {
  const token = getStoredAuthToken();

  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket'],
      auth: {
        token,
      },
    });
  } else {
    socketInstance.auth = {
      token,
    };
  }

  return socketInstance;
};

export default axiosInstance;