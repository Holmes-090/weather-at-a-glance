
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../styles/commonStyles';
import { HourForecast } from '../../types/weather';
import CompassRose from './CompassRose';
import HumidityBar from './HumidityBar';
import { getPressureTrendArrow } from '../../utils/weatherUtils';

function weatherIcon(codeIcon: string) {
  return codeIcon;
}

type Mode = 'temperature' | 'precipitation' | 'wind' | 'humidity' | 'pressure';

interface Props {
  hours: HourForecast[];
  unit: string; // primary unit for the mode
  mode?: Mode;
}

export default function HourlyStrip({ hours, unit, mode = 'temperature' }: Props) {
  const router = useRouter();

  const handlePress = () => {
    console.log(`Navigating to hourly detail with mode: ${mode}, unit: ${unit}, hours count: ${hours.length}`);
    console.log(`First hour data:`, hours[0]);
    
    // Navigate to hourly detail screen with data
    try {
      console.log('Attempting navigation to hourly-detail...');
      router.push({
        pathname: '/hourly-detail',
        params: {
          hourlyData: JSON.stringify(hours),
          mode: mode,
          unit: unit,
        },
      });
      console.log('Hourly navigation push completed');
    } catch (error) {
      console.error('Hourly navigation error:', error);
      // Fallback - try without the data
      try {
        router.push('/hourly-detail');
      } catch (fallbackError) {
        console.error('Hourly fallback navigation also failed:', fallbackError);
      }
    }
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.titleRow} onPress={handlePress} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.title}>Hourly</Text>
        <Text style={styles.tapHint}>Tap for details</Text>
      </TouchableOpacity>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {hours.map((h) => (
            <View key={h.time} style={styles.item}>
              <Text style={styles.label}>{h.label}</Text>
              
              {/* Conditional icon rendering based on mode */}
              <View style={styles.iconContainer}>
                {mode === 'wind' ? (
                  <CompassRose 
                    windDirection={h.windDirection} 
                    size={26} 
                    color={colors.text} 
                  />
                ) : mode === 'humidity' ? (
                  <HumidityBar 
                    humidity={h.humidity} 
                    width={12} 
                    height={24}
                    fillColor="#4A90E2"
                    borderColor={colors.text}
                  />
                ) : (
                  <Text style={styles.icon}>{weatherIcon(h.icon)}</Text>
                )}
              </View>
              
              {mode === 'temperature' && (
                <Text style={styles.valueText}>{Math.round(h.temperature)}{unit}</Text>
              )}
              {mode === 'precipitation' && (
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.valueText}>{(h.precipitationMm ?? 0).toFixed(1)}mm</Text>
                  <Text style={styles.subText}>{Math.round(h.precipitationProb ?? 0)}%</Text>
                </View>
              )}
              {mode === 'wind' && (
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.valueText}>{Math.round(h.windSpeed ?? 0)}{unit}</Text>
                  <Text style={styles.subText}>{degToCompass(h.windDirection)}</Text>
                </View>
              )}
              {mode === 'humidity' && (
                <Text style={styles.valueText}>{Math.round(h.humidity ?? 0)}%</Text>
              )}
              {mode === 'pressure' && (
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.valueText}>{Math.round(h.pressure ?? 1013)} hPa</Text>
                  <Text style={styles.subText}>{getPressureTrendArrow()}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
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
  card: {
    backgroundColor: 'rgba(16, 24, 36, 0.35)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 10,
    boxShadow: '0px 6px 16px rgba(0,0,0,0.25)',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 8,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  tapHint: {
    color: colors.text,
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  item: {
    width: 72,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 12,
  },
  label: {
    color: colors.text,
    fontSize: 12,
    opacity: 0.85,
  },
  iconContainer: {
    height: 34,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 26,
    marginTop: 4,
    color: colors.text,
  } as any,
  valueText: {
    color: colors.text,
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  subText: {
    color: colors.text,
    opacity: 0.85,
    fontSize: 12,
    marginTop: 2,
  },
});
