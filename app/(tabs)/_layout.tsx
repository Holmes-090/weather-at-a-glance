
import { Tabs } from 'expo-router';
import { colors } from '../../styles/commonStyles';
import { Ionicons } from '@expo/vector-icons';
import { UnitsProvider } from '../../components/UnitsContext';
import { LocationProvider } from '../../components/LocationContext';

export default function TabsLayout() {
  return (
    <UnitsProvider>
      <LocationProvider>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: 'rgba(16,24,36,0.85)',
              borderTopColor: 'rgba(255,255,255,0.08)',
            },
            tabBarActiveTintColor: colors.text,
            tabBarInactiveTintColor: 'rgba(227,227,227,0.6)',
          }}
        >
          <Tabs.Screen
            name="summary"
            options={{
              title: 'Summary',
              tabBarIcon: ({ color, size }) => <Ionicons name="apps" color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="temperature"
            options={{
              title: 'Temperature',
              tabBarIcon: ({ color, size }) => <Ionicons name="thermometer" color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="precipitation"
            options={{
              title: 'Precipitation',
              tabBarIcon: ({ color, size }) => <Ionicons name="rainy" color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="wind"
            options={{
              title: 'Wind',
              tabBarIcon: ({ color, size }) => <Ionicons name="navigate" color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="humidity"
            options={{
              title: 'Humidity',
              tabBarIcon: ({ color, size }) => <Ionicons name="water" color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="pressure"
            options={{
              title: 'Pressure',
              tabBarIcon: ({ color, size }) => <Ionicons name="speedometer" color={color} size={size} />,
            }}
          />
        </Tabs>
      </LocationProvider>
    </UnitsProvider>
  );
}
