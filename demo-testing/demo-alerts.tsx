import React from 'react';
import { SafeAreaView } from 'react-native';
import WeatherAlertDemo from '../components/weather/WeatherAlertDemo';

export default function DemoAlertsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1426' }}>
      <WeatherAlertDemo />
    </SafeAreaView>
  );
}
