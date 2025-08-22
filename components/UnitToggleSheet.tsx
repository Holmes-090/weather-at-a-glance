
import React, { forwardRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { colors } from '../styles/commonStyles';

export type UnitType = 'metric' | 'imperial';

interface Props {
  value: UnitType;
  onChange: (v: UnitType) => void;
}

const UnitToggleSheet = forwardRef<BottomSheet, Props>(({ value, onChange }, ref) => {
  const snapPoints = useMemo(() => ['25%'], []);

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
        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segmentItem, value === 'metric' && styles.segmentItemActive]}
            onPress={() => onChange('metric')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, value === 'metric' && styles.segmentTextActive]}>Metric (°C)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentItem, value === 'imperial' && styles.segmentItemActive]}
            onPress={() => onChange('imperial')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, value === 'imperial' && styles.segmentTextActive]}>Imperial (°F)</Text>
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
