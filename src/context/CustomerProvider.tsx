/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { getCurrentEndCustomer, setCurrentEndCustomer, MOCK_END_CUSTOMERS } from '../data/mockRBAC';

/* eslint-disable no-unused-vars */
type CustomerContextValue = {
  currentCustomer: ReturnType<typeof getCurrentEndCustomer>;
  switchCustomer: (_customerId: string) => void;
  allCustomers: typeof MOCK_END_CUSTOMERS;
};
/* eslint-enable no-unused-vars */

const CustomerContext = createContext<CustomerContextValue | null>(null);

type CustomerProviderProps = {
  children: ReactNode;
};

export const CustomerProvider = ({ children }: CustomerProviderProps) => {
  const [currentCustomer, setCurrentCustomerState] = useState(getCurrentEndCustomer());

  const switchCustomer = useCallback((customerId: string) => {
    setCurrentEndCustomer(customerId);
    const updatedCustomer = getCurrentEndCustomer();
    setCurrentCustomerState(updatedCustomer);
  }, []);

  const value = useMemo(() => ({
    currentCustomer,
    switchCustomer,
    allCustomers: MOCK_END_CUSTOMERS
  }), [currentCustomer, switchCustomer]);

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};
