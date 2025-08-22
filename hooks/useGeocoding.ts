
export interface GeocodeResult {
  id?: number;
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
}

export async function searchCities(query: string): Promise<GeocodeResult[]> {
  if (!query) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) {
    console.log('Geocoding fetch failed', res.status);
    return [];
  }
  const json = await res.json();
  if (!json.results) return [];
  return json.results.map((r: any) => ({
    id: r.id,
    name: r.name,
    country: r.country,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResult | null> {
  try {
    // Use a reverse geocoding service to find the nearest city
    // We'll use the same Open-Meteo geocoding API by searching for cities near the coordinates
    // This is a workaround since Open-Meteo doesn't have a dedicated reverse geocoding endpoint
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    const res = await fetch(url);
    
    if (!res.ok) {
      console.log('Reverse geocoding fetch failed', res.status);
      return null;
    }
    
    const json = await res.json();
    
    // Extract city name from the response
    const city = json.city || json.locality || json.principalSubdivision || 'Unknown Location';
    const country = json.countryCode || 'Unknown';
    
    return {
      name: city,
      country: country,
      latitude: latitude,
      longitude: longitude,
    };
  } catch (error) {
    console.log('Reverse geocoding error:', error);
    return null;
  }
}
