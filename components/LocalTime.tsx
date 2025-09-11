import React, { useState, useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../styles/commonStyles';
import { useUnits } from './UnitsContext';

interface Props {
  timezone?: string;
  style?: any;
}

export default function LocalTime({ timezone, style }: Props) {
  const { timeFormat } = useUnits();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date): string => {
    if (timeFormat === '24h') {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: timezone,
      });
    } else {
      return date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone,
      });
    }
  };

  return (
    <Text style={[styles.timeText, style]}>
      {formatTime(currentTime)}
    </Text>
  );
}

const styles = StyleSheet.create({
  timeText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.9,
  },
});
