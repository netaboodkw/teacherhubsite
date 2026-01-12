import { createContext, useContext, useState, ReactNode } from 'react';

interface DepartmentHeadContextType {
  selectedTeacherId: string | null;
  setSelectedTeacherId: (id: string | null) => void;
}

const DepartmentHeadContext = createContext<DepartmentHeadContextType | undefined>(undefined);

export function DepartmentHeadProvider({ children }: { children: ReactNode }) {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  return (
    <DepartmentHeadContext.Provider value={{ selectedTeacherId, setSelectedTeacherId }}>
      {children}
    </DepartmentHeadContext.Provider>
  );
}

export function useDepartmentHeadContext() {
  const context = useContext(DepartmentHeadContext);
  if (!context) {
    throw new Error('useDepartmentHeadContext must be used within DepartmentHeadProvider');
  }
  return context;
}
