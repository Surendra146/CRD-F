import api from './api';
import { buildPath } from './resourceApi';

const basePath = '/api/excel';

export const excelApi = {
  upload: ({ file, dashboardId, sourceName, headerRow }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dashboardId', dashboardId);
    formData.append('sourceName', sourceName);
    formData.append('headerRow', headerRow);

    return api.post(buildPath(basePath, 'upload'), formData);
  },

  getByDashboardId: (dashboardId) => api.get(buildPath(basePath, dashboardId)),

  mapColumns: (excelDataId, columnMapping) =>
    api.post(buildPath(basePath, 'map-columns'), {
      excelDataId,
      columnMapping,
    }),
};
