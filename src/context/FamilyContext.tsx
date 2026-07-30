import React, { createContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { FamilyContextType } from '@/types';

export const FamilyContext = createContext<FamilyContextType | null>(null);

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [activeFamilyId, setActiveFamilyId] = useState<string | null>(null);

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
