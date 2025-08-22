
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { UnitType } from './UnitToggleSheet';
import { Platform } from 'react-native';

type UnitsContextType = {
  units: UnitType;
  setUnits: (u: UnitType) => void;
};

const UnitsContext = createContext<UnitsContextType | undefined>(undefined);

export function UnitsProvider({ children }: { children: React.ReactNode }) {
  const [units, setUnits] = useState<UnitType>(() => {
    if (Platform.OS === 'web') {
      const v = localStorage.getItem('units');
      if (v === 'metric' || v === 'imperial') return v;
    }
    return 'metric';
  });

  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem('units', units);
      } catch (e) {
        console.log('Could not persist units', e);
      }
    }
  }, [units]);

  const value = useMemo(() => ({ units, setUnits }), [units]);

  return <UnitsContext.Provider value={value}>{children}</UnitsContext.Provider>;
}

export function useUnits() {
  const ctx = useContext(UnitsContext);
  if (!ctx) throw new Error('useUnits must be used within UnitsProvider');
  return ctx;
}
