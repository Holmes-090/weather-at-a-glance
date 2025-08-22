
import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Condition = 'sunny' | 'cloudy' | 'rain' | 'snow' | 'clear-night' | 'night' | 'storm';

interface Props {
  condition: Condition;
  isNight: boolean;
}

const { width, height } = Dimensions.get('window');

function useFallingParticles(enabled: boolean, type: 'rain' | 'snow') {
  const count = type === 'rain' ? 18 : 14;
  const anims = useRef(
    [...Array(count)].map(() => ({
      y: new Animated.Value(-Math.random() * height),
      x: Math.random() * width,
      size: type === 'rain' ? (1 + Math.random() * 2) : (2 + Math.random() * 3),
      speed: (type === 'rain' ? 4000 : 7000) * (0.5 + Math.random()),
      delay: Math.random() * 3000,
      drift: (Math.random() - 0.5) * 20,
    }))
  ).current;

  useEffect(() => {
    if (!enabled) return;
    const loops = anims.map(p =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.timing(p.y, {
            toValue: height + 20,
            duration: p.speed,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(p.y, {
            toValue: -20,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      )
    );
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [enabled]);

  return anims;
}

function useTwinklingStars(enabled: boolean) {
  const count = 24;
  const stars = useRef(
    [...Array(count)].map(() => ({
      x: Math.random() * width,
      y: Math.random() * (height * 0.6),
      opacity: new Animated.Value(Math.random()),
      size: 1 + Math.random() * 2,
      delay: Math.random() * 4000,
      duration: 2000 + Math.random() * 3000,
    }))
  ).current;

  useEffect(() => {
    if (!enabled) return;
    const loops = stars.map(s =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(s.delay),
          Animated.timing(s.opacity, { toValue: 1, duration: s.duration, useNativeDriver: true }),
          Animated.timing(s.opacity, { toValue: 0.2, duration: s.duration, useNativeDriver: true }),
        ])
      )
    );
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [enabled]);

  return stars;
}

export default function WeatherBackground({ condition, isNight }: Props) {
  const gradient = useMemo(() => {
    if (isNight) {
      return ['#0B1020', '#0A1020', '#0A0F1A'];
    }
    switch (condition) {
      case 'sunny':
        return ['#5AA9FF', '#3B82F6', '#2563EB'];
      case 'cloudy':
        return ['#6B7280', '#4B5563', '#374151'];
      case 'rain':
        return ['#334155', '#1F2937', '#111827'];
      case 'snow':
        return ['#94A3B8', '#64748B', '#475569'];
      case 'storm':
        return ['#1F2937', '#111827', '#0B0F1A'];
      default:
        return ['#4B6CB7', '#182848', '#0F2027'];
    }
  }, [condition, isNight]);

  const rain = useFallingParticles(condition === 'rain' && !isNight, 'rain');
  const snow = useFallingParticles(condition === 'snow', 'snow');
  const stars = useTwinklingStars(isNight && (condition === 'clear-night' || condition === 'night' || condition === 'sunny'));

  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} />
      {/* Rain */}
      {condition === 'rain' && !isNight && rain.map((p, idx) => (
        <Animated.View
          key={`rain-${idx}`}
          style={{
            position: 'absolute',
            transform: [{ translateY: p.y }, { translateX: p.x }],
            width: 1.5,
            height: 14,
            backgroundColor: 'rgba(255,255,255,0.45)',
            borderRadius: 1,
          }}
          pointerEvents="none"
        />
      ))}
      {/* Snow */}
      {condition === 'snow' && snow.map((p, idx) => (
        <Animated.View
          key={`snow-${idx}`}
          style={{
            position: 'absolute',
            transform: [{ translateY: p.y }, { translateX: p.x }],
            width: p.size,
            height: p.size,
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderRadius: 10,
            opacity: 0.85,
          }}
          pointerEvents="none"
        />
      ))}
      {/* Stars */}
      {isNight && stars.map((s, idx) => (
        <Animated.View
          key={`star-${idx}`}
          style={{
            position: 'absolute',
            top: s.y,
            left: s.x,
            width: s.size,
            height: s.size,
            backgroundColor: 'white',
            borderRadius: 6,
            opacity: s.opacity,
          }}
          pointerEvents="none"
        />
      ))}
    </View>
  );
}
