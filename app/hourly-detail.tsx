import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Path, Line, Text as SvgText, G } from 'react-native-svg';
import { colors } from '../styles/commonStyles';
import { HourForecast } from '../types/weather';
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

// Custom SVG Chart Component
function SimpleLineChart({ data, width, height, mode, unit }: {
  data: { x: number; y: number; label: string }[];
  width: number;
  height: number;
  mode: Mode;
  unit: string;
}) {
  const padding = { left: 50, right: 20, top: 20, bottom: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find min and max values for scaling
  const yValues = data.map(d => d.y);
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

  // Create path for the line
  const pathData = data.map((point, index) => {
    const x = padding.left + (index / (data.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((point.y - scaledMinY) / scaledRange) * chartHeight;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

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
      
      {/* X-axis labels */}
      {data.filter((_, i) => i % 4 === 0).map((point, i) => {
        const actualIndex = i * 4;
        const x = padding.left + (actualIndex / (data.length - 1)) * chartWidth;
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
      
      {/* Data line */}
      <Path
        d={pathData}
        stroke="#4A90E2"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function HourlyDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = Dimensions.get('window');
  
  // Parse the hourly data and mode from params
  const hourlyData: HourForecast[] = params.hourlyData ? JSON.parse(params.hourlyData as string) : [];
  const mode = (params.mode as Mode) || 'temperature';
  const unit = (params.unit as string) || '';

  // Prepare chart data based on mode
  const chartData = useMemo(() => {
    if (mode === 'temperature') {
      // For temperature, we need to get today's daily forecast to show high/low ranges
      // Since hourly data doesn't include high/low per hour, we'll use the current temperature
      // and estimate high/low based on daily forecast
      const data = hourlyData.map((hour, index) => ({
        x: index,
        y: hour.temperature,
        label: hour.label,
      }));
      
      console.log(`Hourly ${mode} data:`, data.map(d => d.y));
      return data;
    }
    
    const data = hourlyData.map((hour, index) => {
      let yValue = 0;
      switch (mode) {
        case 'precipitation':
          yValue = hour.precipitationMm || 0;
          break;
        case 'wind':
          yValue = hour.windSpeed || 0;
          break;
        case 'humidity':
          yValue = hour.humidity || 0;
          break;
        case 'pressure':
          yValue = hour.pressure || 1013;
          break;
      }
      return {
        x: index,
        y: yValue,
        label: hour.label,
      };
    });
    
    // Debug logging to help identify issues
    console.log(`Hourly ${mode} data:`, data.map(d => d.y));
    
    return data;
  }, [hourlyData, mode]);

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
      default: return '';
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
        <Text style={styles.headerTitle}>24-Hour {getTitle()}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Chart Section */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>{getTitle()} Forecast</Text>
          
          <View style={styles.chartContainer}>
            <SimpleLineChart
              data={chartData}
              width={chartWidth}
              height={280}
              mode={mode}
              unit={getYAxisLabel()}
            />
          </View>
        </View>

        {/* Hourly Strip */}
        <View style={styles.hourlyCard}>
          <Text style={styles.hourlyTitle}>Hourly Details</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.hourlyRow}>
              {hourlyData.map((hour) => (
                <View key={hour.time} style={styles.hourlyItem}>
                  <Text style={styles.hourlyLabel}>{hour.label}</Text>
                  
                  {/* Conditional icon rendering based on mode */}
                  <View style={styles.hourlyIconContainer}>
                    {mode === 'wind' ? (
                      <CompassRose 
                        windDirection={hour.windDirection} 
                        size={28} 
                        color={colors.text} 
                      />
                    ) : mode === 'humidity' ? (
                      <HumidityBar 
                        humidity={hour.humidity} 
                        width={14} 
                        height={26}
                        fillColor="#4A90E2"
                        borderColor={colors.text}
                      />
                    ) : (
                      <Text style={styles.hourlyIcon}>{weatherIcon(hour.icon)}</Text>
                    )}
                  </View>
                  
                  {mode === 'temperature' && (
                    <Text style={styles.hourlyValue}>{Math.round(hour.temperature)}{unit}</Text>
                  )}
                  
                  {mode === 'precipitation' && (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={styles.hourlyValue}>{(hour.precipitationMm ?? 0).toFixed(1)}mm</Text>
                      <Text style={styles.hourlySubText}>{Math.round(hour.precipitationProb ?? 0)}%</Text>
                    </View>
                  )}
                  
                  {mode === 'wind' && (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={styles.hourlyValue}>{Math.round(hour.windSpeed ?? 0)}{unit}</Text>
                      <Text style={styles.hourlySubText}>{degToCompass(hour.windDirection)}</Text>
                    </View>
                  )}
                  
                  {mode === 'humidity' && (
                    <Text style={styles.hourlyValue}>{Math.round(hour.humidity ?? 0)}%</Text>
                  )}
                  
                  {mode === 'pressure' && (
                    <Text style={styles.hourlyValue}>{Math.round(hour.pressure ?? 1013)} hPa</Text>
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
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourlyCard: {
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
  hourlyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  hourlyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  hourlyItem: {
    width: 76,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  hourlyLabel: {
    color: colors.text,
    fontSize: 12,
    opacity: 0.85,
    marginBottom: 4,
  },
  hourlyIconContainer: {
    height: 36,
    marginVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourlyIcon: {
    fontSize: 28,
    marginVertical: 6,
    color: colors.text,
  } as any,
  hourlyValue: {
    color: colors.text,
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  hourlySubText: {
    color: colors.text,
    opacity: 0.75,
    fontSize: 11,
    marginTop: 2,
  },
});
