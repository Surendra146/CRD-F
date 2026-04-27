import { BASE_URL, fetchWrapper, whatsappSendPath } from '../config/apiConfig';

export const communicationsApi = {
  sendWhatsApp: async (data) => {
    return fetchWrapper(`${BASE_URL}${whatsappSendPath}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};