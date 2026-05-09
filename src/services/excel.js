import { apiWrapper } from '../config';

const EXCEL_URL = '/api/excel';

export const excelApi = {
  /* =========================
     FILE UPLOAD (IMPORTANT)
  ========================= */
  upload: async ({ file, dashboardId, sourceName }) => {
    if (!file) {
      throw new Error('Please select a file before uploading');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('dashboardId', dashboardId);
    formData.append('sourceName', sourceName);
    return apiWrapper({
      url: `${EXCEL_URL}/upload`,
      method: 'POST',
      data: formData, // ✅ correct
      // ❌ DO NOT set Content-Type
    });
  },

  /* =========================
     GET DATA
  ========================= */
  getByDashboardId: async (dashboardId) => {
    return apiWrapper({
      url: `${EXCEL_URL}/${dashboardId}`,
      method: 'GET',
    });
  },

  /* =========================
     MAP COLUMNS
  ========================= */
  mapColumns: async (excelDataId, columnMapping) => {
    return apiWrapper({
      url: `${EXCEL_URL}/map-columns`,
      method: 'POST',
      data: {
        excelDataId,
        columnMapping,
      },
    });
  },

  /* =========================
     PROCESS UPLOAD
  ========================= */
  processUpload: async (uploadId) => {
    return apiWrapper({
      url: `${EXCEL_URL}/${uploadId}/process`,
      method: 'POST',
    });
  },

  /* =========================
     STATUS
  ========================= */
  getStatus: async (uploadId) => {
    return apiWrapper({
      url: `${EXCEL_URL}/${uploadId}/status`,
      method: 'GET',
    });
  },

  /* =========================
     HISTORY
  ========================= */
  getHistory: async (params = {}) => {
    return apiWrapper({
      url: `${EXCEL_URL}/history`,
      method: 'GET',
      params,
    });
  },
};
