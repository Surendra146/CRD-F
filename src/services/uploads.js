import { apiWrapper } from '../config/apiConfig';

const UPLOADS_URL = '/api/uploads';

export const uploadsApi = {
  upload: async (file, type) => {
    if (!file) {
      throw new Error('Please select a file before uploading');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return apiWrapper({
      url: UPLOADS_URL,
      method: 'POST',
      data: formData,
    });
  },

  suggestMappings: async (columns, type) => {
    return apiWrapper({
      url: `${UPLOADS_URL}/suggest-mappings`,
      method: 'POST',
      data: { columns, type },
    });
  },

  getTargetFields: async (type) => {
    return apiWrapper({
      url: `${UPLOADS_URL}/target-fields`,
      method: 'GET',
      params: { type },
    });
  },

  setMapping: async (uploadId, columnMapping) => {
    return apiWrapper({
      url: `${UPLOADS_URL}/${uploadId}/mapping`,
      method: 'PUT',
      data: { columnMapping },
    });
  },

  process: async (uploadId) => {
    return apiWrapper({
      url: `${UPLOADS_URL}/${uploadId}/process`,
      method: 'POST',
    });
  },

  confirmSave: async (uploadId) => {
    return apiWrapper({
      url: `${UPLOADS_URL}/${uploadId}/confirm-save`,
      method: 'POST',
      data: { confirmSave: true },
    });
  },

  getStatus: async (uploadId) => {
    return apiWrapper({
      url: `${UPLOADS_URL}/${uploadId}/status`,
      method: 'GET',
    });
  },

  getHistory: async (params = {}) => {
    return apiWrapper({
      url: `${UPLOADS_URL}/history`,
      method: 'GET',
      params,
    });
  },

  getRecentUploadReport: async (params = {}) => {
    return apiWrapper({
      url: `${UPLOADS_URL}/history/report`,
      method: 'GET',
      params,
    });
  },

  getRecentUploadReportOptions: async () => {
    return apiWrapper({
      url: `${UPLOADS_URL}/history/report/options`,
      method: 'GET',
    });
  },

  exportRecentUploadReportExcel: async (params = {}) => {
    const response = await apiWrapper({
      url: `${UPLOADS_URL}/history/report/export/excel`,
      method: 'GET',
      params,
      responseType: 'blob',
    });

    const blob = new Blob([response], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `recent-upload-report-${Date.now()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  exportRecentUploadReportPdf: async (params = {}) => {
    const response = await apiWrapper({
      url: `${UPLOADS_URL}/history/report/export/pdf`,
      method: 'GET',
      params,
      responseType: 'blob',
    });

    const blob = new Blob([response], { type: 'application/pdf' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `recent-upload-report-${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  exportErrors: async (uploadId) => {
    if (!uploadId) return;

    const response = await apiWrapper({
      url: `${UPLOADS_URL}/${uploadId}/errors/export`,
      method: 'GET',
      responseType: 'blob',
    });

    const blob = new Blob([response], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `import-errors-${uploadId}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};
