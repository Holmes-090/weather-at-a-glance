import React from 'react';
import Svg, { Rect } from 'react-native-svg';

interface HumidityBarProps {
  humidity?: number; // Humidity percentage (0-100)
  width?: number; // Width of the bar in pixels
  height?: number; // Height of the bar in pixels
  fillColor?: string; // Color of the humidity fill
  borderColor?: string; // Color of the border
}

export default function HumidityBar({ 
  humidity = 0, 
  width = 12, 
  height = 24,
  fillColor = '#4A90E2',
  borderColor = '#000000'
}: HumidityBarProps) {
  // Ensure humidity is between 0 and 100
  const clampedHumidity = Math.max(0, Math.min(100, humidity));
  
  // Calculate fill height based on humidity percentage
  const fillHeight = (clampedHumidity / 100) * (height - 2); // -2 for border
  const fillY = height - 1 - fillHeight; // Start from bottom, -1 for border
  
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Background/border rectangle */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="transparent"
        stroke={borderColor}
        strokeWidth="1"
        rx={1} // Slightly rounded corners
      />
      
      {/* Humidity fill rectangle */}
      {clampedHumidity > 0 && (
        <Rect
          x={1}
          y={fillY}
          width={width - 2}
          height={fillHeight}
          fill={fillColor}
          rx={0.5} // Slightly rounded corners for fill
        />
      )}
    </Svg>
  );
}
