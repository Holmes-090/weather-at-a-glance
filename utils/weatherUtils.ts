
export function mapWeatherCodeToIcon(code: number, isNight: boolean): string {
  // Using emoji for crisp, clear icons that work cross-platform without extra assets
  // Open-Meteo weather codes mapping (simplified)
  if (isNight) {
    if ([0].includes(code)) return '🌙';
    if ([1, 2].includes(code)) return '🌙';
    if ([3].includes(code)) return '☁️';
  }
  if ([0].includes(code)) return '☀️';
  if ([1, 2].includes(code)) return '🌤️';
  if ([3].includes(code)) return '☁️';
  if ([45, 48].includes(code)) return '🌫️';
  if ([51, 53, 55, 56, 57].includes(code)) return '🌦️';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '🌧️';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '❄️';
  if ([95, 96, 99].includes(code)) return '⛈️';
  return '🌡️';
}

export function mapWeatherCodeToCondition(code: number, isNight: boolean):
  'sunny' | 'cloudy' | 'rain' | 'snow' | 'clear-night' | 'night' | 'storm' {
  if (isNight && [0, 1, 2].includes(code)) return 'clear-night';
  if ([0, 1, 2].includes(code)) return 'sunny';
  if ([3, 45, 48].includes(code)) return 'cloudy';
  if ([61, 63, 65, 66, 67, 80, 81, 82, 51, 53, 55, 56, 57].includes(code)) return 'rain';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow';
  if ([95, 96, 99].includes(code)) return 'storm';
  return isNight ? 'night' : 'cloudy';
}

export function formatHourLabel(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}${ampm}`;
}

export function formatDayLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short' });
}

export function isNightLocal(now: Date, sunrise: Date, sunset: Date) {
  return now < sunrise || now > sunset;
}

export function analyzePressure(currentPressure?: number, pressureDelta?: number | null) {
  if (!currentPressure) return { trend: 'Unknown', prediction: 'No data available' };

  // Pressure categories (hPa)
  const isLowPressure = currentPressure < 1013;
  const isHighPressure = currentPressure > 1020;
  
  let trend = 'Steady';
  let prediction = 'Stable conditions';
  
  if (pressureDelta !== null && typeof pressureDelta === 'number') {
    const deltaAbs = Math.abs(pressureDelta);
    
    if (deltaAbs >= 3) {
      // Significant pressure change
      if (pressureDelta > 0) {
        trend = 'Rising rapidly';
        prediction = 'Clearing skies, improving weather';
      } else {
        trend = 'Falling rapidly';
        prediction = 'Storm approaching, unsettled weather';
      }
    } else if (deltaAbs >= 1) {
      // Moderate pressure change
      if (pressureDelta > 0) {
        trend = 'Rising';
        prediction = 'Fair weather likely';
      } else {
        trend = 'Falling';
        prediction = 'Clouds and rain possible';
      }
    } else if (deltaAbs >= 0.5) {
      // Slight pressure change
      if (pressureDelta > 0) {
        trend = 'Rising slowly';
        prediction = 'Generally fair conditions';
      } else {
        trend = 'Falling slowly';
        prediction = 'Partly cloudy conditions';
      }
    }
  }
  
  // Override prediction based on current pressure level
  if (isLowPressure && trend.includes('Falling')) {
    prediction = 'Rain likely, stormy conditions';
  } else if (isHighPressure && trend.includes('Rising')) {
    prediction = 'Clear skies, dry conditions';
  }
  
  return { trend, prediction };
}

export function getPressureTrendArrow(pressureDelta?: number | null): string {
  if (!pressureDelta || typeof pressureDelta !== 'number') return '→';
  
  if (Math.abs(pressureDelta) < 0.5) return '→'; // Steady
  return pressureDelta > 0 ? '↗' : '↘'; // Rising or Falling
}

// UV Index utility functions
export function getUVIndexDescription(uvIndex?: number): string {
  if (!uvIndex || uvIndex < 0) return 'Unknown';
  if (uvIndex <= 2) return 'Low';
  if (uvIndex <= 5) return 'Moderate';
  if (uvIndex <= 7) return 'High';
  if (uvIndex <= 10) return 'Very High';
  return 'Extreme';
}

export function formatUVIndex(uvIndex?: number): string {
  if (!uvIndex || uvIndex < 0) return '0 "Unknown"';
  return `${Math.round(uvIndex)} "${getUVIndexDescription(uvIndex)}"`;
}

// Visibility/distance conversion utilities
export function convertVisibility(kmValue: number, isMetric: boolean): string {
  if (isMetric) {
    if (kmValue >= 10) {
      return `${Math.round(kmValue)} km`;
    } else {
      return `${kmValue.toFixed(1)} km`;
    }
  } else {
    const miles = kmValue * 0.621371;
    if (miles >= 10) {
      return `${Math.round(miles)} mi`;
    } else {
      return `${miles.toFixed(1)} mi`;
    }
  }
}

// Dew point utility
export function formatDewPoint(dewPoint?: number, tempUnit?: string): string {
  if (!dewPoint && dewPoint !== 0) return 'N/A';
  return `${Math.round(dewPoint)}${tempUnit || '°C'}`;
}