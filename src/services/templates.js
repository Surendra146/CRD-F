import { apiWrapper } from '../config';

const TEMPLATES_URL = '/api/templates';

export const templatesApi = {
  getAll: async (params = {}) => {
    return apiWrapper({
      url: TEMPLATES_URL,
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
      url: TEMPLATES_URL,
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