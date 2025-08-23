# Testing Weather Alerts Guide

## 🇨🇦 Canadian Weather Alerts Added!

I've successfully added Canadian weather alert support using Environment and Climate Change Canada's data sources.

## 🧪 How to Test the Weather Alerts Feature

### Method 1: Using the Demo Screen (Recommended)

1. **Launch your app** using `npx expo start`
2. **Look for the orange "🧪 Test Alerts" button** below the search bar on any weather tab
3. **Tap the "🧪 Test Alerts" button** to open the demo screen
4. **Test different alert types:**
   - 🇨🇦 **Canadian Warning** - Winter storm warning from Environment Canada
   - 🇺🇸 **US Thunderstorm** - Severe thunderstorm from National Weather Service  
   - 🌡️ **Heat Advisory** - Canadian heat advisory (moderate severity)
   - 🌫️ **Fog Advisory** - Canadian fog advisory (minor severity)
   - 🌪️ **TORNADO EMERGENCY** - Extreme severity alert (US)

5. **Test the alert features:**
   - **Expand/Collapse**: Tap the chevron to minimize/maximize alerts
   - **Dismiss**: Tap the X to permanently dismiss alerts
   - **More Info**: Tap "More Info" to open official weather websites
   - **Multiple Alerts**: Add multiple alerts to test the UI

### Method 2: Real Alert Testing

1. **Set your location to a Canadian city** (Toronto, Vancouver, Montreal)
2. **The app will automatically check for real alerts** from Environment Canada
3. **Real alerts will appear when there are active warnings** in your area

### Method 3: Location-Based Testing

The app automatically detects your location and uses the appropriate alert service:
- **🇨🇦 Canada**: Environment and Climate Change Canada alerts
- **🇺🇸 United States**: National Weather Service alerts
- **🌍 Other countries**: No alerts (can be extended in the future)

## 🎯 What to Test

### ✅ Visual Design
- [ ] Red banner appears with proper color coding by severity
- [ ] Icons show correctly for different severity levels
- [ ] Text is readable and properly formatted
- [ ] Alerts don't interfere with the main weather UI

### ✅ Functionality
- [ ] Alerts can be collapsed to a thin banner
- [ ] Alerts can be expanded back to full view
- [ ] Alerts can be dismissed permanently
- [ ] "More Info" links open the correct websites
- [ ] Multiple alerts display properly
- [ ] Dismissed alerts stay dismissed

### ✅ Canadian-Specific Features
- [ ] Canadian alerts show "Environment and Climate Change Canada" as sender
- [ ] Links point to weather.gc.ca
- [ ] Severity mapping works (Warning=Severe, Advisory=Minor, etc.)
- [ ] Canadian location detection works properly

## 🗑️ Cleanup After Testing

When you're done testing, remove these demo components:

1. **Remove the demo button** from `WeatherTabContent.tsx`:
   - Delete the "🧪 Test Alerts" button and its styles
   
2. **Delete demo files**:
   - `components/weather/WeatherAlertDemo.tsx`
   - `app/demo-alerts.tsx`
   - `TESTING_WEATHER_ALERTS.md` (this file)

## 🚨 Production Notes

- The Canadian alert API integration is ready for production
- Real alerts will automatically appear for Canadian users
- The demo functionality is only for testing and should be removed
- Storage works on web (localStorage) and mobile (in-memory for now)

## 🔧 Optional: Add AsyncStorage for Mobile

To enable persistent alert dismissals on mobile, install AsyncStorage:

```bash
npx expo install @react-native-async-storage/async-storage
```

Then update the `useWeatherAlerts.ts` hook to use AsyncStorage instead of the in-memory cache.

## 📱 Expected Behavior

1. **Canadian locations**: Alerts from Environment Canada appear automatically
2. **US locations**: Alerts from National Weather Service appear automatically  
3. **Other locations**: No alerts (system gracefully handles this)
4. **No active alerts**: No banners show (clean interface)
5. **Dismissed alerts**: Stay dismissed until new alerts arrive

Enjoy testing the new Canadian weather alerts feature! 🇨🇦
