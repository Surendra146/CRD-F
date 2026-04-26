import api, { whatsappSendPath } from './api';

export const communicationsApi = {
  sendWhatsApp: (data) => api.post(whatsappSendPath, data),
};
