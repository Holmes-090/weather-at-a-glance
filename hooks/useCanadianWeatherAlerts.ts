import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeatherAlertData } from '../components/weather/WeatherAlert';

// Cache for Canadian alerts to minimize API calls
interface CachedAlerts {
  alerts: WeatherAlertData[];
  timestamp: number;
  location: { lat: number; lon: number };
}

class CanadianAlertsCache {
  private static CACHE_KEY = 'canadian_weather_alerts_cache';
  private static CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache
  
  static async get(location: { latitude: number; longitude: number }): Promise<WeatherAlertData[] | null> {
    try {
      const cached = await this.getFromStorage();
      if (!cached) return null;
      
      // Check if cache is valid
      const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION;
      const isSameLocation = Math.abs(cached.location.lat - location.latitude) < 0.1 && 
                           Math.abs(cached.location.lon - location.longitude) < 0.1;
      
      if (isExpired || !isSameLocation) {
        await this.clear();
        return null;
      }
      
      return cached.alerts;
    } catch (error) {
      console.log('Canadian alerts cache read error:', error);
      return null;
    }
  }
  
  static async set(alerts: WeatherAlertData[], location: { latitude: number; longitude: number }): Promise<void> {
    try {
      const cacheData: CachedAlerts = {
        alerts,
        timestamp: Date.now(),
        location: { lat: location.latitude, lon: location.longitude }
      };
      
      if (Platform.OS === 'web') {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
      } else {
        await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
      }
    } catch (error) {
      console.log('Canadian alerts cache write error:', error);
    }
  }
  
  static async clear(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(this.CACHE_KEY);
      } else {
        await AsyncStorage.removeItem(this.CACHE_KEY);
      }
    } catch (error) {
      console.log('Canadian alerts cache clear error:', error);
    }
  }
  
  private static async getFromStorage(): Promise<CachedAlerts | null> {
    try {
      let cached: string | null;
      if (Platform.OS === 'web') {
        cached = localStorage.getItem(this.CACHE_KEY);
      } else {
        cached = await AsyncStorage.getItem(this.CACHE_KEY);
      }
      
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      return null;
    }
  }
}

// Simple in-memory storage for dismissed alerts
let dismissedAlertsCache: Set<string> = new Set();

export function useCanadianWeatherAlerts(lat: number, lon: number, refreshTrigger?: number) {
  const [alerts, setAlerts] = useState<WeatherAlertData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Load dismissed alerts from storage
  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        const dismissed = localStorage.getItem('dismissedCanadianWeatherAlerts');
        if (dismissed) {
          setDismissedAlerts(new Set(JSON.parse(dismissed)));
        }
      } catch (e) {
        console.log('Failed to load dismissed Canadian alerts from storage');
      }
    } else {
      setDismissedAlerts(new Set(dismissedAlertsCache));
    }
  }, []);

  // Save dismissed alerts to storage
  const saveDismissedAlerts = (dismissed: Set<string>) => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem('dismissedCanadianWeatherAlerts', JSON.stringify([...dismissed]));
      } catch (e) {
        console.log('Failed to save dismissed Canadian alerts to storage');
      }
    } else {
      dismissedAlertsCache = dismissed;
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

      // Check if location is in Canada (approximate bounds)
      const isCanada = lat >= 41.7 && lat <= 83.1 && lon >= -141.0 && lon <= -52.6;
      
      if (!isCanada) {
        // Not in Canada, no alerts needed
        setAlerts([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Try to get from cache first
        const cachedAlerts = await CanadianAlertsCache.get({ latitude: lat, longitude: lon });
        if (cachedAlerts) {
          if (!cancelled) {
            setAlerts(cachedAlerts);
            setLoading(false);
          }
          return;
        }

        // Fetch fresh alerts
        const fetchedAlerts = await fetchCanadianAlerts(lat, lon);
        
        // Cache the results
        await CanadianAlertsCache.set(fetchedAlerts, { latitude: lat, longitude: lon });
        
        if (!cancelled) {
          setAlerts(fetchedAlerts);
        }
      } catch (e: any) {
        console.log('Canadian weather alerts fetch error', e?.message || e);
        if (!cancelled) {
          setError(e?.message || 'Failed to fetch Canadian weather alerts');
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
  }, [lat, lon, refreshTrigger]);

  // Filter out dismissed alerts
  const activeAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));

  return { alerts: activeAlerts, loading, error, dismissAlert };
}

// Fetch Canadian weather alerts using a more reliable approach
async function fetchCanadianAlerts(lat: number, lon: number): Promise<WeatherAlertData[]> {
  try {
    console.log('Fetching Canadian weather alerts for coordinates:', lat, lon);
    
    // Try multiple approaches to get Canadian weather alerts
    const approaches = [
      () => fetchFromEnvironmentCanadaAPI(lat, lon),
      () => fetchFromProvincialRSS(lat, lon),
      () => fetchFromAlternativeAPI(lat, lon)
    ];
    
    for (const approach of approaches) {
      try {
        const alerts = await approach();
        if (alerts && alerts.length > 0) {
          console.log(`Successfully fetched ${alerts.length} Canadian weather alerts`);
          return alerts;
        }
      } catch (error) {
        console.log('Approach failed, trying next:', error);
        continue;
      }
    }
    
    console.log('All Canadian weather alert approaches failed, returning empty array');
    return [];
    
  } catch (error) {
    console.log('Canadian weather alerts fetch failed:', error);
    return [];
  }
}

// Approach 1: Try the original Environment Canada API (in case it's working again)
async function fetchFromEnvironmentCanadaAPI(lat: number, lon: number): Promise<WeatherAlertData[]> {
  const response = await fetch(`https://api.weather.gc.ca/collections/weather-alerts/items?bbox=${lon-1},${lat-1},${lon+1},${lat+1}&f=json`, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'WeatherApp/1.0'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Environment Canada API returned ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.features || !Array.isArray(data.features)) {
    return [];
  }
  
  return data.features.map((feature: any) => {
    const props = feature.properties;
    
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
}

// Approach 2: Try to fetch from provincial RSS feeds
async function fetchFromProvincialRSS(lat: number, lon: number): Promise<WeatherAlertData[]> {
  const province = getProvinceFromCoordinates(lat, lon);
  if (!province) return [];
  
  // Provincial RSS feed URLs
  const rssFeeds = {
    'ON': 'https://weather.gc.ca/rss/warning/on-1_e.xml',
    'BC': 'https://weather.gc.ca/rss/warning/bc-1_e.xml',
    'QC': 'https://weather.gc.ca/rss/warning/qc-1_e.xml',
    'AB': 'https://weather.gc.ca/rss/warning/ab-1_e.xml',
    'MB': 'https://weather.gc.ca/rss/warning/mb-1_e.xml',
    'SK': 'https://weather.gc.ca/rss/warning/sk-1_e.xml',
    'NS': 'https://weather.gc.ca/rss/warning/ns-1_e.xml',
    'NB': 'https://weather.gc.ca/rss/warning/nb-1_e.xml',
    'NL': 'https://weather.gc.ca/rss/warning/nl-1_e.xml',
    'PE': 'https://weather.gc.ca/rss/warning/pe-1_e.xml',
    'YT': 'https://weather.gc.ca/rss/warning/yt-1_e.xml',
    'NT': 'https://weather.gc.ca/rss/warning/nt-1_e.xml',
    'NU': 'https://weather.gc.ca/rss/warning/nu-1_e.xml',
  };
  
  const rssUrl = rssFeeds[province];
  if (!rssUrl) return [];
  
  try {
    const response = await fetch(rssUrl);
    if (!response.ok) {
      throw new Error(`RSS feed returned ${response.status}`);
    }
    
    const xmlText = await response.text();
    
    // Simple XML parsing for RSS feeds
    // This is a basic implementation - in production you'd want a proper XML parser
    const alerts: WeatherAlertData[] = [];
    
    // Extract items from RSS feed
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemXml = match[1];
      
      const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
      const descriptionMatch = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/);
      const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
      
      if (titleMatch && descriptionMatch) {
        const title = titleMatch[1].trim();
        const description = descriptionMatch[1].trim();
        const link = linkMatch ? linkMatch[1].trim() : undefined;
        
        // Determine severity from title
        let severity: WeatherAlertData['severity'] = 'moderate';
        const titleLower = title.toLowerCase();
        
        if (titleLower.includes('warning')) {
          severity = 'severe';
        } else if (titleLower.includes('watch')) {
          severity = 'moderate';
        } else if (titleLower.includes('advisory')) {
          severity = 'minor';
        } else if (titleLower.includes('emergency')) {
          severity = 'extreme';
        }
        
        alerts.push({
          id: `rss-${Date.now()}-${Math.random()}`,
          title,
          description,
          severity,
          url: link,
          sender: 'Environment and Climate Change Canada',
          area: getProvinceName(province),
          expires: undefined,
        });
      }
    }
    
    return alerts;
  } catch (error) {
    console.log('RSS feed parsing failed:', error);
    return [];
  }
}

// Approach 3: Try alternative APIs or services
async function fetchFromAlternativeAPI(lat: number, lon: number): Promise<WeatherAlertData[]> {
  // This could be implemented with:
  // - Third-party weather alert services
  // - Proxy services that aggregate Canadian alerts
  // - Other government or commercial APIs
  
  // For now, return empty array
  // In the future, this could be replaced with actual API calls
  return [];
}

// Helper function to determine province from coordinates
function getProvinceFromCoordinates(lat: number, lon: number): string | null {
  // Simple province detection based on coordinates
  // This is a basic implementation and could be improved
  
  if (lat >= 41.7 && lat <= 49.0 && lon >= -95.0 && lon <= -74.0) return 'ON';
  if (lat >= 48.0 && lat <= 60.0 && lon >= -139.0 && lon <= -114.0) return 'BC';
  if (lat >= 44.0 && lat <= 62.0 && lon >= -80.0 && lon <= -57.0) return 'QC';
  if (lat >= 49.0 && lat <= 60.0 && lon >= -120.0 && lon <= -110.0) return 'AB';
  if (lat >= 49.0 && lat <= 60.0 && lon >= -102.0 && lon <= -95.0) return 'MB';
  if (lat >= 49.0 && lat <= 60.0 && lon >= -110.0 && lon <= -102.0) return 'SK';
  if (lat >= 43.0 && lat <= 47.0 && lon >= -66.0 && lon <= -59.0) return 'NS';
  if (lat >= 45.0 && lat <= 48.0 && lon >= -69.0 && lon <= -63.0) return 'NB';
  if (lat >= 46.0 && lat <= 61.0 && lon >= -67.0 && lon <= -52.0) return 'NL';
  if (lat >= 46.0 && lat <= 47.0 && lon >= -64.0 && lon <= -62.0) return 'PE';
  if (lat >= 60.0 && lat <= 70.0 && lon >= -141.0 && lon <= -123.0) return 'YT';
  if (lat >= 60.0 && lat <= 70.0 && lon >= -123.0 && lon <= -102.0) return 'NT';
  if (lat >= 60.0 && lat <= 83.0 && lon >= -102.0 && lon <= -52.0) return 'NU';
  
  return null;
}

// Helper function to get province name
function getProvinceName(provinceCode: string): string {
  const provinceNames = {
    'ON': 'Ontario',
    'BC': 'British Columbia',
    'QC': 'Quebec',
    'AB': 'Alberta',
    'MB': 'Manitoba',
    'SK': 'Saskatchewan',
    'NS': 'Nova Scotia',
    'NB': 'New Brunswick',
    'NL': 'Newfoundland and Labrador',
    'PE': 'Prince Edward Island',
    'YT': 'Yukon',
    'NT': 'Northwest Territories',
    'NU': 'Nunavut',
  };
  
  return provinceNames[provinceCode] || provinceCode;
}

