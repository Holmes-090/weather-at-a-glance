import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocation } from '../components/LocationContext';
import { useUnits } from '../components/UnitsContext';
import { WeatherData } from '../types/weather';
import { mapWeatherCodeToIcon, mapWeatherCodeToCondition, formatHourLabel, formatDayLabel } from '../utils/weatherUtils';

interface WeatherDataContextType {
  weatherData: WeatherData | null;
  loading: boolean;
  error: string | null;
  lastFetchTime: number | null;
  refreshWeather: () => Promise<void>;
  isStale: boolean;
}

const WeatherDataContext = createContext<WeatherDataContextType | undefined>(undefined);

interface CachedWeatherData {
  data: WeatherData;
  timestamp: number;
  location: { lat: number; lon: number };
  units: string;
}

class WeatherCache {
  private static CACHE_KEY = 'weather_cache';
  private static CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  
  static async get(location: { latitude: number; longitude: number }, units: string): Promise<WeatherData | null> {
    try {
      const cached = await this.getFromStorage();
      if (!cached) return null;
      
      // Check if cache is valid
      const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION;
      const isSameLocation = cached.location.lat === location.latitude && 
                           cached.location.lon === location.longitude;
      const isSameUnits = cached.units === units;
      
      if (isExpired || !isSameLocation || !isSameUnits) {
        await this.clear();
        return null;
      }
      
      return cached.data;
    } catch (error) {
      console.log('Cache read error:', error);
      return null;
    }
  }
  
  static async set(data: WeatherData, location: { latitude: number; longitude: number }, units: string): Promise<void> {
    try {
      const cacheData: CachedWeatherData = {
        data,
        timestamp: Date.now(),
        location: { lat: location.latitude, lon: location.longitude },
        units
      };
      
      if (Platform.OS === 'web') {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
      } else {
        await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
      }
    } catch (error) {
      console.log('Cache write error:', error);
    }
  }
  
  static async clear(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(this.CACHE_KEY);
      } else {
        await AsyncStorage.removeItem(this.CACHE_KEY);
      }
    } catch (error) {
      console.log('Cache clear error:', error);
    }
  }
  
  private static async getFromStorage(): Promise<CachedWeatherData | null> {
    try {
      let cached: string | null;
      if (Platform.OS === 'web') {
        cached = localStorage.getItem(this.CACHE_KEY);
      } else {
        cached = await AsyncStorage.getItem(this.CACHE_KEY);
      }
      
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      return null;
    }
  }
}

// Import the existing useWeather logic but extract the fetch function
async function fetchWeatherData(lat: number, lon: number, units: 'metric' | 'imperial'): Promise<WeatherData> {
  const tempUnit = units === 'metric' ? 'celsius' : 'fahrenheit';
  const windUnit = units === 'metric' ? 'kmh' : 'mph';
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,apparent_temperature,weather_code,precipitation,precipitation_probability,windspeed_10m,winddirection_10m,relative_humidity_2m,surface_pressure,uv_index,dewpoint_2m,visibility,cloudcover` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant,relative_humidity_2m_mean,uv_index_max` +
    `&current_weather=true&timezone=auto&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&forecast_days=7&past_days=1`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch weather');
  const json = await res.json();

  // Fetch air quality data
  let airQualityData = null;
  try {
    const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`;
    const airQualityRes = await fetch(airQualityUrl);
    if (airQualityRes.ok) {
      airQualityData = await airQualityRes.json();
    }
  } catch (e) {
    console.log('Failed to fetch air quality data', e);
  }

  const tz = json.timezone || 'UTC';

  // Current
  const currentTemp = json.current_weather?.temperature ?? null;
  const currentCode = json.current_weather?.weathercode ?? 0;

  // Is night? Use proper timezone-aware comparison
  const nowIso = json.current_weather?.time || json.hourly?.time?.[0];
  
  // Parse times - Open-Meteo returns times in local timezone when timezone=auto is used
  const nowDate = new Date(nowIso);
  const sunriseToday = new Date(json.daily.sunrise[0]);
  const sunsetToday = new Date(json.daily.sunset[0]);
  
  // For accurate comparison, use hours and minutes only (ignore date part)
  const nowHour = nowDate.getHours() + nowDate.getMinutes() / 60;
  const sunriseHour = sunriseToday.getHours() + sunriseToday.getMinutes() / 60;
  const sunsetHour = sunsetToday.getHours() + sunsetToday.getMinutes() / 60;
  
  const night = nowHour < sunriseHour || nowHour > sunsetHour;

  // Hourly mapping
  const hourlyTimes: string[] = json.hourly.time;
  const hourlyTemps: number[] = json.hourly.temperature_2m;
  const hourlyApparentTemps: number[] = json.hourly.apparent_temperature ?? [];
  const hourlyCodes: number[] = json.hourly.weather_code ?? json.hourly.weathercode ?? [];
  const hourlyPrecip: number[] = json.hourly.precipitation ?? [];
  const hourlyPrecipProb: number[] = json.hourly.precipitation_probability ?? [];
  const hourlyWind: number[] = json.hourly.windspeed_10m ?? [];
  const hourlyWindDir: number[] = json.hourly.winddirection_10m ?? [];
  const hourlyHumidity: number[] = json.hourly.relative_humidity_2m ?? [];
  const hourlyPressure: number[] = json.hourly.surface_pressure ?? [];
  const hourlyUv: number[] = json.hourly.uv_index ?? [];
  const hourlyDewpoint: number[] = json.hourly.dewpoint_2m ?? [];
  const hourlyVisibility: number[] = json.hourly.visibility ?? [];
  const hourlyCloudcover: number[] = json.hourly.cloudcover ?? [];


  // Process hourly data (next 24 hours from current time)
  // Find the current hour index to start from
  const currentTime = new Date(nowIso);
  
  // More precise approach: find the hour that matches the current hour
  // First, try to find an exact hour match (same hour, same day)
  let currentHourIndex = hourlyTimes.findIndex((time) => {
    const hourTime = new Date(time);
    const currentHour = currentTime.getHours();
    const hourTimeHour = hourTime.getHours();
    const currentDate = currentTime.getDate();
    const hourTimeDate = hourTime.getDate();
    
    // Match same hour and same day
    return hourTimeHour === currentHour && hourTimeDate === currentDate;
  });
  
  // If no exact match, try to find the current hour with a 1-hour tolerance
  if (currentHourIndex === -1) {
    currentHourIndex = hourlyTimes.findIndex((time) => {
      const hourTime = new Date(time);
      const currentHour = currentTime.getHours();
      const hourTimeHour = hourTime.getHours();
      const currentDate = currentTime.getDate();
      const hourTimeDate = hourTime.getDate();
      
      // Match within 1 hour and same day
      return Math.abs(hourTimeHour - currentHour) <= 1 && hourTimeDate === currentDate;
    });
  }
  
  // If no exact match, find the next available hour
  if (currentHourIndex === -1) {
    currentHourIndex = hourlyTimes.findIndex((time) => {
      const hourTime = new Date(time);
      return hourTime >= currentTime;
    });
  }
  
  // If still not found, find any future hour
  if (currentHourIndex === -1) {
    currentHourIndex = hourlyTimes.findIndex((time) => {
      const hourTime = new Date(time);
      return hourTime > currentTime;
    });
  }
  
  // If still not found, start from index 0
  const startIndex = currentHourIndex >= 0 ? currentHourIndex : 0;
  
  console.log('Hourly filtering debug:', {
    currentTime: currentTime.toISOString(),
    currentTimeLocal: currentTime.toLocaleString(),
    currentTimeUTC: currentTime.toUTCString(),
    startIndex,
    firstHour: hourlyTimes[startIndex],
    firstHourTime: new Date(hourlyTimes[startIndex]).toISOString(),
    firstHourLocal: new Date(hourlyTimes[startIndex]).toLocaleString(),
    firstHourUTC: new Date(hourlyTimes[startIndex]).toUTCString(),
    timezone: tz,
    hourlyTimesSample: hourlyTimes.slice(0, 3),
    nowIso: nowIso,
    comparison: {
      currentHour: currentTime.getHours(),
      firstHour: new Date(hourlyTimes[startIndex]).getHours(),
      currentDate: currentTime.getDate(),
      firstDate: new Date(hourlyTimes[startIndex]).getDate()
    }
  });
  
  const futureHours = hourlyTimes.slice(startIndex, startIndex + 24).map((time, i) => ({
    time,
    label: i === 0 ? 'Now' : formatHourLabel(time),
    temperature: hourlyTemps[startIndex + i] ?? 0,
    icon: mapWeatherCodeToIcon(hourlyCodes[startIndex + i] ?? 0, night),
    precipitationMm: hourlyPrecip[startIndex + i] ?? null,
    precipitationProb: hourlyPrecipProb[startIndex + i] ?? null,
    windSpeed: hourlyWind[startIndex + i] ?? null,
    windDirection: hourlyWindDir[startIndex + i] ?? null,
    humidity: hourlyHumidity[startIndex + i] ?? null,
    pressure: hourlyPressure[startIndex + i] ?? null,
  }));

  // Daily mapping
  const dailyTimes: string[] = json.daily.time;
  const dailyCodes: number[] = json.daily.weather_code ?? json.daily.weathercode ?? [];
  const dailyMaxTemps: number[] = json.daily.temperature_2m_max ?? [];
  const dailyMinTemps: number[] = json.daily.temperature_2m_min ?? [];
  const dailySunrise: string[] = json.daily.sunrise ?? [];
  const dailySunset: string[] = json.daily.sunset ?? [];
  const dailyPrecipSum: number[] = json.daily.precipitation_sum ?? [];
  const dailyPrecipProbMax: number[] = json.daily.precipitation_probability_max ?? [];
  const dailyWindMax: number[] = json.daily.wind_speed_10m_max ?? [];
  const dailyWindDir: number[] = json.daily.wind_direction_10m_dominant ?? [];
  const dailyHumidityMean: number[] = json.daily.relative_humidity_2m_mean ?? [];
  const dailyUvMax: number[] = json.daily.uv_index_max ?? [];

  // Filter daily data to start from today (no past days)
  // Use the API's current time to determine what "today" is in the user's timezone
  const apiCurrentTime = new Date(nowIso);
  const todayDate = new Date(apiCurrentTime);
  todayDate.setHours(0, 0, 0, 0); // Start of today in user's timezone
  
  console.log('Date filtering debug:', {
    apiCurrentTime: apiCurrentTime.toISOString(),
    todayDate: todayDate.toISOString(),
    dailyTimes: dailyTimes.slice(0, 3) // Show first 3 days for debugging
  });
  
  const futureDays = dailyTimes
    .map((time, i) => {
      // Calculate daily pressure mean from hourly data
      // Each day has 24 hours, so we need to get the 24 hours for this day
      const dayStartIndex = i * 24;
      const dayEndIndex = dayStartIndex + 24;
      const dayPressures = hourlyPressure.slice(dayStartIndex, dayEndIndex).filter(p => p !== null && p !== undefined);
      const pressureMean = dayPressures.length > 0 ? dayPressures.reduce((sum, p) => sum + p, 0) / dayPressures.length : null;

      return {
        date: time,
        label: formatDayLabel(time),
        max: dailyMaxTemps[i] ?? 0,
        min: dailyMinTemps[i] ?? 0,
        icon: mapWeatherCodeToIcon(dailyCodes[i] ?? 0, false),
        precipSumMm: dailyPrecipSum[i] ?? null,
        precipProbMax: dailyPrecipProbMax[i] ?? null,
        windSpeedMax: dailyWindMax[i] ?? null,
        windDirectionDominant: dailyWindDir[i] ?? null,
        humidityMean: dailyHumidityMean[i] ?? null,
        pressureMean: pressureMean,
        sunrise: dailySunrise[i] ?? null,
        sunset: dailySunset[i] ?? null,
        dateObj: new Date(time), // Add for filtering
      };
    })
    .filter(day => day.dateObj >= todayDate) // Only include today and future days
    .slice(0, 7) // Take up to 7 days
    .map(({ dateObj, ...day }) => day); // Remove helper dateObj

  console.log('Filtered daily data:', futureDays.map(d => ({ date: d.date, label: d.label })));
  const daily = futureDays;

  // Today's data (first day)
  const today = daily[0] ? { max: daily[0].max, min: daily[0].min } : { max: 0, min: 0 };

  // Calculate deltas from yesterday (using past_days=1 data)
  const yesterdayTemp = hourlyTemps[24] ?? null; // 24 hours ago
  const deltaFromYesterday = currentTemp !== null && yesterdayTemp !== null ? currentTemp - yesterdayTemp : null;

  // Calculate other deltas from yesterday
  const yesterdayPrecip = hourlyPrecip[24] ?? null;
  const yesterdayWind = hourlyWind[24] ?? null;
  const yesterdayHumidity = hourlyHumidity[24] ?? null;
  const yesterdayPressure = hourlyPressure[24] ?? null;

  const deltaPrecipFromYesterday = yesterdayPrecip !== null ? (hourlyPrecip[0] ?? 0) - yesterdayPrecip : null;
  const deltaWindFromYesterday = yesterdayWind !== null ? (hourlyWind[0] ?? 0) - yesterdayWind : null;
  const deltaHumidityFromYesterday = yesterdayHumidity !== null ? (hourlyHumidity[0] ?? 0) - yesterdayHumidity : null;
  const deltaPressureFromYesterday = yesterdayPressure !== null ? (hourlyPressure[0] ?? 0) - yesterdayPressure : null;

  const out: WeatherData = {
    timezone: tz,
    current: {
      temperature: currentTemp,
      apparentTemperature: hourlyApparentTemps[0] ?? null,
      code: currentCode,
      icon: mapWeatherCodeToIcon(currentCode, night),
      description: mapWeatherCodeToCondition(currentCode, night),
      isNight: night,
      condition: mapWeatherCodeToCondition(currentCode, night),
      precipitationMm: hourlyPrecip[0] ?? null,
      precipitationProb: hourlyPrecipProb[0] ?? null,
      windSpeed: hourlyWind[0] ?? null,
      windDirection: hourlyWindDir[0] ?? null,
      humidity: hourlyHumidity[0] ?? null,
      pressure: hourlyPressure[0] ?? null,
      uvIndex: hourlyUv[0] ?? null,
      dewPoint: hourlyDewpoint[0] ?? null,
      visibility: hourlyVisibility[0] ?? null,
      cloudCover: hourlyCloudcover[0] ?? null,
      deltaFromYesterday,
      europeanAqi: airQualityData?.current?.european_aqi,
      pm2_5: airQualityData?.current?.pm2_5,
      pm10: airQualityData?.current?.pm10,
      deltaPrecipFromYesterday,
      deltaWindFromYesterday,
      deltaHumidityFromYesterday,
      deltaPressureFromYesterday,
    },
    hourly: futureHours,
    daily,
    today,
  };

  return out;
}

export function WeatherDataProvider({ children }: { children: React.ReactNode }) {
  const { location } = useLocation();
  const { temperatureUnit } = useUnits();
  
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  
  const shouldFetch = useCallback(() => {
    if (!location) return false;
    if (!lastFetchTime) return true;
    return Date.now() - lastFetchTime > WeatherCache.CACHE_DURATION;
  }, [location, lastFetchTime]);
  
  const fetchWeatherDataWithCache = useCallback(async () => {
    if (!location) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Try to get from cache first
      const cachedData = await WeatherCache.get(location, temperatureUnit);
      if (cachedData) {
        setWeatherData(cachedData);
        setLastFetchTime(Date.now());
        setLoading(false);
        return;
      }
      
      // Fetch fresh data
      const freshData = await fetchWeatherData(location.latitude, location.longitude, temperatureUnit);
      
      // Cache the fresh data
      await WeatherCache.set(freshData, location, temperatureUnit);
      
      setWeatherData(freshData);
      setLastFetchTime(Date.now());
    } catch (err: any) {
      console.log('Weather fetch error', err?.message || err);
      setError(err?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [location, temperatureUnit]);
  
  // Auto-fetch when location or units change
  useEffect(() => {
    fetchWeatherDataWithCache();
  }, [fetchWeatherDataWithCache]);
  
  const refreshWeather = useCallback(async () => {
    // Clear cache to force fresh fetch
    await WeatherCache.clear();
    setLastFetchTime(null);
    await fetchWeatherDataWithCache();
  }, [fetchWeatherDataWithCache]);
  
  const isStale = useMemo(() => {
    if (!lastFetchTime) return false;
    return Date.now() - lastFetchTime > WeatherCache.CACHE_DURATION;
  }, [lastFetchTime]);
  
  const value = useMemo(() => ({
    weatherData,
    loading,
    error,
    lastFetchTime,
    refreshWeather,
    isStale,
  }), [weatherData, loading, error, lastFetchTime, refreshWeather, isStale]);
  
  return (
    <WeatherDataContext.Provider value={value}>
      {children}
    </WeatherDataContext.Provider>
  );
}

export function useWeatherData() {
  const context = useContext(WeatherDataContext);
  if (context === undefined) {
    throw new Error('useWeatherData must be used within a WeatherDataProvider');
  }
  return context;
}
