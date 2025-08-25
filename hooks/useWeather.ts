
import { useEffect, useState } from 'react';
import { mapWeatherCodeToIcon, mapWeatherCodeToCondition, formatHourLabel, formatDayLabel, isNightLocal } from '../utils/weatherUtils';
import { WeatherData } from '../types/weather';

export function useWeather(lat: number, lon: number, units: 'metric' | 'imperial') {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        setData(null);

        const tempUnit = units === 'metric' ? 'celsius' : 'fahrenheit';
        const windUnit = units === 'metric' ? 'kmh' : 'mph';
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&hourly=temperature_2m,apparent_temperature,weather_code,precipitation,precipitation_probability,windspeed_10m,winddirection_10m,relative_humidity_2m,surface_pressure,uv_index,dewpoint_2m,visibility,cloudcover` +
          `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant,relative_humidity_2m_mean,uv_index_max` +
          `&current_weather=true&timezone=auto&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&forecast_days=7&past_days=0`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch weather');
        const json = await res.json();

        const tz = json.timezone || 'UTC';

        // Current
        const currentTemp = json.current_weather?.temperature ?? null;
        const currentCode = json.current_weather?.weathercode ?? 0;

        // Is night?
        const nowIso = json.current_weather?.time || json.hourly?.time?.[0];
        const nowDate = new Date(nowIso);
        const sunriseToday = new Date(json.daily.sunrise[0]);
        const sunsetToday = new Date(json.daily.sunset[0]);
        const night = isNightLocal(nowDate, sunriseToday, sunsetToday);

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
        const hourlyUVIndex: number[] = json.hourly.uv_index ?? [];
        const hourlyDewPoint: number[] = json.hourly.dewpoint_2m ?? [];
        const hourlyVisibility: number[] = json.hourly.visibility ?? [];
        const hourlyCloudCover: number[] = json.hourly.cloudcover ?? [];

        const hours = hourlyTimes.map((t, i) => ({
          time: t,
          label: formatHourLabel(t),
          temperature: hourlyTemps[i],
          icon: mapWeatherCodeToIcon(hourlyCodes[i], night),
          precipitationMm: hourlyPrecip[i],
          precipitationProb: hourlyPrecipProb[i],
          windSpeed: hourlyWind[i],
          windDirection: hourlyWindDir[i],
          humidity: hourlyHumidity[i],
          pressure: hourlyPressure[i],
        }));

        // Index for now - need to find the current or next hour
        let nowIndex = hourlyTimes.findIndex((t) => t === nowIso);
        
        // If exact match not found, find the current hour by comparing hour values
        if (nowIndex === -1) {
          const currentTime = new Date(nowIso);
          const currentHour = currentTime.getHours();
          
          nowIndex = hourlyTimes.findIndex((t) => {
            const hourTime = new Date(t);
            return hourTime.getHours() === currentHour && 
                   hourTime.getDate() === currentTime.getDate();
          });
          
          // If still not found, find the next available hour
          if (nowIndex === -1) {
            nowIndex = hourlyTimes.findIndex((t) => {
              const hourTime = new Date(t);
              return hourTime >= currentTime;
            });
          }
        }
        
        // Filter hourly data to start from current hour (no past data)
        const currentHourIndex = Math.max(0, nowIndex);
        const futureHours = hours.slice(currentHourIndex, currentHourIndex + 24);

        // Compute yesterday comparisons
        function deltaFor(arr: number[]): number | null {
          try {
            if (nowIndex >= 24) {
              const yIdx = nowIndex - 24;
              const nowV = arr[nowIndex];
              const yV = arr[yIdx];
              if (typeof nowV === 'number' && typeof yV === 'number') return nowV - yV;
            }
          } catch (e) {
            console.log('Delta compute failed');
          }
          return null;
        }

        const deltaFromYesterday = deltaFor(hourlyTemps);
        const deltaPrecipFromYesterday = deltaFor(hourlyPrecip);
        const deltaWindFromYesterday = deltaFor(hourlyWind);
        const deltaHumidityFromYesterday = deltaFor(hourlyHumidity);
        const deltaPressureFromYesterday = deltaFor(hourlyPressure);

        // Daily mapping
        const dailyDates: string[] = json.daily.time;
        const dailyMax: number[] = json.daily.temperature_2m_max;
        const dailyMin: number[] = json.daily.temperature_2m_min;
        const dailyCodes: number[] = json.daily.weather_code ?? json.daily.weathercode ?? [];
        const dailyPrecipSum: number[] = json.daily.precipitation_sum ?? [];
        const dailyPrecipProbMax: number[] = json.daily.precipitation_probability_max ?? [];
        const dailyWindMax: number[] = json.daily.wind_speed_10m_max ?? [];
        const dailyWindDirDominant: number[] = json.daily.wind_direction_10m_dominant ?? [];
        const dailyHumidityMean: number[] = json.daily.relative_humidity_2m_mean ?? [];
        const dailySunrise: string[] = json.daily.sunrise ?? [];
        const dailySunset: string[] = json.daily.sunset ?? [];

        // Calculate daily pressure averages from hourly data
        const calculateDailyPressureAverage = (dayDate: string): number | undefined => {
          const dayStart = new Date(dayDate);
          const dayEnd = new Date(dayDate);
          dayEnd.setHours(23, 59, 59, 999);
          
          const dayHourlyPressures = hourlyTimes
            .map((time, index) => ({ time: new Date(time), pressure: hourlyPressure[index] }))
            .filter(({ time }) => time >= dayStart && time <= dayEnd)
            .map(({ pressure }) => pressure)
            .filter(p => p && p > 0); // Filter out invalid values
          
          if (dayHourlyPressures.length === 0) return undefined;
          
          const avgPressure = dayHourlyPressures.reduce((sum, p) => sum + p, 0) / dayHourlyPressures.length;
          return avgPressure; // Already in hPa from API
        };

        // Filter daily data to start from today (no past days)
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0); // Start of today
        
        const futureDays = dailyDates
          .map((d: string, i: number) => ({
            date: d,
            label: formatDayLabel(d),
            max: dailyMax[i],
            min: dailyMin[i],
            icon: mapWeatherCodeToIcon(dailyCodes[i], false),
            precipSumMm: dailyPrecipSum[i],
            precipProbMax: dailyPrecipProbMax[i],
            windSpeedMax: dailyWindMax[i],
            windDirectionDominant: dailyWindDirDominant[i],
            humidityMean: dailyHumidityMean[i],
            sunrise: dailySunrise[i],
            sunset: dailySunset[i],
            pressureMean: calculateDailyPressureAverage(d),
            dateObj: new Date(d), // Add for filtering
          }))
          .filter(day => day.dateObj >= todayDate) // Only include today and future days
          .slice(0, 7) // Take up to 7 days
          .map(({ dateObj, ...day }) => day); // Remove helper dateObj

        const daily = futureDays;

        // Use today's data from filtered daily forecasts
        const todayForecast = daily.length > 0 ? daily[0] : null;
        const today = {
          max: todayForecast?.max ?? dailyMax[0],
          min: todayForecast?.min ?? dailyMin[0],
        };

        const condition = mapWeatherCodeToCondition(currentCode, night);

        const out: WeatherData = {
          timezone: tz,
          current: {
            temperature: currentTemp,
            apparentTemperature: nowIndex >= 0 ? hourlyApparentTemps[nowIndex] : hourlyApparentTemps[0],
            code: currentCode,
            icon: mapWeatherCodeToIcon(currentCode, night),
            description: condition.replace('-', ' '),
            isNight: night,
            condition,
            deltaFromYesterday,
            precipitationMm: nowIndex >= 0 ? hourlyPrecip[nowIndex] : hourlyPrecip[0],
            precipitationProb: nowIndex >= 0 ? hourlyPrecipProb[nowIndex] : hourlyPrecipProb[0],
            windSpeed: nowIndex >= 0 ? hourlyWind[nowIndex] : hourlyWind[0],
            windDirection: nowIndex >= 0 ? hourlyWindDir[nowIndex] : hourlyWindDir[0],
            humidity: nowIndex >= 0 ? hourlyHumidity[nowIndex] : hourlyHumidity[0],
            pressure: nowIndex >= 0 ? hourlyPressure[nowIndex] : hourlyPressure[0],
            uvIndex: nowIndex >= 0 ? hourlyUVIndex[nowIndex] : hourlyUVIndex[0],
            dewPoint: nowIndex >= 0 ? hourlyDewPoint[nowIndex] : hourlyDewPoint[0],
            visibility: nowIndex >= 0 ? hourlyVisibility[nowIndex] : hourlyVisibility[0],
            cloudCover: nowIndex >= 0 ? hourlyCloudCover[nowIndex] : hourlyCloudCover[0],
            deltaPrecipFromYesterday,
            deltaWindFromYesterday,
            deltaHumidityFromYesterday,
            deltaPressureFromYesterday,
          },
          hourly: futureHours,
          daily,
          today,
        };

        if (!cancelled) setData(out);
      } catch (e: any) {
        console.log('Weather fetch error', e?.message || e);
        if (!cancelled) setError(e?.message || 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [lat, lon, units]);

  return { data, loading, error };
}
