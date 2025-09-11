import React from 'react';
import Svg, { Circle, Path, Line, Text as SvgText } from 'react-native-svg';

interface CompassRoseProps {
  windDirection?: number; // Wind direction in degrees (0 = North)
  size?: number; // Size of the compass in pixels
  color?: string; // Color of the compass
}

export default function CompassRose({ 
  windDirection = 0, 
  size = 26, 
  color = '#E3E3E3' 
}: CompassRoseProps) {
  const radius = size / 2;
  const center = radius;
  
  // Convert wind direction to radians for rotation
  // Wind direction is where wind is coming FROM, so we rotate the arrow accordingly
  const angleRad = (windDirection * Math.PI) / 180;
  
  // Calculate arrow points
  const arrowLength = radius * 0.7;
  const arrowWidth = radius * 0.3;
  
  // Arrow tip (pointing in wind direction)
  const tipX = center + arrowLength * Math.sin(angleRad);
  const tipY = center - arrowLength * Math.cos(angleRad);
  
  // Arrow base points
  const baseLeftX = center - (arrowWidth / 2) * Math.cos(angleRad);
  const baseLeftY = center - (arrowWidth / 2) * Math.sin(angleRad);
  const baseRightX = center + (arrowWidth / 2) * Math.cos(angleRad);
  const baseRightY = center + (arrowWidth / 2) * Math.sin(angleRad);
  
  // Arrow tail
  const tailX = center - (arrowLength * 0.4) * Math.sin(angleRad);
  const tailY = center + (arrowLength * 0.4) * Math.cos(angleRad);
  
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Outer circle */}
      <Circle
        cx={center}
        cy={center}
        r={radius - 1}
        fill="none"
        stroke={color}
        strokeWidth="1"
        opacity={0.6}
      />
      
      {/* Cardinal direction markers */}
      {/* North */}
      <Line
        x1={center}
        y1={2}
        x2={center}
        y2={6}
        stroke={color}
        strokeWidth="1"
        opacity={0.4}
      />
      
      {/* East */}
      <Line
        x1={size - 2}
        y1={center}
        x2={size - 6}
        y2={center}
        stroke={color}
        strokeWidth="1"
        opacity={0.4}
      />
      
      {/* South */}
      <Line
        x1={center}
        y1={size - 2}
        x2={center}
        y2={size - 6}
        stroke={color}
        strokeWidth="1"
        opacity={0.4}
      />
      
      {/* West */}
      <Line
        x1={2}
        y1={center}
        x2={6}
        y2={center}
        stroke={color}
        strokeWidth="1"
        opacity={0.4}
      />
      
      {/* Wind direction arrow */}
      <Path
        d={`M ${tipX} ${tipY} L ${baseLeftX} ${baseLeftY} L ${tailX} ${tailY} L ${baseRightX} ${baseRightY} Z`}
        fill={color}
        stroke={color}
        strokeWidth="0.5"
      />
      
      {/* Center dot */}
      <Circle
        cx={center}
        cy={center}
        r={1.5}
        fill={color}
        opacity={0.8}
      />
    </Svg>
  );
}
