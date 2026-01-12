import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DepartmentHeadContextType {
  selectedTeacherId: string | null;
  setSelectedTeacherId: (id: string | null) => void;
}

const DepartmentHeadContext = createContext<DepartmentHeadContextType | undefined>(undefined);

const STORAGE_KEY = 'department_head_selected_teacher';

export function DepartmentHeadProvider({ children }: { children: ReactNode }) {
  const [selectedTeacherId, setSelectedTeacherIdState] = useState<string | null>(() => {
    // Load from localStorage on initial render
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY);
    }
    return null;
  });

  // Persist to localStorage whenever it changes
  const setSelectedTeacherId = (id: string | null) => {
    setSelectedTeacherIdState(id);
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

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