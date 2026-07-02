import React, { createContext, useState, ReactNode } from 'react';

export interface ClearContextType {
  clearData: { [key: string]: boolean };
  markAsCleared: (key: string) => void;
}

export const ClearContext = createContext<ClearContextType | null>(null);

export const ClearProvider = ({ children }: { children: ReactNode }) => {
  const [clearData, setClearData] = useState<{ [key: string]: boolean }>({});

  const markAsCleared = (key: string) => {
    setClearData((prev) => ({ ...prev, [key]: true }));
  };

  return (
    <ClearContext.Provider value={{ clearData, markAsCleared }}>
      {children}
    </ClearContext.Provider>
  );
};
