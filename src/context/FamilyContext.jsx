import React, { createContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export const FamilyContext = createContext();

export function FamilyProvider({ children }) {
  const { currentUser } = useAuth();
  const [activeFamilyId, setActiveFamilyId] = useState(null);

  // Here you would typically fetch families for the user
  useEffect(() => {
    if (currentUser) {
      // Default to some logic
    }
  }, [currentUser]);

  const value = {
    activeFamilyId,
    setActiveFamilyId
  };

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  );
}
