/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { getCurrentUser, setCurrentUser, getPermissionSummary } from '../data/mockRBAC';

/* eslint-disable no-unused-vars */
type SessionContextValue = {
  currentUser: ReturnType<typeof getCurrentUser>;
  permissionSummary: ReturnType<typeof getPermissionSummary>;
  switchUser: (_userId: string) => void;
};
/* eslint-enable no-unused-vars */

const SessionContext = createContext<SessionContextValue | null>(null);

type SessionProviderProps = {
  children: ReactNode;
};

export const SessionProvider = ({ children }: SessionProviderProps) => {
  const [currentUser, setCurrentUserState] = useState(getCurrentUser());
  const [permissionSummary, setPermissionSummary] = useState(getPermissionSummary(currentUser));

  const switchUser = useCallback((userId: string) => {
    setCurrentUser(userId);
    const updatedUser = getCurrentUser();
    setCurrentUserState(updatedUser);
    setPermissionSummary(getPermissionSummary(updatedUser));
  }, []);

  const value = useMemo(() => ({
    currentUser,
    permissionSummary,
    switchUser
  }), [currentUser, permissionSummary, switchUser]);

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
