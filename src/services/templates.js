import { apiWrapper } from '../config';

const TEMPLATES_URL = '/api/templates';

export const templatesApi = {
  submit: (id) => apiWrapper({ url: `/api/templates/${id}/submit`, method: 'POST' }),
  refresh: (id) => apiWrapper({ url: `/api/templates/${id}/refresh`, method: 'POST' }),
  upload: (id, file) => { const data = new FormData(); data.append('file', file); return apiWrapper({ url: `/api/templates/${id}/media`, method: 'POST', data }); },
  preview: (id, assetId) => apiWrapper({ url: `/api/templates/${id}/media/${assetId}`, responseType: 'blob' }),
  getAll: async (params = {}) => {
    return apiWrapper({
      url: `${TEMPLATES_URL}/`,
      method: 'GET',
      params,
    });
  },

  getById: async (templateId) => {
    return apiWrapper({
      url: `${TEMPLATES_URL}/${templateId}`,
      method: 'GET',
    });
  },

  create: async (templateData) => {
    return apiWrapper({
      url: `${TEMPLATES_URL}/`,
      method: 'POST',
      data: templateData,
    });
  },

  update: async (templateId, templateData) => {
    return apiWrapper({
      url: `${TEMPLATES_URL}/${templateId}`,
      method: 'PUT',
      data: templateData,
    });
  },

  delete: async (templateId) => {
    return apiWrapper({
      url: `${TEMPLATES_URL}/${templateId}`,
      method: 'DELETE',
    });
  },
};