import React, { useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, RefreshControl, TouchableOpacity } from 'react-native';
import { colors } from '../../styles/commonStyles';
import SearchBar from '../SearchBar';
import UnitToggleSheet from '../UnitToggleSheet';
import WeatherBackground from './WeatherBackground';
import HourlyStrip from './HourlyStrip';
import DailyStrip from './DailyStrip';
import WeatherAlert from './WeatherAlert';
import { useUnits } from '../..//components/UnitsContext';
import { useLocation } from '../..//components/LocationContext';
import { useWeather } from '../../hooks/useWeather';
import { useWeatherAlerts } from '../../hooks/useWeatherAlerts';
import { analyzePressure, getPressureTrendArrow, calculateHourlyPressureTrend, calculate3HourPressureTrend } from '../../utils/weatherUtils';
import { formatPressure, getPressureUnitSymbol } from '../../types/units';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
import { reverseGeocode } from '../../hooks/useGeocoding';
import Icon from '../Icon';
import InfoButton from '../InfoButton';

type Mode = 'temperature' | 'precipitation' | 'wind' | 'humidity' | 'pressure';

interface Props {
  mode: Mode;
}

export default function WeatherTabContent({ mode }: Props) {
  const { temperatureUnit, pressureUnit, timeFormat, setTemperatureUnit, setPressureUnit, setTimeFormat, setUnits } = useUnits();
  const { location, setLocation, isInitializing } = useLocation();
  const sheetRef = useRef<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Don't fetch weather data if location is not yet determined
  const shouldFetchWeather = location && !isInitializing;
  const { data, loading, error } = useWeather(
    shouldFetchWeather ? location.latitude : 0,
    shouldFetchWeather ? location.longitude : 0,
    temperatureUnit,
    refreshKey
  );
  const { alerts, dismissAlert } = useWeatherAlerts(
    shouldFetchWeather ? location.latitude : 0,
    shouldFetchWeather ? location.longitude : 0,
    refreshKey
  );
  
  const currentLocation = useCurrentLocation();
  const [locationLoading, setLocationLoading] = useState(false);

  if (error) {
    console.log('Weather error', error);
    // Avoid multiple alerts across re-renders
  }

  const descriptionText = useMemo(() => {
    if (!data) return '';
    const d = data.current.description;
    return d.charAt(0).toUpperCase() + d.slice(1);
  }, [data]);

  const compareToYesterdayText = useMemo(() => {
    if (!data) return '';
    if (mode !== 'temperature') return '';
    const diff = data.current.deltaFromYesterday;
    if (diff === null || typeof diff !== 'number') return '';
    const abs = Math.abs(Math.round(diff));
    if (abs === 0) return 'Same as yesterday';
    return `${abs}° ${diff > 0 ? 'warmer' : 'colder'} than yesterday`;
  }, [data, mode]);

  const tempUnit = temperatureUnit === 'metric' ? '°C' : '°F';
  const windUnit = temperatureUnit === 'metric' ? 'km/h' : 'mph';

  const titleUnit = useMemo(() => {
    switch (mode) {
      case 'temperature': return tempUnit;
      case 'wind': return windUnit;
      case 'pressure': return getPressureUnitSymbol(pressureUnit);
      case 'humidity': return '%';
      default: return '';
    }
  }, [mode, tempUnit, windUnit]);

  const mainValue = useMemo(() => {
    if (!data) return '';
    switch (mode) {
      case 'temperature':
        return `${Math.round(data.current.temperature)}${tempUnit}`;
      case 'precipitation': {
        const prob = Math.round(data.current.precipitationProb ?? 0);
        return `${prob}%`;
      }
      case 'wind': {
        const spd = Math.round(data.current.windSpeed ?? 0);
        return `${spd}${windUnit}`;
      }
      case 'humidity':
        return `${Math.round(data.current.humidity ?? 0)}%`;
      case 'pressure':
        return formatPressure(data.current.pressure ?? 1013, pressureUnit);
    }
  }, [data, mode, tempUnit, windUnit, pressureUnit]);

  const subValue = useMemo(() => {
    if (!data) return '';
    switch (mode) {
      case 'temperature':
        return compareToYesterdayText;
      case 'precipitation': {
        const mm = data.current.precipitationMm ?? 0;
        return `${mm.toFixed(1)}mm`;
      }
      case 'wind': {
        const dir = degToCompass(data.current.windDirection);
        return dir;
      }
      case 'humidity':
        return '';
      case 'pressure': {
        // Use 3-hour average trend for more stable predictions
        const pressureTrend = calculate3HourPressureTrend(data.hourly);
        
        return `${pressureTrend.arrow} ${pressureTrend.trend}`;
      }
    }
  }, [data, mode, compareToYesterdayText]);

  const todayLine = useMemo(() => {
    if (!data) return '';
    switch (mode) {
      case 'temperature':
        return `H ${Math.round(data.today.max)}${tempUnit}   L ${Math.round(data.today.min)}${tempUnit}`;
      case 'precipitation':
        return '';
      case 'wind':
        return `Max ${Math.round(data.daily[0]?.windSpeedMax ?? 0)}${windUnit}`;
      case 'humidity':
        return `Avg ${Math.round(data.daily[0]?.humidityMean ?? 0)}%`;
      case 'pressure':
        return '';
    }
  }, [data, mode, tempUnit, windUnit]);

  const onCitySelected = (city: { name: string; latitude: number; longitude: number; country?: string }) => {
    setLocation(city);
  };

  const handleCurrentLocation = useCallback(async () => {
    if (!currentLocation.latitude || !currentLocation.longitude) {
      Alert.alert(
        'Location Error',
        'Current location not available. Please ensure location permissions are enabled.',
        [{ text: 'OK' }]
      );
      return;
    }

    setLocationLoading(true);
    try {
      // Use the already available coordinates from the hook
      const geocoded = await reverseGeocode(currentLocation.latitude, currentLocation.longitude);
      
      if (geocoded) {
        setLocation({
          name: geocoded.name,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          country: geocoded.country,
        });
      } else {
        // Fallback to coordinates if reverse geocoding fails
        setLocation({
          name: `${currentLocation.latitude.toFixed(2)}, ${currentLocation.longitude.toFixed(2)}`,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        });
      }
    } catch (error) {
      console.log('Failed to get current location:', error);
      Alert.alert(
        'Location Error',
        'Unable to determine location name. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLocationLoading(false);
    }
  }, [currentLocation.latitude, currentLocation.longitude, setLocation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Force a refresh by updating the refresh key
    setRefreshKey(prev => prev + 1);
    
    // Wait a bit longer to ensure data is refreshed
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  // Add refreshKey to force useWeather to refetch
  React.useEffect(() => {
    if (refreshKey > 0) {
      // The refresh will happen automatically due to the component re-render
    }
  }, [refreshKey]);
  return (
    <View style={{ flex: 1 }}>
      <WeatherBackground
        condition={data?.current.condition || 'cloudy'}
        isNight={data?.current.isNight || false}
      />
      <ScrollView 
        contentContainerStyle={[styles.container]} 
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
            titleColor="#fff"
          />
        }
      >
        <View style={styles.topRow}>
          <SearchBar
            placeholder="Search city"
            onSelectCity={onCitySelected}
            onOptionsPress={() => sheetRef.current?.expand?.()}
            locationButton={
              <TouchableOpacity 
                style={styles.currentLocationButton} 
                onPress={handleCurrentLocation}
                disabled={locationLoading || !currentLocation.latitude}
                activeOpacity={0.7}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Icon name="location" size={18} color={colors.text} />
                )}
              </TouchableOpacity>
            }
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

        <View style={styles.currentCard}>
          {location && (
            <Text style={styles.cityName}>
              {location.name}{location.country ? `, ${location.country}` : ''}
            </Text>
          )}
          {(loading || isInitializing || !location) ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : data ? (
            <>
              <View style={styles.iconAndDesc}>
                <Text style={styles.bigIcon}>{data.current.icon}</Text>
                <Text style={styles.description}>{descriptionText}</Text>
              </View>

              <Text style={styles.currentMain}>{mainValue}</Text>
              {!!subValue && (
                <View style={styles.subValueContainer}>
                  <Text style={styles.delta}>{subValue}</Text>
                  {mode === 'pressure' && (
                    <InfoButton infoText="Simplified estimate from barometric pressure — check full forecast for accuracy." />
                  )}
                </View>
              )}
              <Text style={styles.hilo}>{todayLine}</Text>
            </>
          ) : null}
        </View>

        {data && (
          <>
            <HourlyStrip
              hours={data.hourly}
              unit={mode === 'temperature' ? tempUnit : mode === 'wind' ? windUnit : mode === 'precipitation' ? 'mm' : mode === 'pressure' ? getPressureUnitSymbol(pressureUnit) : '%'}
              mode={mode}
            />
            <DailyStrip
              days={data.daily}
              unit={mode === 'temperature' ? tempUnit : mode === 'wind' ? windUnit : mode === 'precipitation' ? 'mm' : mode === 'pressure' ? getPressureUnitSymbol(pressureUnit) : '%'}
              mode={mode}
            />
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      <UnitToggleSheet 
        ref={sheetRef} 
        temperatureUnit={temperatureUnit}
        pressureUnit={pressureUnit}
        timeFormat={timeFormat}
        onTemperatureChange={setTemperatureUnit}
        onPressureChange={setPressureUnit}
        onTimeFormatChange={setTimeFormat}
        value={temperatureUnit} 
        onChange={setUnits} 
      />
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
  currentLocationButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
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
  subValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  delta: {
    textAlign: 'center',
    color: colors.text,
    opacity: 0.9,
    fontSize: 14,
  },
  hilo: {
    textAlign: 'center',
    color: colors.text,
    fontSize: 16,
    marginTop: 4,
  },
});