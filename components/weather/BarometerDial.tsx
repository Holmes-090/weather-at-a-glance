import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Svg, Circle, Path, Text as SvgText } from 'react-native-svg';
import { colors } from '../../styles/commonStyles';
import { getPressureTrendArrow } from '../../utils/weatherUtils';

interface Props {
  pressure: number;
  pressureDelta?: number | null;
  size?: number;
}

export default function BarometerDial({ pressure, pressureDelta, size = 120 }: Props) {
  const radius = size / 2 - 10;
  const center = size / 2;
  
  // Pressure range: 950-1050 hPa (typical range)
  // Map to 180 degrees (semicircle)
  const minPressure = 950;
  const maxPressure = 1050;
  const normalizedPressure = Math.max(0, Math.min(1, (pressure - minPressure) / (maxPressure - minPressure)));
  
  // Convert to angle (-90 to +90 degrees, where -90 is left, +90 is right)
  const angle = -90 + (normalizedPressure * 180);
  const angleRad = (angle * Math.PI) / 180;
  
  // Calculate needle position
  const needleLength = radius - 15;
  const needleX = center + Math.cos(angleRad) * needleLength;
  const needleY = center + Math.sin(angleRad) * needleLength;
  
  // Generate tick marks and labels
  const ticks = [];
  const labels = [];
  
  for (let i = 0; i <= 8; i++) {
    const tickAngle = -90 + (i * 22.5); // Every 22.5 degrees
    const tickAngleRad = (tickAngle * Math.PI) / 180;
    
    const tickStartX = center + Math.cos(tickAngleRad) * (radius - 5);
    const tickStartY = center + Math.sin(tickAngleRad) * (radius - 5);
    const tickEndX = center + Math.cos(tickAngleRad) * (radius - 15);
    const tickEndY = center + Math.sin(tickAngleRad) * (radius - 15);
    
    ticks.push(
      <Path
        key={`tick-${i}`}
        d={`M ${tickStartX} ${tickStartY} L ${tickEndX} ${tickEndY}`}
        stroke={colors.text}
        strokeWidth="1"
        opacity={0.6}
      />
    );
    
    // Add labels for major ticks
    if (i % 2 === 0) {
      const labelPressure = minPressure + (i / 8) * (maxPressure - minPressure);
      const labelX = center + Math.cos(tickAngleRad) * (radius - 25);
      const labelY = center + Math.sin(tickAngleRad) * (radius - 25);
      
      labels.push(
        <SvgText
          key={`label-${i}`}
          x={labelX}
          y={labelY}
          fontSize="10"
          fill={colors.text}
          textAnchor="middle"
          alignmentBaseline="middle"
          opacity={0.8}
        >
          {Math.round(labelPressure)}
        </SvgText>
      );
    }
  }
  
  // Pressure zone colors
  const getZoneColor = (pressure: number) => {
    if (pressure < 1000) return '#FF6B6B'; // Low pressure - red
    if (pressure > 1025) return '#4ECDC4'; // High pressure - teal
    return '#FFE66D'; // Normal pressure - yellow
  };
  
  const zoneColor = getZoneColor(pressure);
  const trendArrow = getPressureTrendArrow(pressureDelta);
  
  return (
    <View style={[styles.container, { width: size, height: size * 0.7 }]}>
      <Svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
        {/* Outer ring */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={colors.text}
          strokeWidth="2"
          opacity={0.3}
        />
        
        {/* Pressure zone arc */}
        <Path
          d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
          fill="none"
          stroke={zoneColor}
          strokeWidth="4"
          opacity={0.6}
        />
        
        {/* Tick marks */}
        {ticks}
        
        {/* Labels */}
        {labels}
        
        {/* Needle */}
        <Path
          d={`M ${center} ${center} L ${needleX} ${needleY}`}
          stroke={colors.text}
          strokeWidth="3"
          strokeLinecap="round"
        />
        
        {/* Center dot */}
        <Circle
          cx={center}
          cy={center}
          r="4"
          fill={colors.text}
        />
        
        {/* Pressure reading */}
        <SvgText
          x={center}
          y={center + 25}
          fontSize="14"
          fill={colors.text}
          textAnchor="middle"
          fontWeight="bold"
        >
          {Math.round(pressure)} hPa
        </SvgText>
      </Svg>
      
      {/* Trend arrow */}
      <View style={styles.trendContainer}>
        <Text style={styles.trendArrow}>{trendArrow}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  trendArrow: {
    fontSize: 20,
    color: colors.text,
  },
});
