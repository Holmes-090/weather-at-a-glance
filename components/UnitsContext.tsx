
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { TemperatureUnit, PressureUnit, UnitsConfig } from '../types/units';
import { Platform } from 'react-native';

// Legacy export for backward compatibility
export type UnitType = TemperatureUnit;

type UnitsContextType = {
  units: UnitsConfig;
  temperatureUnit: TemperatureUnit;
  pressureUnit: PressureUnit;
  setTemperatureUnit: (unit: TemperatureUnit) => void;
  setPressureUnit: (unit: PressureUnit) => void;
  // Legacy support
  setUnits: (u: TemperatureUnit) => void;
};

const UnitsContext = createContext<UnitsContextType | undefined>(undefined);

export function UnitsProvider({ children }: { children: React.ReactNode }) {
  const [temperatureUnit, setTemperatureUnit] = useState<TemperatureUnit>(() => {
    if (Platform.OS === 'web') {
      const v = localStorage.getItem('temperatureUnit');
      if (v === 'metric' || v === 'imperial') return v;
    }
    return 'metric';
  });

  const [pressureUnit, setPressureUnit] = useState<PressureUnit>(() => {
    if (Platform.OS === 'web') {
      const v = localStorage.getItem('pressureUnit');
      if (v === 'hPa' || v === 'inHg' || v === 'kPa') return v;
    }
    return 'hPa';
  });

  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem('temperatureUnit', temperatureUnit);
        localStorage.setItem('pressureUnit', pressureUnit);
      } catch (e) {
        console.log('Could not persist units', e);
      }
    }
  }, [temperatureUnit, pressureUnit]);

  const units: UnitsConfig = useMemo(() => ({
    temperature: temperatureUnit,
    pressure: pressureUnit,
  }), [temperatureUnit, pressureUnit]);

  // Legacy support for existing components
  const setUnits = (u: TemperatureUnit) => setTemperatureUnit(u);

  const value = useMemo(() => ({
    units,
    temperatureUnit,
    pressureUnit,
    setTemperatureUnit,
    setPressureUnit,
    setUnits, // Legacy support
  }), [units, temperatureUnit, pressureUnit]);

  return <UnitsContext.Provider value={value}>{children}</UnitsContext.Provider>;
}

export function useUnits() {
  const ctx = useContext(UnitsContext);
  if (!ctx) throw new Error('useUnits must be used within UnitsProvider');
  return ctx;
}
