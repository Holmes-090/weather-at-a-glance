
import { useMemo, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { colors } from '../../styles/commonStyles';
import SearchBar from '../SearchBar';
import UnitToggleSheet from '../UnitToggleSheet';
import WeatherBackground from './WeatherBackground';
import HourlyStrip from './HourlyStrip';
import DailyStrip from './DailyStrip';
import { useUnits } from '../..//components/UnitsContext';
import { useLocation } from '../..//components/LocationContext';
import { useWeather } from '../../hooks/useWeather';

type Mode = 'temperature' | 'precipitation' | 'wind' | 'humidity';

interface Props {
  mode: Mode;
}

export default function WeatherTabContent({ mode }: Props) {
  const { units, setUnits } = useUnits();
  const { location, setLocation } = useLocation();
  const sheetRef = useRef<any>(null);

  const { data, loading, error } = useWeather(location.latitude, location.longitude, units);

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

  const tempUnit = units === 'metric' ? '°C' : '°F';
  const windUnit = units === 'metric' ? 'km/h' : 'mph';

  const titleUnit = useMemo(() => {
    switch (mode) {
      case 'temperature': return tempUnit;
      case 'wind': return windUnit;
      default: return '';
    }
  }, [mode, tempUnit, windUnit]);

  const mainValue = useMemo(() => {
    if (!data) return '';
    switch (mode) {
      case 'temperature':
        return `${Math.round(data.current.temperature)}${tempUnit}`;
      case 'precipitation': {
        const mm = data.current.precipitationMm ?? 0;
        return `${mm.toFixed(1)}mm`;
      }
      case 'wind': {
        const spd = Math.round(data.current.windSpeed ?? 0);
        return `${spd}${windUnit}`;
      }
      case 'humidity':
        return `${Math.round(data.current.humidity ?? 0)}%`;
    }
  }, [data, mode, tempUnit, windUnit]);

  const subValue = useMemo(() => {
    if (!data) return '';
    switch (mode) {
      case 'temperature':
        return compareToYesterdayText;
      case 'precipitation': {
        const prob = Math.round(data.current.precipitationProb ?? 0);
        return `${prob}% chance`;
      }
      case 'wind': {
        const dir = degToCompass(data.current.windDirection);
        return dir;
      }
      case 'humidity':
        return '';
    }
  }, [data, mode, compareToYesterdayText]);

  const todayLine = useMemo(() => {
    if (!data) return '';
    switch (mode) {
      case 'temperature':
        return `H ${Math.round(data.today.max)}${tempUnit}   L ${Math.round(data.today.min)}${tempUnit}`;
      case 'precipitation':
        return `Sum ${(data.daily[0]?.precipSumMm ?? 0).toFixed(1)}mm   Max ${Math.round(data.daily[0]?.precipProbMax ?? 0)}%`;
      case 'wind':
        return `Max ${Math.round(data.daily[0]?.windSpeedMax ?? 0)}${windUnit}`;
      case 'humidity':
        return `Avg ${Math.round(data.daily[0]?.humidityMean ?? 0)}%`;
    }
  }, [data, mode, tempUnit, windUnit]);

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

              <Text style={styles.currentMain}>{mainValue}</Text>
              {!!subValue && <Text style={styles.delta}>{subValue}</Text>}
              <Text style={styles.hilo}>{todayLine}</Text>
            </>
          ) : null}
        </View>

        {data && (
          <>
            <HourlyStrip
              hours={data.hourly}
              unit={mode === 'temperature' ? tempUnit : mode === 'wind' ? windUnit : ''}
              mode={mode}
            />
            <DailyStrip
              days={data.daily}
              unit={mode === 'temperature' ? tempUnit : mode === 'wind' ? windUnit : ''}
              mode={mode}
            />
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
  delta: {
    textAlign: 'center',
    color: colors.text,
    opacity: 0.9,
    marginTop: 8,
    fontSize: 14,
  },
  hilo: {
    textAlign: 'center',
    color: colors.text,
    fontSize: 16,
    marginTop: 4,
  },
});
