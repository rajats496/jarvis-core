/**
 * System context - status, AI/fallback state. Part 5 will consume /system/status.
 */

import { createContext, useContext, useState } from 'react';

const SystemContext = createContext(null);

export function SystemProvider({ children }) {
  const [status, setStatus] = useState(null);
  return (
    <SystemContext.Provider value={{ status, setStatus }}>
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  const ctx = useContext(SystemContext);
  return ctx || { status: null, setStatus: () => {} };
}
