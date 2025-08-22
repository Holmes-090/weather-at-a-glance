
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import { reverseGeocode } from '../hooks/useGeocoding';

export type LocationType = { name: string; latitude: number; longitude: number; country?: string };

type LocationContextType = {
  location: LocationType;
  setLocation: (loc: LocationType) => void;
};

const DEFAULT_LOCATION: LocationType = {
  name: 'San Francisco',
  latitude: 37.7749,
  longitude: -122.4194,
  country: 'US',
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<LocationType>(() => {
    if (Platform.OS === 'web') {
      try {
        const raw = localStorage.getItem('location');
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.log('Failed to read location from storage');
      }
    }
    return DEFAULT_LOCATION;
  });

  const [hasAttemptedAutoLocation, setHasAttemptedAutoLocation] = useState(false);
  const currentLocation = useCurrentLocation();

  // Auto-detect location on first load if no saved location exists
  useEffect(() => {
    if (hasAttemptedAutoLocation) return;

    // Only auto-detect if we're still using the default location
    const isUsingDefaultLocation = 
      location.latitude === DEFAULT_LOCATION.latitude && 
      location.longitude === DEFAULT_LOCATION.longitude;

    if (!isUsingDefaultLocation) {
      setHasAttemptedAutoLocation(true);
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
          }
        })
        .catch((error) => {
          console.log('Error during reverse geocoding:', error);
        });
    } else if (currentLocation.error && !currentLocation.loading) {
      // Location detection failed, stick with default
      setHasAttemptedAutoLocation(true);
      console.log('Location detection failed:', currentLocation.error);
    }
  }, [currentLocation, location, hasAttemptedAutoLocation]);

  // Save location to storage when it changes
  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem('location', JSON.stringify(location));
      } catch (e) {
        console.log('Failed to save location', e);
      }
    }
  }, [location]);

  const value = useMemo(() => ({ location, setLocation }), [location]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
}
