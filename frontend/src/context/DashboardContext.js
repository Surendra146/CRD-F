import React, { createContext, useState, useContext } from 'react';
import api, { formatApiError } from '../services/api';

const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  const [dashboards, setDashboards] = useState([]);
  const [currentDashboard, setCurrentDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchDashboards = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/dashboards');
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
      const { data } = await api.get(`/api/dashboards/${id}`);
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
      const { data } = await api.post('/api/dashboards', dashboardData);
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
      const { data } = await api.put(`/api/dashboards/${id}`, updates);
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
      await api.delete(`/api/dashboards/${id}`);
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

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export default DashboardContext;