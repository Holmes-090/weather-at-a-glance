
export interface HourForecast {
  time: string;
  label: string;
  temperature: number;
  icon: string; // Using emoji for clear, clean icon
  precipitationMm?: number;
  precipitationProb?: number; // percentage 0-100
  windSpeed?: number; // in chosen unit (km/h or mph)
  windDirection?: number; // degrees
  humidity?: number; // percentage
  pressure?: number; // hPa (hectopascals)
}

export interface DayForecast {
  date: string;
  label: string;
  max: number;
  min: number;
  icon: string;
  precipSumMm?: number;
  precipProbMax?: number;
  windSpeedMax?: number;
  windDirectionDominant?: number;
  humidityMean?: number;
  sunrise?: string;
  sunset?: string;
  pressureMean?: number;
}

export interface WeatherData {
  timezone: string;
  current: {
    temperature: number;
    apparentTemperature?: number;
    code: number;
    icon: string;
    description: string;
    isNight: boolean;
    condition: 'sunny' | 'cloudy' | 'rain' | 'snow' | 'clear-night' | 'night' | 'storm';
    deltaFromYesterday: number | null;
    precipitationMm?: number;
    precipitationProb?: number;
    windSpeed?: number;
    windDirection?: number;
    humidity?: number;
    pressure?: number;
    deltaPrecipFromYesterday?: number | null;
    deltaWindFromYesterday?: number | null;
    deltaHumidityFromYesterday?: number | null;
    deltaPressureFromYesterday?: number | null;
  };
  hourly: HourForecast[];
  daily: DayForecast[];
  today: {
    max: number;
    min: number;
  };
}
