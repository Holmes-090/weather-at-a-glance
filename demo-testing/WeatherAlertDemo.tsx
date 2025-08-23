import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import WeatherAlert, { WeatherAlertData } from './WeatherAlert';
import { colors } from '../../styles/commonStyles';

// Demo component to test weather alerts - REMOVE THIS IN PRODUCTION
export default function WeatherAlertDemo() {
  const [activeAlerts, setActiveAlerts] = useState<WeatherAlertData[]>([]);

  // Sample alerts for different scenarios
  const demoAlerts: WeatherAlertData[] = [
    {
      id: 'demo-canadian-warning',
      title: 'Winter Storm Warning',
      description: 'Environment and Climate Change Canada has issued a Winter Storm Warning. Heavy snow of 15 to 25 cm is expected. Strong winds gusting to 70 km/h will cause blowing snow and reduced visibility.',
      severity: 'severe',
      url: 'https://weather.gc.ca/warnings/index_e.html',
      sender: 'Environment and Climate Change Canada',
      area: 'Greater Toronto Area',
      expires: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
    },
    {
      id: 'demo-us-thunderstorm',
      title: 'Severe Thunderstorm Warning',
      description: 'The National Weather Service has issued a Severe Thunderstorm Warning for your area. Expect damaging winds up to 70 mph and large hail. Take shelter immediately.',
      severity: 'severe',
      url: 'https://weather.gov',
      sender: 'National Weather Service',
      area: 'San Francisco Bay Area',
      expires: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
    },
    {
      id: 'demo-heat-advisory',
      title: 'Heat Advisory',
      description: 'A Heat Advisory remains in effect. High temperatures of 32-35°C combined with humidex values near 40°C are expected. Drink plenty of water and seek air conditioning.',
      severity: 'moderate',
      url: 'https://weather.gc.ca/warnings/index_e.html',
      sender: 'Environment and Climate Change Canada',
      area: 'Southern Ontario',
      expires: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now
    },
    {
      id: 'demo-fog-advisory',
      title: 'Fog Advisory',
      description: 'Dense fog is reducing visibility to less than 1 km in many areas. Exercise caution while driving and allow extra time for travel.',
      severity: 'minor',
      url: 'https://weather.gc.ca/warnings/index_e.html',
      sender: 'Environment and Climate Change Canada',
      area: 'Metro Vancouver',
      expires: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
    },
    {
      id: 'demo-tornado-emergency',
      title: 'TORNADO EMERGENCY',
      description: 'TORNADO EMERGENCY for downtown areas! A confirmed large and destructive tornado is on the ground. TAKE COVER NOW! Move to the lowest floor of a sturdy building and away from windows.',
      severity: 'extreme',
      url: 'https://weather.gov',
      sender: 'National Weather Service',
      area: 'Oklahoma City Metro',
      expires: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour from now
    },
  ];

  const handleDismiss = (alertId: string) => {
    console.log(`Demo alert ${alertId} dismissed`);
    setActiveAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const addAlert = (alert: WeatherAlertData) => {
    setActiveAlerts(prev => {
      // Don't add if already exists
      if (prev.find(a => a.id === alert.id)) return prev;
      return [...prev, alert];
    });
  };

  const clearAllAlerts = () => {
    setActiveAlerts([]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Weather Alert Demo</Text>
      <Text style={styles.subtitle}>
        Use this to test weather alert functionality. In production, remove this component.
      </Text>

      {/* Control Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.canadianButton]} 
          onPress={() => addAlert(demoAlerts[0])}
        >
          <Text style={styles.buttonText}>🇨🇦 Canadian Warning</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.usButton]} 
          onPress={() => addAlert(demoAlerts[1])}
        >
          <Text style={styles.buttonText}>🇺🇸 US Thunderstorm</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.moderateButton]} 
          onPress={() => addAlert(demoAlerts[2])}
        >
          <Text style={styles.buttonText}>🌡️ Heat Advisory</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.minorButton]} 
          onPress={() => addAlert(demoAlerts[3])}
        >
          <Text style={styles.buttonText}>🌫️ Fog Advisory</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.extremeButton]} 
          onPress={() => addAlert(demoAlerts[4])}
        >
          <Text style={styles.buttonText}>🌪️ TORNADO EMERGENCY</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={clearAllAlerts}
        >
          <Text style={styles.buttonText}>🗑️ Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Active Alerts */}
      <View style={styles.alertsSection}>
        <Text style={styles.sectionTitle}>Active Demo Alerts ({activeAlerts.length})</Text>
        {activeAlerts.length === 0 ? (
          <Text style={styles.noAlertsText}>No active alerts. Tap buttons above to test.</Text>
        ) : (
          activeAlerts.map((alert) => (
            <WeatherAlert
              key={alert.id}
              alert={alert}
              onDismiss={handleDismiss}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1426',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  canadianButton: {
    backgroundColor: '#FF0000',
  },
  usButton: {
    backgroundColor: '#FF6B35',
  },
  moderateButton: {
    backgroundColor: '#FFA500',
  },
  minorButton: {
    backgroundColor: '#FFD700',
  },
  extremeButton: {
    backgroundColor: '#8B0000',
  },
  clearButton: {
    backgroundColor: '#666666',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  alertsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  noAlertsText: {
    color: colors.text,
    opacity: 0.6,
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
});
