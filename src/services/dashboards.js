// Preserve legacy imports without sending requests to the removed dashboard API.
const unavailable = async () => {
  throw new Error('Custom dashboard management is unavailable in this version.');
};

export const dashboardsApi = {
  getAll: unavailable,
  getById: unavailable,
  create: unavailable,
  update: unavailable,
  remove: unavailable,
};
