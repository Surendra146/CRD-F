import { apiWrapper } from '../config';

const base = '/api/whatsapp-connection';
export const whatsappConnectionApi = {
  status: () => apiWrapper({ url: `${base}/`, method: 'GET' }),
  start: () => apiWrapper({ url: `${base}/start`, method: 'POST' }),
  exchange: (data) => apiWrapper({ url: `${base}/exchange`, method: 'POST', data }),
  select: (data) => apiWrapper({ url: `${base}/select`, method: 'POST', data }),
  disconnect: () => apiWrapper({ url: `${base}/`, method: 'DELETE' }),
};
