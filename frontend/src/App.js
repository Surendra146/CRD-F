import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardProvider } from './context/DashboardContext';
import { Toaster } from './components/ui/sonner';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardList from './pages/DashboardList';
import DashboardBuilder from './pages/DashboardBuilder';
import ExcelUpload from './pages/ExcelUpload';
import ColumnMapping from './pages/ColumnMapping';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user || user === false) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (user && user !== false) {
    return <Navigate to="/dashboards" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <DashboardProvider>
          <div className="App">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboards" replace />} />
              
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />
              
              <Route
                path="/dashboards"
                element={
                  <ProtectedRoute>
                    <DashboardList />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/dashboards/:id"
                element={
                  <ProtectedRoute>
                    <DashboardBuilder />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/dashboards/:id/upload"
                element={
                  <ProtectedRoute>
                    <ExcelUpload />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/dashboards/:id/map-columns"
                element={
                  <ProtectedRoute>
                    <ColumnMapping />
                  </ProtectedRoute>
                }
              />
            </Routes>
            <Toaster position="top-right" richColors closeButton />
          </div>
        </DashboardProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;