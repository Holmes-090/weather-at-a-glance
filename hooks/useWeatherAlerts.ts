import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { WeatherAlertData } from '../components/weather/WeatherAlert';

// Simple in-memory storage for mobile platforms (until AsyncStorage is added)
let mobileStorageCache: Set<string> = new Set();

export function useWeatherAlerts(lat: number, lon: number) {
  const [alerts, setAlerts] = useState<WeatherAlertData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Load dismissed alerts from storage
  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        const dismissed = localStorage.getItem('dismissedWeatherAlerts');
        if (dismissed) {
          setDismissedAlerts(new Set(JSON.parse(dismissed)));
        }
      } catch (e) {
        console.log('Failed to load dismissed alerts from storage');
      }
    } else {
      // Use in-memory cache for mobile platforms
      setDismissedAlerts(new Set(mobileStorageCache));
    }
  }, []);

  // Save dismissed alerts to storage
  const saveDismissedAlerts = (dismissed: Set<string>) => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem('dismissedWeatherAlerts', JSON.stringify([...dismissed]));
      } catch (e) {
        console.log('Failed to save dismissed alerts to storage');
      }
    } else {
      // Save to in-memory cache for mobile platforms
      mobileStorageCache = dismissed;
    }
  };

  const dismissAlert = (alertId: string) => {
    const newDismissed = new Set(dismissedAlerts);
    newDismissed.add(alertId);
    setDismissedAlerts(newDismissed);
    saveDismissedAlerts(newDismissed);
  };

  useEffect(() => {
    let cancelled = false;

    async function fetchAlerts() {
      if (!lat || !lon) return;

      try {
        setLoading(true);
        setError(null);

        // Try different APIs based on location
        let fetchedAlerts: WeatherAlertData[] = [];
        
        // Check if location is in Canada (approximate bounds)
        const isCanada = lat >= 41.7 && lat <= 83.1 && lon >= -141.0 && lon <= -52.6;
        
        if (isCanada) {
          // Try Canadian alerts first
          fetchedAlerts = await fetchCanadianAlerts(lat, lon);
        } else {
          // Try US National Weather Service API
          fetchedAlerts = await fetchNWSAlerts(lat, lon);
        }
        
        if (!cancelled) {
          setAlerts(fetchedAlerts);
        }
      } catch (e: any) {
        console.log('Weather alerts fetch error', e?.message || e);
        if (!cancelled) {
          setError(e?.message || 'Failed to fetch weather alerts');
          setAlerts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchAlerts();
    return () => { cancelled = true; };
  }, [lat, lon]);

  // Filter out dismissed alerts
  const activeAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));

  return { alerts: activeAlerts, loading, error, dismissAlert };
}

async function fetchNWSAlerts(lat: number, lon: number): Promise<WeatherAlertData[]> {
  try {
    // First, get the NWS point data to find the forecast office and grid
    const pointResponse = await fetch(`https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`);
    
    if (!pointResponse.ok) {
      throw new Error('Failed to get NWS point data');
    }
    
    const pointData = await pointResponse.json();
    const forecastZone = pointData.properties.forecastZone;
    const county = pointData.properties.county;
    
    // Get alerts for the forecast zone and county
    const alertsResponse = await fetch(`https://api.weather.gov/alerts/active?zone=${forecastZone}&area=${county}`);
    
    if (!alertsResponse.ok) {
      throw new Error('Failed to fetch NWS alerts');
    }
    
    const alertsData = await alertsResponse.json();
    
    return alertsData.features.map((feature: any) => {
      const props = feature.properties;
      
      // Map NWS severity to our severity levels
      let severity: WeatherAlertData['severity'] = 'moderate';
      if (props.severity === 'Minor') severity = 'minor';
      else if (props.severity === 'Moderate') severity = 'moderate';
      else if (props.severity === 'Severe') severity = 'severe';
      else if (props.severity === 'Extreme') severity = 'extreme';
      
      return {
        id: props.id || `nws-${Date.now()}-${Math.random()}`,
        title: props.headline || props.event || 'Weather Alert',
        description: props.description || props.instruction || 'Check local weather service for details.',
        severity,
        url: props.web || undefined,
        sender: props.senderName || 'National Weather Service',
        area: props.areaDesc || 'Local Area',
        expires: props.expires || undefined,
      };
    });
  } catch (error) {
    // If NWS fails (likely international location), return empty array
    console.log('NWS alerts not available for this location:', error);
    return [];
  }
}

// Canadian weather alerts from Environment and Climate Change Canada
async function fetchCanadianAlerts(lat: number, lon: number): Promise<WeatherAlertData[]> {
  try {
    // Use a more reliable approach - try the MSC Datamart first
    const response = await fetch(`https://api.weather.gc.ca/collections/weather-alerts/items?bbox=${lon-1},${lat-1},${lon+1},${lat+1}&f=json`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'WeatherApp/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Canadian alerts API returned ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Canadian alerts API returned non-JSON response');
    }
    
    const data = await response.json();
    
    if (!data.features || !Array.isArray(data.features)) {
      console.log('No Canadian alerts found for this location');
      return [];
    }
    
    return data.features.map((feature: any) => {
      const props = feature.properties;
      
      // Map Canadian severity levels to our system
      let severity: WeatherAlertData['severity'] = 'moderate';
      const alertType = props.alert_type?.toLowerCase() || '';
      const headline = (props.headline || props.title || '')?.toLowerCase() || '';
      
      if (headline.includes('warning') || alertType.includes('warning')) {
        severity = 'severe';
      } else if (headline.includes('watch') || alertType.includes('watch')) {
        severity = 'moderate';
      } else if (headline.includes('advisory') || alertType.includes('advisory')) {
        severity = 'minor';
      } else if (headline.includes('emergency') || alertType.includes('emergency')) {
        severity = 'extreme';
      }
      
      return {
        id: props.identifier || props.id || `ca-${Date.now()}-${Math.random()}`,
        title: props.headline || props.title || props.event || 'Weather Alert',
        description: props.description || props.instruction || props.summary || 'Check Environment Canada for details.',
        severity,
        url: props.url || `https://weather.gc.ca/warnings/index_e.html`,
        sender: 'Environment and Climate Change Canada',
        area: props.area_name || props.region_name || props.location || 'Local Area',
        expires: props.expires || props.expiry_date || undefined,
      };
    });
  } catch (error) {
    console.log('Primary Canadian alerts API failed:', error);
    
    // Fallback: Try a simpler RSS-based approach
    return await fetchCanadianAlertsRSS(lat, lon);
  }
}

// Fallback RSS-based Canadian alerts
async function fetchCanadianAlertsRSS(lat: number, lon: number): Promise<WeatherAlertData[]> {
  try {
    // Log that we're using fallback
    console.log('Using fallback Canadian alerts method for coordinates:', lat, lon);
    
    // For now, return empty array - real RSS parsing could be implemented here
    // You could parse provincial RSS feeds like:
    // - Ontario: https://weather.gc.ca/rss/warning/on-1_e.xml
    // - BC: https://weather.gc.ca/rss/warning/bc-1_e.xml
    // - Quebec: https://weather.gc.ca/rss/warning/qc-1_e.xml
    
    return [];
  } catch (error) {
    console.log('Canadian RSS alerts fallback failed:', error);
    return [];
  }
}

// Fallback function for other international locations
async function fetchInternationalAlerts(lat: number, lon: number): Promise<WeatherAlertData[]> {
  // For now, return empty array
  // In the future, this could integrate with other international weather alert services
  return [];
}
