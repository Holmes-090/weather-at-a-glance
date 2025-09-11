export type TemperatureUnit = 'metric' | 'imperial'; // metric = °C, imperial = °F
export type PressureUnit = 'hPa' | 'inHg' | 'kPa';

export interface UnitsConfig {
  temperature: TemperatureUnit;
  pressure: PressureUnit;
}

// Pressure conversion functions
export const convertPressure = {
  // Convert from hPa to other units
  hPaToInHg: (hPa: number): number => hPa * 0.02953,
  hPaToKPa: (hPa: number): number => hPa / 10,
  
  // Convert to hPa from other units
  inHgToHPa: (inHg: number): number => inHg / 0.02953,
  kPaToHPa: (kPa: number): number => kPa * 10,
};

export const formatPressure = (hPaValue: number, unit: PressureUnit): string => {
  switch (unit) {
    case 'hPa':
      return `${Math.round(hPaValue)} hPa`;
    case 'inHg':
      return `${convertPressure.hPaToInHg(hPaValue).toFixed(2)} inHg`;
    case 'kPa':
      return `${convertPressure.hPaToKPa(hPaValue).toFixed(1)} kPa`;
    default:
      return `${Math.round(hPaValue)} hPa`;
  }
};

export const getPressureUnitSymbol = (unit: PressureUnit): string => {
  switch (unit) {
    case 'hPa':
      return 'hPa';
    case 'inHg':
      return 'inHg';
    case 'kPa':
      return 'kPa';
    default:
      return 'hPa';
  }
};
