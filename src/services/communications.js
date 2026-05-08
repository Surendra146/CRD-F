import { apiWrapper, whatsappSendPath } from '../config';

export const communicationsApi = {
  sendWhatsApp: async (data) => {
    return apiWrapper({
      url: whatsappSendPath, // already includes /api/...
      method: 'POST',
      data,
    });
  },
};