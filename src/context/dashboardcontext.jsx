import React, { useCallback, useState } from 'react';
import { formatApiError } from '../services/api';
import { dashboardsApi } from '../services/dashboards';
import { DashboardContext } from './dashboardContextValue';

const extractDashboardList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.dashboards)) return response.dashboards;
  return [];
};

const extractDashboard = (response) => {
  if (!response || typeof response !== 'object') return null;

  if (response._id) return response;
  if (response.data && typeof response.data === 'object') return response.data;
  if (response.dashboard && typeof response.dashboard === 'object') return response.dashboard;

  return null;
};

const sanitizeDashboards = (items) =>
  (Array.isArray(items) ? items : []).filter((item) => item && typeof item === 'object' && item._id);

export const DashboardProvider = ({ children }) => {
  const [dashboards, setDashboards] = useState([]);
  const [currentDashboard, setCurrentDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchDashboards = useCallback(async () => {
    setLoading(true);
    try {
      const response = await dashboardsApi.getAll();
      const data = sanitizeDashboards(extractDashboardList(response));
      setDashboards(data);
      setError(null);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);
  
  const fetchDashboard = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await dashboardsApi.getById(id);
      const data = extractDashboard(response);
      setCurrentDashboard(data);
      setError(null);
      return data;
    } catch (err) {
      setError(formatApiError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const createDashboard = useCallback(async (dashboardData) => {
    try {
      const response = await dashboardsApi.create(dashboardData);
      const data = extractDashboard(response);
      setDashboards((prev) => (data?._id ? [data, ...sanitizeDashboards(prev)] : sanitizeDashboards(prev)));
      setError(null);
      return data;
    } catch (err) {
      const errorMsg = formatApiError(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);
  
  const updateDashboard = useCallback(async (id, updates) => {
    try {
      const response = await dashboardsApi.update(id, updates);
      const data = extractDashboard(response);
      setDashboards((prev) => sanitizeDashboards(prev).map((d) => (d._id === id && data?._id ? data : d)));
      setCurrentDashboard(data);
      setError(null);
      return data;
    } catch (err) {
      const errorMsg = formatApiError(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);
  
  const deleteDashboard = useCallback(async (id) => {
    try {
      await dashboardsApi.delete(id);
      setDashboards((prev) => sanitizeDashboards(prev).filter((d) => d._id !== id));
      setError(null);
    } catch (err) {
      const errorMsg = formatApiError(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);
  
  return (
    <DashboardContext.Provider
      value={{
        dashboards,
        currentDashboard,
        loading,
        error,
        fetchDashboards,
        fetchDashboard,
        createDashboard,
        updateDashboard,
        deleteDashboard,
        setCurrentDashboard
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};
