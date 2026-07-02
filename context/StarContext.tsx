import React, { createContext, useState, ReactNode } from 'react';

export interface StarContextType {
  starData: { [key: string]: boolean };
  addStar: (key: string) => void;
}

export const StarContext = createContext<StarContextType | null>(null);

export const StarProvider = ({ children }: { children: ReactNode }) => {
  const [starData, setStarData] = useState<{ [key: string]: boolean }>({});

  const addStar = (key: string) => {
    setStarData((prev) => ({ ...prev, [key]: true }));
  };

  return (
    <StarContext.Provider value={{ starData, addStar }}>
      {children}
    </StarContext.Provider>
  );
};
