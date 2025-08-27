import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Path, Line, Text as SvgText, G } from 'react-native-svg';
import { colors } from '../styles/commonStyles';
import { DayForecast } from '../types/weather';
import { Ionicons } from '@expo/vector-icons';
import CompassRose from '../components/weather/CompassRose';
import HumidityBar from '../components/weather/HumidityBar';

type Mode = 'temperature' | 'precipitation' | 'wind' | 'humidity' | 'pressure';

function weatherIcon(codeIcon: string) {
  return codeIcon;
}

function degToCompass(deg?: number) {
  if (typeof deg !== 'number') return '';
  const val = Math.floor((deg / 22.5) + 0.5);
  const arr = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return arr[val % 16];
}

// Custom SVG Chart Component for Daily Data
function DailyLineChart({ data, width, height, mode, unit }: {
  data: { x: number; y: number; label: string }[] | { highData: { x: number; y: number; label: string }[]; lowData: { x: number; y: number; label: string }[] };
  width: number;
  height: number;
  mode: Mode;
  unit: string;
}) {
  const padding = { left: 60, right: 20, top: 20, bottom: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Handle dual-line temperature mode vs single-line modes
  const isTemperatureMode = mode === 'temperature' && 'highData' in data;
  let yValues: number[];
  let highPathData = '';
  let lowPathData = '';
  let singlePathData = '';
  
  if (isTemperatureMode) {
    const tempData = data as { highData: { x: number; y: number; label: string }[]; lowData: { x: number; y: number; label: string }[] };
    const highValues = tempData.highData.map(d => d.y);
    const lowValues = tempData.lowData.map(d => d.y);
    yValues = [...highValues, ...lowValues];
    
    // Create paths for both high and low lines
    highPathData = tempData.highData.map((point, index) => {
      const x = padding.left + (index / (tempData.highData.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((point.y - scaledMinY) / scaledRange) * chartHeight;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    lowPathData = tempData.lowData.map((point, index) => {
      const x = padding.left + (index / (tempData.lowData.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((point.y - scaledMinY) / scaledRange) * chartHeight;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  } else {
    const singleData = data as { x: number; y: number; label: string }[];
    yValues = singleData.map(d => d.y);
    
    // Create single path
    singlePathData = singleData.map((point, index) => {
      const x = padding.left + (index / (singleData.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((point.y - scaledMinY) / scaledRange) * chartHeight;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }

  // Find min and max values for scaling
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const yRange = maxY - minY;
  
  // Handle cases where all values are the same or very close to zero
  let scaledMinY, scaledMaxY, scaledRange;
  if (yRange === 0 || maxY === 0) {
    // If all values are the same or zero, create a reasonable scale
    if (maxY === 0) {
      scaledMinY = 0;
      scaledMaxY = 1; // Show 0-1 scale for zero values
    } else {
      scaledMinY = maxY * 0.9;
      scaledMaxY = maxY * 1.1;
    }
    scaledRange = scaledMaxY - scaledMinY;
  } else {
    const yPadding = yRange * 0.1; // Add 10% padding
    scaledMinY = minY - yPadding;
    scaledMaxY = maxY + yPadding;
    scaledRange = scaledMaxY - scaledMinY;
  }
  
  // Recalculate paths with proper scaling
  if (isTemperatureMode) {
    const tempData = data as { highData: { x: number; y: number; label: string }[]; lowData: { x: number; y: number; label: string }[] };
    
    highPathData = tempData.highData.map((point, index) => {
      const x = padding.left + (index / (tempData.highData.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((point.y - scaledMinY) / scaledRange) * chartHeight;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    lowPathData = tempData.lowData.map((point, index) => {
      const x = padding.left + (index / (tempData.lowData.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((point.y - scaledMinY) / scaledRange) * chartHeight;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  } else {
    const singleData = data as { x: number; y: number; label: string }[];
    singlePathData = singleData.map((point, index) => {
      const x = padding.left + (index / (singleData.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((point.y - scaledMinY) / scaledRange) * chartHeight;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }

  // Y-axis labels
  const yTicks = 5;
  const yLabels = Array.from({ length: yTicks }, (_, i) => {
    const value = scaledMinY + (scaledRange * i / (yTicks - 1));
    return {
      value: Math.round(value),
      y: padding.top + chartHeight - (i / (yTicks - 1)) * chartHeight
    };
  });

     const getYAxisLabel = () => {
     switch (mode) {
       case 'temperature': return unit;
       case 'precipitation': return 'mm';
       case 'wind': return unit;
       case 'humidity': return '%';
       case 'pressure': return 'hPa';
       default: return '';
     }
   };

  return (
    <Svg width={width} height={height}>
      {/* Grid lines */}
      {yLabels.map((label, i) => (
        <Line
          key={i}
          x1={padding.left}
          y1={label.y}
          x2={padding.left + chartWidth}
          y2={label.y}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
      ))}
      
      {/* Y-axis */}
      <Line
        x1={padding.left}
        y1={padding.top}
        x2={padding.left}
        y2={padding.top + chartHeight}
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
      />
      
      {/* X-axis */}
      <Line
        x1={padding.left}
        y1={padding.top + chartHeight}
        x2={padding.left + chartWidth}
        y2={padding.top + chartHeight}
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
      />
      
      {/* Y-axis labels */}
      {yLabels.map((label, i) => (
        <SvgText
          key={i}
          x={padding.left - 10}
          y={label.y + 4}
          fill="#FFFFFF"
          fontSize="12"
          textAnchor="end"
        >
          {`${label.value}${getYAxisLabel()}`}
        </SvgText>
      ))}
      
      {/* X-axis labels (all days) */}
      {(isTemperatureMode ? 
        (data as { highData: { x: number; y: number; label: string }[]; lowData: { x: number; y: number; label: string }[] }).highData :
        (data as { x: number; y: number; label: string }[])
      ).map((point, i) => {
        const totalPoints = isTemperatureMode ? 
          (data as { highData: { x: number; y: number; label: string }[]; lowData: { x: number; y: number; label: string }[] }).highData.length :
          (data as { x: number; y: number; label: string }[]).length;
        const x = padding.left + (i / (totalPoints - 1)) * chartWidth;
        return (
          <SvgText
            key={i}
            x={x}
            y={padding.top + chartHeight + 20}
            fill="#FFFFFF"
            fontSize="10"
            textAnchor="middle"
          >
            {point.label}
          </SvgText>
        );
      })}
      
      {/* Data lines */}
      {isTemperatureMode ? (
        <>
          {/* High temperature line (red) */}
          <Path
            d={highPathData}
            stroke="#FF6B6B"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Low temperature line (blue) */}
          <Path
            d={lowPathData}
            stroke="#4A90E2"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        /* Single data line */
        <Path
          d={singlePathData}
          stroke="#4A90E2"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
}

export default function DailyDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = Dimensions.get('window');
  
  // Parse the daily data and mode from params
  const dailyData: DayForecast[] = params.dailyData ? JSON.parse(params.dailyData as string) : [];
  const mode = (params.mode as Mode) || 'temperature';
  const unit = (params.unit as string) || '';

  // Prepare chart data based on mode
  const chartData = useMemo(() => {
    if (mode === 'temperature') {
      // For temperature, prepare separate high and low data series
      const highData = dailyData.map((day, index) => ({
        x: index,
        y: day.max,
        label: day.label,
      }));
      
      const lowData = dailyData.map((day, index) => ({
        x: index,
        y: day.min,
        label: day.label,
      }));
      
      console.log(`Daily temperature highs:`, highData.map(d => d.y));
      console.log(`Daily temperature lows:`, lowData.map(d => d.y));
      
      return { highData, lowData };
    }
    
    const data = dailyData.map((day, index) => {
      let yValue = 0;
      switch (mode) {
        case 'precipitation':
          yValue = day.precipSumMm || 0;
          break;
        case 'wind':
          yValue = day.windSpeedMax || 0;
          break;
        case 'humidity':
          yValue = day.humidityMean || 0;
          break;
        case 'pressure':
          yValue = day.pressureMean || 1013; // Use calculated daily average or fallback
          break;
      }
      return {
        x: index,
        y: yValue,
        label: day.label,
      };
    });
    
    // Debug logging to help identify issues
    console.log(`Daily ${mode} data:`, data.map(d => d.y));
    
    return data;
  }, [dailyData, mode]);

  // Get title and unit info
  const getTitle = () => {
    switch (mode) {
      case 'temperature': return 'Temperature';
      case 'precipitation': return 'Precipitation';
      case 'wind': return 'Wind Speed';
      case 'humidity': return 'Humidity';
      case 'pressure': return 'Barometric Pressure';
    }
  };

  const getYAxisLabel = () => {
    switch (mode) {
      case 'temperature': return unit;
      case 'precipitation': return 'mm';
      case 'wind': return unit;
      case 'humidity': return '%';
      case 'pressure': return 'hPa';
    }
  };

  const chartWidth = Math.min(width - 40, 380);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>7-Day {getTitle()}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Chart Section */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>
            {getTitle()} Forecast
            {mode === 'temperature' && (
              <Text style={styles.chartSubtitle}>{'\n'}High & Low Temperatures</Text>
            )}
          </Text>
          
          {/* Legend for temperature mode */}
          {mode === 'temperature' && (
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendLine, { backgroundColor: '#FF6B6B' }]} />
                <Text style={styles.legendText}>High</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendLine, { backgroundColor: '#4A90E2' }]} />
                <Text style={styles.legendText}>Low</Text>
              </View>
            </View>
          )}
          
          <View style={styles.chartContainer}>
            <DailyLineChart
              data={chartData}
              width={chartWidth}
              height={280}
              mode={mode}
              unit={getYAxisLabel()}
            />
          </View>
        </View>

        {/* Daily Strip */}
        <View style={styles.dailyCard}>
          <Text style={styles.dailyTitle}>7-Day Details</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.dailyRow}>
              {dailyData.map((day) => (
                <View key={day.date} style={styles.dailyItem}>
                  <Text style={styles.dailyLabel}>{day.label}</Text>
                  
                  {/* Conditional icon rendering based on mode */}
                  <View style={styles.dailyIconContainer}>
                    {mode === 'wind' ? (
                      <CompassRose 
                        windDirection={day.windDirectionDominant} 
                        size={28} 
                        color={colors.text} 
                      />
                    ) : mode === 'humidity' ? (
                      <HumidityBar 
                        humidity={day.humidityMean} 
                        width={14} 
                        height={26}
                        fillColor="#4A90E2"
                        borderColor={colors.text}
                      />
                    ) : (
                      <Text style={styles.dailyIcon}>{weatherIcon(day.icon)}</Text>
                    )}
                  </View>
                  
                  {mode === 'temperature' && (
                    <Text style={styles.dailyValue}>
                      {Math.round(day.max)}{unit} / {Math.round(day.min)}{unit}
                    </Text>
                  )}
                  
                  {mode === 'precipitation' && (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={styles.dailyValue}>{(day.precipSumMm ?? 0).toFixed(1)}mm</Text>
                      <Text style={styles.dailySubText}>{Math.round(day.precipProbMax ?? 0)}%</Text>
                    </View>
                  )}
                  
                  {mode === 'wind' && (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={styles.dailyValue}>{Math.round(day.windSpeedMax ?? 0)}{unit}</Text>
                      <Text style={styles.dailySubText}>{degToCompass(day.windDirectionDominant)}</Text>
                    </View>
                  )}
                  
                  {mode === 'humidity' && (
                    <Text style={styles.dailyValue}>{Math.round(day.humidityMean ?? 0)}%</Text>
                  )}
                  
                  {mode === 'pressure' && (
                    <Text style={styles.dailyValue}>{Math.round(day.pressureMean ?? 1013)} hPa</Text>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1426',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  chartCard: {
    backgroundColor: 'rgba(16, 24, 36, 0.6)',
    borderRadius: 20,
    marginTop: 20,
    marginBottom: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  chartTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    opacity: 0.8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendLine: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
  },
  legendText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '500',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyCard: {
    backgroundColor: 'rgba(16, 24, 36, 0.6)',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  dailyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  dailyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dailyItem: {
    width: 90,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  dailyLabel: {
    color: colors.text,
    fontSize: 12,
    opacity: 0.85,
    marginBottom: 4,
  },
  dailyIconContainer: {
    height: 42,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyIcon: {
    fontSize: 28,
    marginVertical: 8,
    color: colors.text,
  } as any,
  dailyValue: {
    color: colors.text,
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  dailySubText: {
    color: colors.text,
    opacity: 0.75,
    fontSize: 10,
    marginTop: 2,
  },
});
