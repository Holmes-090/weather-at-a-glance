import { useMemo, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../styles/commonStyles';
import SearchBar from '../SearchBar';
import UnitToggleSheet from '../UnitToggleSheet';
import WeatherBackground from './WeatherBackground';
import WeatherAlert from './WeatherAlert';
import { useUnits } from '../UnitsContext';
import { useLocation } from '../LocationContext';
import { useWeather } from '../../hooks/useWeather';
import { useWeatherAlerts } from '../../hooks/useWeatherAlerts';
import { analyzePressure } from '../../utils/weatherUtils';

export default function SummaryTabContent() {
  const { units, setUnits } = useUnits();
  const { location, setLocation } = useLocation();
  const sheetRef = useRef<any>(null);

  const { data, loading, error } = useWeather(location.latitude, location.longitude, units);
  const { alerts, dismissAlert } = useWeatherAlerts(location.latitude, location.longitude);

  if (error) {
    console.log('Weather error', error);
  }

  const descriptionText = useMemo(() => {
    if (!data) return '';
    const d = data.current.description;
    return d.charAt(0).toUpperCase() + d.slice(1);
  }, [data]);

  const tempUnit = units === 'metric' ? '°C' : '°F';
  const windUnit = units === 'metric' ? 'km/h' : 'mph';

  // Pressure analysis
  const pressureAnalysis = useMemo(() => {
    if (!data?.current.pressure) return null;
    return analyzePressure(data.current.pressure, data.current.deltaPressureFromYesterday);
  }, [data]);

  // Weather comparisons to yesterday
  const weatherComparisons = useMemo(() => {
    if (!data) return [];
    
    const comparisons = [];
    
    // Temperature comparison
    if (data.current.deltaFromYesterday !== null && typeof data.current.deltaFromYesterday === 'number') {
      const diff = Math.round(data.current.deltaFromYesterday);
      const abs = Math.abs(diff);
      if (abs === 0) {
        comparisons.push({ type: 'Temperature', text: 'Same as yesterday', icon: '🌡️' });
      } else {
        comparisons.push({
          type: 'Temperature',
          text: `${abs}° ${diff > 0 ? 'warmer' : 'colder'} than yesterday`,
          icon: diff > 0 ? '📈' : '📉'
        });
      }
    }

    // Precipitation comparison
    if (data.current.deltaPrecipFromYesterday !== null && typeof data.current.deltaPrecipFromYesterday === 'number') {
      const diff = data.current.deltaPrecipFromYesterday;
      const abs = Math.abs(diff);
      if (abs < 0.1) {
        comparisons.push({ type: 'Precipitation', text: 'Similar to yesterday', icon: '🌧️' });
      } else {
        comparisons.push({
          type: 'Precipitation',
          text: `${abs.toFixed(1)}mm ${diff > 0 ? 'more' : 'less'} than yesterday`,
          icon: diff > 0 ? '☔' : '🌤️'
        });
      }
    }

    // Wind comparison
    if (data.current.deltaWindFromYesterday !== null && typeof data.current.deltaWindFromYesterday === 'number') {
      const diff = Math.round(data.current.deltaWindFromYesterday);
      const abs = Math.abs(diff);
      if (abs < 2) {
        comparisons.push({ type: 'Wind', text: 'Similar to yesterday', icon: '💨' });
      } else {
        comparisons.push({
          type: 'Wind',
          text: `${abs}${windUnit} ${diff > 0 ? 'windier' : 'calmer'} than yesterday`,
          icon: diff > 0 ? '💨' : '🍃'
        });
      }
    }

    // Humidity comparison
    if (data.current.deltaHumidityFromYesterday !== null && typeof data.current.deltaHumidityFromYesterday === 'number') {
      const diff = Math.round(data.current.deltaHumidityFromYesterday);
      const abs = Math.abs(diff);
      if (abs < 3) {
        comparisons.push({ type: 'Humidity', text: 'Similar to yesterday', icon: '💧' });
      } else {
        comparisons.push({
          type: 'Humidity',
          text: `${abs}% ${diff > 0 ? 'more humid' : 'drier'} than yesterday`,
          icon: diff > 0 ? '💧' : '🏜️'
        });
      }
    }

    // Pressure comparison
    if (data.current.deltaPressureFromYesterday !== null && typeof data.current.deltaPressureFromYesterday === 'number') {
      const diff = data.current.deltaPressureFromYesterday;
      const abs = Math.abs(diff);
      if (abs < 1) {
        comparisons.push({ type: 'Pressure', text: 'Similar to yesterday', icon: '🌡️' });
      } else {
        comparisons.push({
          type: 'Pressure',
          text: `${abs.toFixed(1)} hPa ${diff > 0 ? 'higher' : 'lower'} than yesterday`,
          icon: diff > 0 ? '📈' : '📉'
        });
      }
    }

    return comparisons;
  }, [data, tempUnit, windUnit]);

  const onCitySelected = (city: { name: string; latitude: number; longitude: number; country?: string }) => {
    setLocation(city);
  };

  return (
    <View style={{ flex: 1 }}>
      <WeatherBackground
        condition={data?.current.condition || 'cloudy'}
        isNight={data?.current.isNight || false}
      />
      <ScrollView contentContainerStyle={[styles.container]} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <SearchBar
            placeholder="Search city"
            onSelectCity={onCitySelected}
            onOptionsPress={() => sheetRef.current?.expand?.()}
          />
        </View>

        {/* Weather Alerts */}
        {alerts.length > 0 && (
          <View style={styles.alertsContainer}>
            {alerts.map((alert) => (
              <WeatherAlert
                key={alert.id}
                alert={alert}
                onDismiss={dismissAlert}
              />
            ))}
          </View>
        )}

        {/* Current Weather Summary Card */}
        <View style={styles.currentCard}>
          <Text style={styles.cityName}>
            {location.name}{location.country ? `, ${location.country}` : ''}
          </Text>
          {loading ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : data ? (
            <>
              <View style={styles.iconAndDesc}>
                <Text style={styles.bigIcon}>{data.current.icon}</Text>
                <Text style={styles.description}>{descriptionText}</Text>
              </View>

              <Text style={styles.currentMain}>
                {Math.round(data.current.temperature)}{tempUnit}
              </Text>
              <Text style={styles.hilo}>
                H {Math.round(data.today.max)}{tempUnit}   L {Math.round(data.today.min)}{tempUnit}
              </Text>
            </>
          ) : null}
        </View>

        {data && (
          <>
            {/* Quick Stats Grid */}
            <View style={styles.quickStatsContainer}>
              <Text style={styles.sectionTitle}>Current Conditions</Text>
              <View style={styles.quickStatsGrid}>
                <View style={styles.quickStatCard}>
                  <Text style={styles.quickStatIcon}>🌡️</Text>
                  <Text style={styles.quickStatValue}>
                    {Math.round(data.current.temperature)}{tempUnit}
                  </Text>
                  <Text style={styles.quickStatLabel}>Temperature</Text>
                  {data.current.apparentTemperature && (
                    <Text style={styles.quickStatFeelsLike}>
                      Feels like {Math.round(data.current.apparentTemperature)}{tempUnit}
                    </Text>
                  )}
                </View>

                <View style={styles.quickStatCard}>
                  <Text style={styles.quickStatIcon}>🌧️</Text>
                  <Text style={styles.quickStatValue}>
                    {(data.current.precipitationMm ?? 0).toFixed(1)}mm
                  </Text>
                  <Text style={styles.quickStatLabel}>Precipitation</Text>
                </View>

                <View style={styles.quickStatCard}>
                  <Text style={styles.quickStatIcon}>💨</Text>
                  <Text style={styles.quickStatValue}>
                    {Math.round(data.current.windSpeed ?? 0)}{windUnit}
                  </Text>
                  <Text style={styles.quickStatLabel}>Wind</Text>
                </View>

                <View style={styles.quickStatCard}>
                  <Text style={styles.quickStatIcon}>💧</Text>
                  <Text style={styles.quickStatValue}>
                    {Math.round(data.current.humidity ?? 0)}%
                  </Text>
                  <Text style={styles.quickStatLabel}>Humidity</Text>
                </View>

                <View style={styles.quickStatCard}>
                  <Text style={styles.quickStatIcon}>🌡️</Text>
                  <Text style={styles.quickStatValue}>
                    {Math.round(data.current.pressure ?? 0)} hPa
                  </Text>
                  <Text style={styles.quickStatLabel}>Pressure</Text>
                  {pressureAnalysis && (
                    <Text style={styles.quickStatFeelsLike}>
                      {pressureAnalysis.prediction}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Weather Highlights */}
            <View style={styles.highlightsContainer}>
              <Text style={styles.sectionTitle}>Today's Highlights</Text>
              
              <View style={styles.highlightCard}>
                <View style={styles.highlightRow}>
                  <Text style={styles.highlightIcon}>☀️</Text>
                  <View style={styles.highlightContent}>
                    <Text style={styles.highlightTitle}>Sunrise & Sunset</Text>
                    <Text style={styles.highlightValue}>
                      {data.daily[0]?.sunrise ? new Date(data.daily[0].sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'} - {data.daily[0]?.sunset ? new Date(data.daily[0].sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.highlightCard}>
                <View style={styles.highlightRow}>
                  <Text style={styles.highlightIcon}>🌊</Text>
                  <View style={styles.highlightContent}>
                    <Text style={styles.highlightTitle}>Precipitation Chance</Text>
                    <Text style={styles.highlightValue}>
                      {Math.round(data.current.precipitationProb ?? 0)}% chance
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.highlightCard}>
                <View style={styles.highlightRow}>
                  <Text style={styles.highlightIcon}>🧭</Text>
                  <View style={styles.highlightContent}>
                    <Text style={styles.highlightTitle}>Wind Speed</Text>
                    <Text style={styles.highlightValue}>
                      {degToCompass(data.current.windDirection)} ({Math.round(data.current.windSpeed ?? 0)}{windUnit})
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Comparison to Yesterday */}
            {weatherComparisons.length > 0 && (
              <View style={styles.comparisonContainer}>
                <Text style={styles.sectionTitle}>Compared to Yesterday</Text>
                {weatherComparisons.map((comparison, index) => (
                  <View key={index} style={styles.comparisonCard}>
                    <Text style={styles.comparisonIcon}>{comparison.icon}</Text>
                    <View style={styles.comparisonContent}>
                      <Text style={styles.comparisonType}>{comparison.type}</Text>
                      <Text style={styles.comparisonText}>{comparison.text}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 7-Day Forecast Preview */}
            <View style={styles.forecastContainer}>
              <Text style={styles.sectionTitle}>7-Day Forecast</Text>
              {data.daily.slice(0, 7).map((day, index) => (
                <View key={index} style={styles.forecastRow}>
                  <Text style={styles.forecastDay}>
                    {index === 0 ? 'Today' : new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                  </Text>
                  <Text style={styles.forecastIcon}>{day.icon}</Text>
                  <View style={styles.forecastTemps}>
                    <Text style={styles.forecastHigh}>{Math.round(day.max)}{tempUnit}</Text>
                    <Text style={styles.forecastLow}>{Math.round(day.min)}{tempUnit}</Text>
                  </View>
                  <View style={styles.forecastPrecipContainer}>
                    <Text style={styles.forecastPrecip}>
                      {Math.round(day.precipProbMax ?? 0)}%
                    </Text>
                    <Text style={styles.forecastPrecipLabel}>rain</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      <UnitToggleSheet ref={sheetRef} value={units} onChange={(u) => setUnits(u)} />
    </View>
  );
}

function degToCompass(deg?: number) {
  if (typeof deg !== 'number') return '';
  const val = Math.floor((deg / 22.5) + 0.5);
  const arr = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return arr[val % 16];
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
  },
  topRow: {
    width: '100%',
  },
  alertsContainer: {
    marginTop: 4,
  },
  currentCard: {
    backgroundColor: 'rgba(16, 24, 36, 0.35)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    boxShadow: '0px 6px 16px rgba(0,0,0,0.25)',
  },
  cityName: {
    fontSize: 20,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  iconAndDesc: {
    alignItems: 'center',
    marginTop: 6,
  },
  bigIcon: {
    fontSize: 60,
    textAlign: 'center',
    color: colors.text,
  } as any,
  description: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.9,
    marginTop: 4,
  },
  currentMain: {
    fontSize: 64,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '800',
    marginTop: 4,
  },
  hilo: {
    textAlign: 'center',
    color: colors.text,
    fontSize: 16,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  quickStatsContainer: {
    marginTop: 16,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickStatCard: {
    backgroundColor: 'rgba(16, 24, 36, 0.35)',
    borderRadius: 12,
    padding: 12,
    width: '48%',
    marginBottom: 8,
    alignItems: 'center',
  },
  quickStatIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  quickStatLabel: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.8,
    marginTop: 2,
  },
  quickStatFeelsLike: {
    fontSize: 10,
    color: colors.text,
    opacity: 0.7,
    marginTop: 2,
    textAlign: 'center',
  },
  highlightsContainer: {
    marginTop: 16,
  },
  highlightCard: {
    backgroundColor: 'rgba(16, 24, 36, 0.35)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  highlightIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  highlightContent: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  highlightValue: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.9,
    marginTop: 2,
  },
  comparisonContainer: {
    marginTop: 16,
  },
  comparisonCard: {
    backgroundColor: 'rgba(16, 24, 36, 0.35)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  comparisonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  comparisonContent: {
    flex: 1,
  },
  comparisonType: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  comparisonText: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.9,
    marginTop: 2,
  },
  forecastContainer: {
    marginTop: 16,
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 24, 36, 0.35)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
  },
  forecastDay: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    width: 60,
  },
  forecastIcon: {
    fontSize: 20,
    marginHorizontal: 12,
  },
  forecastTemps: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  forecastHigh: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  forecastLow: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
  },
  forecastPrecipContainer: {
    width: 40,
    alignItems: 'flex-end',
  },
  forecastPrecip: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.8,
    textAlign: 'right',
  },
  forecastPrecipLabel: {
    fontSize: 10,
    color: colors.text,
    opacity: 0.6,
    textAlign: 'right',
  },
});
