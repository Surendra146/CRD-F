import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { formatApiError } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    checkAuth();
  }, []);
  
  const checkAuth = async () => {
    try {
      const { data } = await api.get('/api/auth/me');
      setUser(data.user);
    } catch (err) {
      setUser(false);
    } finally {
      setLoading(false);
    }
  };
  
  const register = async (email, password, name, tenantName) => {
    try {
      const { data } = await api.post('/api/auth/register', {
        email,
        password,
        name,
        tenantName
      });
      setUser(data.user);
      setError(null);
      return data;
    } catch (err) {
      const errorMsg = formatApiError(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };
  
  const login = async (email, password) => {
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      setUser(data.user);
      setError(null);
      return data;
    } catch (err) {
      const errorMsg = formatApiError(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };
  
  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
      setUser(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, error, register, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;