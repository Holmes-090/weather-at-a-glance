
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../styles/commonStyles';
import { DayForecast } from '../../types/weather';
import CompassRose from './CompassRose';
import HumidityBar from './HumidityBar';
import { useUnits } from '../UnitsContext';
import { formatPressure } from '../../types/units';

function weatherIcon(icon: string) {
  return icon;
}

type Mode = 'temperature' | 'precipitation' | 'wind' | 'humidity' | 'pressure';

interface Props {
  days: DayForecast[];
  unit: string;
  mode?: Mode;
}

export default function DailyStrip({ days, unit, mode = 'temperature' }: Props) {
  const router = useRouter();
  const { pressureUnit } = useUnits();

  const handlePress = () => {
    console.log(`[DAILY NAV] Starting navigation with mode: ${mode}, unit: ${unit}, days count: ${days.length}`);
    console.log(`[DAILY NAV] First day data:`, days[0]);
    
    // Add a small delay to ensure touch event is fully processed
    setTimeout(() => {
      try {
        // Clean the data to ensure it can be serialized properly
        const cleanDays = days.map(day => ({
          date: day.date,
          label: day.label,
          max: day.max || 0,
          min: day.min || 0,
          icon: day.icon || '🌡️',
          precipSumMm: day.precipSumMm || 0,
          precipProbMax: day.precipProbMax || 0,
          windSpeedMax: day.windSpeedMax || 0,
          windDirectionDominant: day.windDirectionDominant || 0,
          humidityMean: day.humidityMean || 0,
          sunrise: day.sunrise || '',
          sunset: day.sunset || '',
          pressureMean: day.pressureMean || 1013
        }));
        
        console.log(`[DAILY NAV] Cleaned data, attempting navigation...`);
        
        // Navigate to daily detail screen with data
        router.push({
          pathname: '/daily-detail',
          params: {
            dailyData: JSON.stringify(cleanDays),
            mode: mode,
            unit: unit,
          },
        });
        
        console.log(`[DAILY NAV] Navigation push completed successfully`);
      } catch (error) {
        console.error('[DAILY NAV] Navigation error:', error);
        console.error('[DAILY NAV] Error stack:', error.stack);
        
        // Fallback - try simplified navigation
        try {
          console.log('[DAILY NAV] Attempting fallback navigation...');
          router.push('/daily-detail');
        } catch (fallbackError) {
          console.error('[DAILY NAV] Fallback navigation failed:', fallbackError);
        }
      }
    }, 10); // Small delay to ensure touch processing is complete
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity 
        style={styles.titleRow} 
        onPress={handlePress} 
        activeOpacity={0.7} 
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        delayPressIn={0}
        delayPressOut={0}
      >
        <Text style={styles.title}>7-Day Forecast</Text>
        <Text style={styles.tapHint}>Tap for details</Text>
      </TouchableOpacity>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.row}>
          {days.map((d) => (
            <View key={d.date} style={styles.item}>
              <Text style={styles.label}>{d.label}</Text>
              
              {/* Conditional icon rendering based on mode */}
              <View style={styles.iconContainer}>
                {mode === 'wind' ? (
                  <CompassRose 
                    windDirection={d.windDirectionDominant} 
                    size={24} 
                    color={colors.text} 
                  />
                ) : mode === 'humidity' ? (
                  <HumidityBar 
                    humidity={d.humidityMean} 
                    width={12} 
                    height={22}
                    fillColor="#4A90E2"
                    borderColor={colors.text}
                  />
                ) : (
                  <Text style={styles.icon}>{weatherIcon(d.icon)}</Text>
                )}
              </View>
              
              {mode === 'temperature' && (
                <View style={styles.verticalValues}>
                  <Text style={styles.highValue}>
                    {Math.round(d.max)}{unit}
                  </Text>
                  <Text style={styles.lowValue}>
                    {Math.round(d.min)}{unit}
                  </Text>
                </View>
              )}
              {mode === 'precipitation' && (
                <View style={styles.verticalValues}>
                  <Text style={styles.highValue}>
                    {(d.precipSumMm ?? 0).toFixed(1)}mm
                  </Text>
                  <Text style={styles.lowValue}>
                    {Math.round(d.precipProbMax ?? 0)}%
                  </Text>
                </View>
              )}
              {mode === 'wind' && (
                <Text style={styles.value}>
                  {Math.round(d.windSpeedMax ?? 0)}{unit}
                </Text>
              )}
              {mode === 'humidity' && (
                <Text style={styles.value}>
                  {Math.round(d.humidityMean ?? 0)}%
                </Text>
              )}
              {mode === 'pressure' && (
                <Text style={styles.value}>
                  {d.pressureMean ? formatPressure(d.pressureMean, pressureUnit) : 'N/A'}
                </Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(16, 24, 36, 0.35)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 10,
    marginBottom: 6,
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
    gap: 12,
  },
  item: {
    minWidth: 90,
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
    height: 28,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
    marginTop: 4,
    color: colors.text,
  } as any,
  value: {
    color: colors.text,
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  verticalValues: {
    alignItems: 'center',
    marginTop: 4,
  },
  highValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  lowValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.8,
    marginTop: 2,
  },
});
