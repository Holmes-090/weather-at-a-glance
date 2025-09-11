
import React, { forwardRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { colors } from '../styles/commonStyles';
import type { TemperatureUnit, PressureUnit } from '../types/units';
import type { TimeFormat } from './UnitsContext';

export type UnitType = TemperatureUnit; // Legacy export

interface Props {
  temperatureUnit: TemperatureUnit;
  pressureUnit: PressureUnit;
  timeFormat: TimeFormat;
  onTemperatureChange: (unit: TemperatureUnit) => void;
  onPressureChange: (unit: PressureUnit) => void;
  onTimeFormatChange: (format: TimeFormat) => void;
  // Legacy support
  value?: UnitType;
  onChange?: (v: UnitType) => void;
}

const UnitToggleSheet = forwardRef<BottomSheet, Props>(({ 
  temperatureUnit, 
  pressureUnit,
  timeFormat,
  onTemperatureChange, 
  onPressureChange,
  onTimeFormatChange,
  value, // Legacy
  onChange // Legacy
}, ref) => {
  const snapPoints = useMemo(() => ['50%'], []); // Increased height for time format

  // Use new props or fall back to legacy props
  const currentTempUnit = temperatureUnit || value || 'metric';
  const currentPressureUnit = pressureUnit || 'hPa';
  const currentTimeFormat = timeFormat || '12h';
  const handleTempChange = onTemperatureChange || onChange || (() => {});
  const handlePressureChange = onPressureChange || (() => {});
  const handleTimeFormatChange = onTimeFormatChange || (() => {});

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: '#0E1622' }}
      handleIndicatorStyle={{ backgroundColor: '#6f7e92' }}
    >
      <BottomSheetView style={styles.content}>
        <Text style={styles.title}>Units</Text>
        
        {/* Temperature Units */}
        <Text style={styles.sectionTitle}>Temperature</Text>
        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segmentItem, currentTempUnit === 'metric' && styles.segmentItemActive]}
            onPress={() => handleTempChange('metric')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, currentTempUnit === 'metric' && styles.segmentTextActive]}>Metric (°C)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentItem, currentTempUnit === 'imperial' && styles.segmentItemActive]}
            onPress={() => handleTempChange('imperial')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, currentTempUnit === 'imperial' && styles.segmentTextActive]}>Imperial (°F)</Text>
          </TouchableOpacity>
        </View>

        {/* Pressure Units */}
        <Text style={styles.sectionTitle}>Pressure</Text>
        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segmentItem, currentPressureUnit === 'hPa' && styles.segmentItemActive]}
            onPress={() => handlePressureChange('hPa')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, currentPressureUnit === 'hPa' && styles.segmentTextActive]}>hPa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentItem, currentPressureUnit === 'inHg' && styles.segmentItemActive]}
            onPress={() => handlePressureChange('inHg')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, currentPressureUnit === 'inHg' && styles.segmentTextActive]}>inHg</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentItem, currentPressureUnit === 'kPa' && styles.segmentItemActive]}
            onPress={() => handlePressureChange('kPa')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, currentPressureUnit === 'kPa' && styles.segmentTextActive]}>kPa</Text>
          </TouchableOpacity>
        </View>

        {/* Time Format */}
        <Text style={styles.sectionTitle}>Time Format</Text>
        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segmentItem, currentTimeFormat === '12h' && styles.segmentItemActive]}
            onPress={() => handleTimeFormatChange('12h')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, currentTimeFormat === '12h' && styles.segmentTextActive]}>12-hour (AM/PM)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentItem, currentTimeFormat === '24h' && styles.segmentItemActive]}
            onPress={() => handleTimeFormatChange('24h')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, currentTimeFormat === '24h' && styles.segmentTextActive]}>24-hour</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
});

export default UnitToggleSheet;

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
    marginBottom: 8,
    opacity: 0.8,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  segmentText: {
    color: colors.text,
    fontSize: 16,
  },
  segmentTextActive: {
    fontWeight: '700',
  },
});
