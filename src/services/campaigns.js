import api from './api';
import { buildPath, createResourceApi } from './resourceApi';

const basePath = '/api/campaigns';

export const campaignsApi = createResourceApi(basePath, {
  launch: (id) => api.post(buildPath(basePath, id, 'launch')),
  pause: (id) => api.post(buildPath(basePath, id, 'pause')),
});
