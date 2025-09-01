
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { TemperatureUnit, PressureUnit, UnitsConfig } from '../types/units';

export type TimeFormat = '12h' | '24h';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Legacy export for backward compatibility
export type UnitType = TemperatureUnit;

type UnitsContextType = {
  units: UnitsConfig;
  temperatureUnit: TemperatureUnit;
  pressureUnit: PressureUnit;
  timeFormat: TimeFormat;
  setTemperatureUnit: (unit: TemperatureUnit) => void;
  setPressureUnit: (unit: PressureUnit) => void;
  setTimeFormat: (format: TimeFormat) => void;
  // Legacy support
  setUnits: (u: TemperatureUnit) => void;
};

const UnitsContext = createContext<UnitsContextType | undefined>(undefined);

export function UnitsProvider({ children }: { children: React.ReactNode }) {
  const [temperatureUnit, setTemperatureUnit] = useState<TemperatureUnit>('metric');
  const [pressureUnit, setPressureUnit] = useState<PressureUnit>('hPa');
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('12h');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load initial values from storage
  useEffect(() => {
    async function loadUnits() {
      try {
        if (Platform.OS === 'web') {
          const tempUnit = localStorage.getItem('temperatureUnit');
          const pressUnit = localStorage.getItem('pressureUnit');
          const timeFormatStored = localStorage.getItem('timeFormat');
          if (tempUnit === 'metric' || tempUnit === 'imperial') {
            setTemperatureUnit(tempUnit);
          }
          if (pressUnit === 'hPa' || pressUnit === 'inHg' || pressUnit === 'kPa') {
            setPressureUnit(pressUnit);
          }
          if (timeFormatStored === '12h' || timeFormatStored === '24h') {
            setTimeFormat(timeFormatStored);
          }
        } else {
          // Use AsyncStorage for mobile platforms
          const tempUnit = await AsyncStorage.getItem('temperatureUnit');
          const pressUnit = await AsyncStorage.getItem('pressureUnit');
          const timeFormatStored = await AsyncStorage.getItem('timeFormat');
          if (tempUnit === 'metric' || tempUnit === 'imperial') {
            setTemperatureUnit(tempUnit);
          }
          if (pressUnit === 'hPa' || pressUnit === 'inHg' || pressUnit === 'kPa') {
            setPressureUnit(pressUnit);
          }
          if (timeFormatStored === '12h' || timeFormatStored === '24h') {
            setTimeFormat(timeFormatStored);
          }
        }
      } catch (e) {
        console.log('Could not load units from storage', e);
      } finally {
        setIsLoaded(true);
      }
    }
    loadUnits();
  }, []);

  // Save units to storage when they change
  useEffect(() => {
    if (!isLoaded) return; // Don't save initial default values
    
    async function saveUnits() {
      try {
        if (Platform.OS === 'web') {
          localStorage.setItem('temperatureUnit', temperatureUnit);
          localStorage.setItem('pressureUnit', pressureUnit);
          localStorage.setItem('timeFormat', timeFormat);
        } else {
          // Use AsyncStorage for mobile platforms
          await AsyncStorage.setItem('temperatureUnit', temperatureUnit);
          await AsyncStorage.setItem('pressureUnit', pressureUnit);
          await AsyncStorage.setItem('timeFormat', timeFormat);
        }
      } catch (e) {
        console.log('Could not persist units', e);
      }
    }
    saveUnits();
  }, [temperatureUnit, pressureUnit, timeFormat, isLoaded]);

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
    timeFormat,
    setTemperatureUnit,
    setPressureUnit,
    setTimeFormat,
    setUnits, // Legacy support
  }), [units, temperatureUnit, pressureUnit, timeFormat]);

  return <UnitsContext.Provider value={value}>{children}</UnitsContext.Provider>;
}

export function useUnits() {
  const ctx = useContext(UnitsContext);
  if (!ctx) throw new Error('useUnits must be used within UnitsProvider');
  return ctx;
}
