import { apiWrapper } from '../config';

const SEGMENTS_URL = '/api/segments';

export const segmentsApi = {
  getAll: async (params = {}) => {
    return apiWrapper({
      url: SEGMENTS_URL,
      method: 'GET',
      params,
    });
  },

  create: async (segmentData) => {
    return apiWrapper({
      url: SEGMENTS_URL,
      method: 'POST',
      data: segmentData,
    });
  },

  update: async (segmentId, segmentData) => {
    return apiWrapper({
      url: `${SEGMENTS_URL}/${segmentId}`,
      method: 'PUT',
      data: segmentData,
    });
  },

  delete: async (segmentId) => {
    return apiWrapper({
      url: `${SEGMENTS_URL}/${segmentId}`,
      method: 'DELETE',
    });
  },

  downloadImportTemplate: async () => {
    const response = await apiWrapper({
      url: `${SEGMENTS_URL}/import/template`,
      method: 'GET',
      responseType: 'blob',
    });

    const blob = new Blob([response], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'customer-segment-template.xlsx';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  validateImportFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return apiWrapper({
      url: `${SEGMENTS_URL}/import/validate`,
      method: 'POST',
      data: formData,
    });
  },

  saveValidatedRows: async (validRows = []) => {
    return apiWrapper({
      url: `${SEGMENTS_URL}/import/save`,
      method: 'POST',
      data: { validRows },
    });
  },
};
