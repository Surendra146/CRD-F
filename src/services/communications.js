import { apiWrapper, whatsappSendPath } from '../config';

const COMMUNICATIONS_URL = '/api/communications';

export const communicationsApi = {
  // Existing single send preserved without modification
  sendWhatsApp: async (data) => {
    return apiWrapper({
      url: whatsappSendPath,
      method: 'POST',
      data,
    });
  },

  // Bulk and scheduled send
  sendBulkWhatsApp: async (data) => {
    return apiWrapper({
      url: `${COMMUNICATIONS_URL}/whatsapp/bulk`,
      method: 'POST',
      data,
    });
  },

  // Bulk jobs management
  getBulkJobs: async (params = {}) => {
    return apiWrapper({
      url: `${COMMUNICATIONS_URL}/whatsapp/bulk`,
      method: 'GET',
      params,
    });
  },

  getBulkJob: async (jobId) => {
    return apiWrapper({
      url: `${COMMUNICATIONS_URL}/whatsapp/bulk/${jobId}`,
      method: 'GET',
    });
  },

  bulkJobAction: async (jobId, action) => {
    return apiWrapper({
      url: `${COMMUNICATIONS_URL}/whatsapp/bulk/${jobId}/action`,
      method: 'POST',
      data: { action },
    });
  },
};