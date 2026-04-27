import { BASE_URL, fetchWrapper } from '../config/apiConfig';

const EXCEL_URL = `${BASE_URL}/api/excel`;

export const excelApi = {
  /* =========================
     FILE UPLOAD (IMPORTANT)
  ========================= */
  upload: async ({ file, dashboardId, sourceName, headerRow }) => {
    const formData = new FormData();

    formData.append('file', file);
    formData.append('dashboardId', dashboardId);
    formData.append('sourceName', sourceName);
    formData.append('headerRow', headerRow);

    return fetchWrapper(`${EXCEL_URL}/upload`, {
      method: 'POST',
      body: formData, // ✅ DO NOT stringify
      headers: {
        'Content-Type': 'multipart/form-data', // axios handles boundary
      },
    });
  },

  /* =========================
     GET DATA
  ========================= */
  getByDashboardId: async (dashboardId) => {
    return fetchWrapper(`${EXCEL_URL}/${dashboardId}`, {
      method: 'GET',
    });
  },

  /* =========================
     MAP COLUMNS
  ========================= */
  mapColumns: async (excelDataId, columnMapping) => {
    return fetchWrapper(`${EXCEL_URL}/map-columns`, {
      method: 'POST',
      body: JSON.stringify({
        excelDataId,
        columnMapping,
      }),
    });
  },

  /* =========================
     PROCESS UPLOAD (IMPORTANT for your flow)
  ========================= */
  processUpload: async (uploadId) => {
    return fetchWrapper(`${EXCEL_URL}/${uploadId}/process`, {
      method: 'POST',
    });
  },

  /* =========================
     STATUS (REAL-TIME POLLING)
  ========================= */
  getStatus: async (uploadId) => {
    return fetchWrapper(`${EXCEL_URL}/${uploadId}/status`, {
      method: 'GET',
    });
  },

  /* =========================
     HISTORY
  ========================= */
  getHistory: async () => {
    return fetchWrapper(`${EXCEL_URL}/history`, {
      method: 'GET',
    });
  },
};