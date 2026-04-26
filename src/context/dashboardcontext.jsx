import React, { useState } from 'react';
import { formatApiError } from '../services/api';
import { dashboardsApi } from '../services/dashboards';
import { DashboardContext } from './dashboardContextValue';

export const DashboardProvider = ({ children }) => {
  const [dashboards, setDashboards] = useState([]);
  const [currentDashboard, setCurrentDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchDashboards = async () => {
    setLoading(true);
    try {
      const { data } = await dashboardsApi.getAll();
      setDashboards(data);
      setError(null);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };
  
  const fetchDashboard = async (id) => {
    setLoading(true);
    try {
      const { data } = await dashboardsApi.getById(id);
      setCurrentDashboard(data);
      setError(null);
      return data;
    } catch (err) {
      setError(formatApiError(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const createDashboard = async (dashboardData) => {
    try {
      const { data } = await dashboardsApi.create(dashboardData);
      setDashboards(prev => [data, ...prev]);
      setError(null);
      return data;
    } catch (err) {
      const errorMsg = formatApiError(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };
  
  const updateDashboard = async (id, updates) => {
    try {
      const { data } = await dashboardsApi.update(id, updates);
      setDashboards(prev => prev.map(d => d._id === id ? data : d));
      setCurrentDashboard(data);
      setError(null);
      return data;
    } catch (err) {
      const errorMsg = formatApiError(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };
  
  const deleteDashboard = async (id) => {
    try {
      await dashboardsApi.delete(id);
      setDashboards(prev => prev.filter(d => d._id !== id));
      setError(null);
    } catch (err) {
      const errorMsg = formatApiError(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };
  
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
