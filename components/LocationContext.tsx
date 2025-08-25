
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import { reverseGeocode } from '../hooks/useGeocoding';

export type LocationType = { name: string; latitude: number; longitude: number; country?: string };

type LocationContextType = {
  location: LocationType | null;
  setLocation: (loc: LocationType) => void;
  isInitializing: boolean;
};

const DEFAULT_LOCATION: LocationType = {
  name: 'San Francisco',
  latitude: 37.7749,
  longitude: -122.4194,
  country: 'US',
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<LocationType | null>(() => {
    if (Platform.OS === 'web') {
      try {
        const raw = localStorage.getItem('location');
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.log('Failed to read location from storage');
      }
    }
    return null; // Don't use default location immediately
  });

  const [hasAttemptedAutoLocation, setHasAttemptedAutoLocation] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const currentLocation = useCurrentLocation();

  // Auto-detect location on first load if no saved location exists
  useEffect(() => {
    if (hasAttemptedAutoLocation) return;

    // If we have a saved location from storage, use it and skip auto-detection
    if (location) {
      setHasAttemptedAutoLocation(true);
      setIsInitializing(false);
      return;
    }

    // If we have current location coordinates, convert them to a location
    if (currentLocation.latitude && currentLocation.longitude && !currentLocation.loading) {
      setHasAttemptedAutoLocation(true);
      
      reverseGeocode(currentLocation.latitude, currentLocation.longitude)
        .then((geocoded) => {
          if (geocoded) {
            const newLocation: LocationType = {
              name: geocoded.name,
              latitude: currentLocation.latitude!,
              longitude: currentLocation.longitude!,
              country: geocoded.country,
            };
            setLocation(newLocation);
            console.log('Auto-detected location:', newLocation.name);
          } else {
            console.log('Failed to reverse geocode coordinates, using default location');
            setLocation(DEFAULT_LOCATION);
          }
          setIsInitializing(false);
        })
        .catch((error) => {
          console.log('Error during reverse geocoding:', error);
          setLocation(DEFAULT_LOCATION);
          setIsInitializing(false);
        });
    } else if (currentLocation.error && !currentLocation.loading) {
      // Location detection failed, use default location
      setHasAttemptedAutoLocation(true);
      console.log('Location detection failed:', currentLocation.error);
      setLocation(DEFAULT_LOCATION);
      setIsInitializing(false);
    }
  }, [currentLocation, location, hasAttemptedAutoLocation]);

  // Save location to storage when it changes
  useEffect(() => {
    if (location && Platform.OS === 'web') {
      try {
        localStorage.setItem('location', JSON.stringify(location));
      } catch (e) {
        console.log('Failed to save location', e);
      }
    }
  }, [location]);

  const value = useMemo(() => ({ location, setLocation, isInitializing }), [location, isInitializing]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
}
