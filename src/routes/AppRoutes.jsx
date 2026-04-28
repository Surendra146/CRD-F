import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import MainLayout from '../components/Layout/mainLayout';
import { ModuleRoute, ProtectedRoute, PublicRoute, RoleRoute } from './RouteGuards';

const Login = lazy(() => import('../Pages/Login'));
const Register = lazy(() => import('../Pages/Register'));
const Dashboard = lazy(() => import('../Pages/CLC/Dashboard'));
const CustomerDetails = lazy(() => import('../Pages/CLC/CustomerDetails'));
const CustomerSales = lazy(() => import('../Pages/CLC/CustomerSales'));
const CustomerCreate = lazy(() => import('../Pages/CLC/CustomerCreate'));
const CustomerDetail = lazy(() => import('../Pages/CLC/CustomerDetail'));
const Analytics = lazy(() => import('../Pages/CLC/Analytics'));
const Import = lazy(() => import('../Pages/CLC/Import'));
const Campaigns = lazy(() => import('../Pages/CLC/Campaigns'));
const WhatsApp = lazy(() => import('../Pages/CLC/WhatsApp'));
const Templates = lazy(() => import('../Pages/CLC/Templates'));
const Settings = lazy(() => import('../Pages/CLC/Settings'));
const Roles = lazy(() => import('../Pages/Roles'));
const Users = lazy(() => import('../Pages/Users'));
const CustomDashboards = lazy(() => import('../Pages/CustomDashboards/Dashboard'));
const CustomDashboardUpload = lazy(() => import('../Pages/CustomDashboards/excelupload'));
const CustomDashboardMapping = lazy(() => import('../Pages/CustomDashboards/ColumnMapping'));
const CustomDashboardBuilder = lazy(() => import('../Pages/CustomDashboards/DashboardBuilder'));

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6">
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-4 text-sm text-gray-600 shadow-sm">
        Loading page...
      </div>
    </div>
  );
}

function PageLoader({ children }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <PageLoader>
              <Login />
            </PageLoader>
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <PageLoader>
              <Register />
            </PageLoader>
          </PublicRoute>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/dashboard"
          element={
            <PageLoader>
              <ModuleRoute moduleKey="dashboard">
                <Dashboard />
              </ModuleRoute>
            </PageLoader>
          }
        />
        <Route
          path="/customers"
          element={<Navigate to="/customers/details" replace />}
        />
        <Route
          path="/customers/details"
          element={
            <PageLoader>
              <ModuleRoute moduleKey="customers">
                <CustomerDetails />
              </ModuleRoute>
            </PageLoader>
          }
        />
        <Route
          path="/customers/sales"
          element={
            <PageLoader>
              <ModuleRoute moduleKey="customers">
                <CustomerSales />
              </ModuleRoute>
            </PageLoader>
          }
        />
        <Route
          path="/customers/new"
          element={
            <PageLoader>
              <ModuleRoute moduleKey="customers">
                <RoleRoute allowedRoles={['manager']}>
                  <CustomerCreate />
                </RoleRoute>
              </ModuleRoute>
            </PageLoader>
          }
        />
        <Route
          path="/customers/:id"
          element={
            <PageLoader>
              <ModuleRoute moduleKey="customers">
                <CustomerDetail />
              </ModuleRoute>
            </PageLoader>
          }
        />
        <Route
          path="/customers/:id/edit"
          element={
            <PageLoader>
              <ModuleRoute moduleKey="customers">
                <RoleRoute allowedRoles={['manager']}>
                  <CustomerCreate />
                </RoleRoute>
              </ModuleRoute>
            </PageLoader>
          }
        />
        <Route
          path="/analytics"
          element={
            <PageLoader>
              <ModuleRoute moduleKey="analytics">
                <Analytics />
              </ModuleRoute>
            </PageLoader>
          }
        />
        <Route
          path="/import"
          element={
            <PageLoader>
              <ModuleRoute moduleKey="import">
                <RoleRoute allowedRoles={['manager']}>
                  <Import />
                </RoleRoute>
              </ModuleRoute>
            </PageLoader>
          }
        />
        <Route
          path="/campaigns"
          element={
            <PageLoader>
              <ModuleRoute moduleKey="campaigns">
                <Campaigns />
              </ModuleRoute>
            </PageLoader>
          }
        />
        <Route
          path="/whatsapp"
          element={
            <PageLoader>
              <ModuleRoute moduleKey="whatsapp">
                <RoleRoute allowedRoles={['analyst']}>
                  <WhatsApp />
                </RoleRoute>
              </ModuleRoute>
            </PageLoader>
          }
        />
        <Route
          path="/templates"
          element={
            <PageLoader>
              <ModuleRoute moduleKey="templates">
                <Templates />
              </ModuleRoute>
            </PageLoader>
          }
        />
        <Route
          path="/settings"
          element={
            <PageLoader>
              <ModuleRoute moduleKey="settings">
                <Settings />
              </ModuleRoute>
            </PageLoader>
          }
        />
        <Route
          path="/roles"
          element={
            <PageLoader>
              <ModuleRoute moduleKey="roles">
                <RoleRoute allowedRoles={['admin']}>
                  <Roles />
                </RoleRoute>
              </ModuleRoute>
            </PageLoader>
          }
        />
        <Route
          path="/users"
          element={
            <PageLoader>
              <ModuleRoute moduleKey="users">
                <RoleRoute allowedRoles={['admin']}>
                  <Users />
                </RoleRoute>
              </ModuleRoute>
            </PageLoader>
          }
        />
        <Route
          path="/dashboards"
          element={
            <PageLoader>
              <ModuleRoute moduleKey="custom-dashboards">
                <CustomDashboards />
              </ModuleRoute>
            </PageLoader>
          }
        />
        <Route
          path="/dashboards/:id/upload"
          element={
            <PageLoader>
              <ModuleRoute moduleKey="custom-dashboards">
                <CustomDashboardUpload />
              </ModuleRoute>
            </PageLoader>
          }
        />
        <Route
          path="/dashboards/:id/map-columns"
          element={
            <PageLoader>
              <ModuleRoute moduleKey="custom-dashboards">
                <CustomDashboardMapping />
              </ModuleRoute>
            </PageLoader>
          }
        />
        <Route
          path="/dashboards/:id"
          element={
            <PageLoader>
              <ModuleRoute moduleKey="custom-dashboards">
                <CustomDashboardBuilder />
              </ModuleRoute>
            </PageLoader>
          }
        />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
