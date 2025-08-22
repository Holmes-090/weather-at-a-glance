
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../../styles/commonStyles';
import { DayForecast } from '../../types/weather';

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
  return (
    <View style={styles.card}>
      <Text style={styles.title}>7-Day Forecast</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {days.map((d) => (
            <View key={d.date} style={styles.item}>
              <Text style={styles.label}>{d.label}</Text>
              <Text style={styles.icon}>{weatherIcon(d.icon)}</Text>
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
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    paddingHorizontal: 4,
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
