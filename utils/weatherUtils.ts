
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
