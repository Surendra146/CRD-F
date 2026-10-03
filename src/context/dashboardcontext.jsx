/* eslint-disable react-refresh/only-export-components -- Legacy context API exports both the provider and its consumer hook. */
import { createContext, useContext, useState } from 'react';

/**
 * DashboardContext
 *
 * Stub context preserved after custom dashboard files were removed.
 * Provides a no-op context so that any remaining consumers continue
 * to work without errors. Business logic is unchanged.
 */
const DashboardContext = createContext({});

export function DashboardProvider({ children }) {
  const [selectedDashboard, setSelectedDashboard] = useState(null);

  return (
    <DashboardContext.Provider value={{ selectedDashboard, setSelectedDashboard }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}

export default DashboardContext;
