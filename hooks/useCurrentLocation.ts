import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface CurrentLocationResult {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
  permissionGranted: boolean;
}

export function useCurrentLocation(): CurrentLocationResult {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function getCurrentLocation() {
      try {
        setLoading(true);
        setError(null);

        // For web platform, use browser geolocation API
        if (Platform.OS === 'web') {
          if (!navigator.geolocation) {
            throw new Error('Geolocation is not supported by this browser');
          }

          return new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                });
              },
              (error) => {
                let message = 'Location access denied';
                switch (error.code) {
                  case error.PERMISSION_DENIED:
                    message = 'Location access denied by user';
                    break;
                  case error.POSITION_UNAVAILABLE:
                    message = 'Location information unavailable';
                    break;
                  case error.TIMEOUT:
                    message = 'Location request timed out';
                    break;
                }
                reject(new Error(message));
              },
              {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000, // 5 minutes
              }
            );
          });
        }

        // For mobile platforms, use expo-location
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setPermissionGranted(false);
          throw new Error('Location permission denied');
        }

        setPermissionGranted(true);

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000,
        });

        return {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
      } catch (err: any) {
        console.log('Location error:', err.message);
        throw err;
      }
    }

    async function loadLocation() {
      try {
        const coords = await getCurrentLocation();
        if (!cancelled) {
          setLatitude(coords.latitude);
          setLongitude(coords.longitude);
          setPermissionGranted(true);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to get location');
          setPermissionGranted(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadLocation();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    latitude,
    longitude,
    loading,
    error,
    permissionGranted,
  };
}
