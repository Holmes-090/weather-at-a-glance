
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../styles/commonStyles';
import { DayForecast } from '../../types/weather';
import CompassRose from './CompassRose';
import HumidityBar from './HumidityBar';

function weatherIcon(icon: string) {
  return icon;
}

type Mode = 'temperature' | 'precipitation' | 'wind' | 'humidity';

interface Props {
  days: DayForecast[];
  unit: string;
  mode?: Mode;
}

export default function DailyStrip({ days, unit, mode = 'temperature' }: Props) {
  const router = useRouter();

  const handlePress = () => {
    console.log(`Navigating to daily detail with mode: ${mode}, unit: ${unit}, days count: ${days.length}`);
    console.log(`First day data:`, days[0]);
    // Navigate to daily detail screen with data
    try {
      router.push({
        pathname: '/daily-detail',
        params: {
          dailyData: JSON.stringify(days),
          mode: mode,
          unit: unit,
        },
      });
    } catch (error) {
      console.error('Daily navigation error:', error);
    }
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.titleRow} onPress={handlePress} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.title}>7-Day Forecast</Text>
        <Text style={styles.tapHint}>Tap for details</Text>
      </TouchableOpacity>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                <Text style={styles.value}>
                  {Math.round(d.max)}{unit} / {Math.round(d.min)}{unit}
                </Text>
              )}
              {mode === 'precipitation' && (
                <Text style={styles.value}>
                  {(d.precipSumMm ?? 0).toFixed(1)}mm · {Math.round(d.precipProbMax ?? 0)}%
                </Text>
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
});
