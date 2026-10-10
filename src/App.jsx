import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';

import { DashboardProvider } from './context/dashboardcontext';
import AppRoutes from './routes/AppRoutes';
import { useAuthStore } from './store/authstore';

function Workspace() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
      },
    },
  }));

  useEffect(() => () => { queryClient.cancelQueries(); queryClient.clear(); }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <DashboardProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </DashboardProvider>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default function App() {
  const { initAuth, user } = useAuthStore();
  useEffect(() => { initAuth(); }, [initAuth]);
  const workspaceKey = user ? `${user.tenant_id || user.tenantId}:${user.organization_id || user.organizationId}:${user.id}` : 'public';
  return <Workspace key={workspaceKey} />;
}
