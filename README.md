# Weather App 🌤️

A React Native weather app built with Expo that automatically detects your location and shows current weather conditions with a beautiful, modern interface.

## ✨ Features

- 🌍 **Automatic location detection** - Get weather for your current location instantly
- 🌤️ **Real-time weather data** - Current conditions, hourly forecasts, and 7-day outlook
- 📊 **Multiple weather metrics** - Temperature, precipitation, wind speed, and humidity
- 📱 **Cross-platform** - Works on iOS, Android, and Web
- 🔒 **Privacy-first** - Location data stays on your device
- 🎨 **Beautiful UI** - Modern design with weather-appropriate backgrounds
- ⚡ **Fast & responsive** - Built with React Native and Expo

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd weather-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
# For web development
npx expo start --web

# For mobile development
npx expo start
```

### Testing on Mobile

1. Install **Expo Go** app on your phone:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Scan the QR code displayed in your terminal
3. Grant location permission when prompted
4. Enjoy your personalized weather experience!

## 🛠️ Available Scripts

```bash
npm run web          # Start web development server
npm run dev          # Start development server with tunnel
npm run android      # Start Android development
npm run ios          # Start iOS development (requires macOS)
npm run build:web    # Build for web deployment
npm run build:android # Build for Android
npm run lint         # Run code linting
```

## 📱 Platform Support

- **iOS** - Full native support with location permissions
- **Android** - Full native support with location permissions  
- **Web** - Browser geolocation API support

## 🔧 Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **State Management**: React Context API
- **Styling**: React Native StyleSheet
- **Location Services**: Expo Location
- **HTTP Client**: Fetch API

## 🌐 APIs Used

- **[Open-Meteo Weather API](https://open-meteo.com/)** - Free, open-source weather data
  - No API key required
  - Accurate forecasts and historical data
  - Global coverage

- **[BigDataCloud Geocoding API](https://www.bigdatacloud.com/)** - Free reverse geocoding
  - Convert coordinates to city names
  - No API key required for client-side usage

## 🔒 Privacy & Security

This app is designed with privacy as a priority:

- ✅ **No API keys** - Uses free, public APIs
- ✅ **No user tracking** - No analytics or data collection
- ✅ **Local storage only** - Location preferences stored on your device
- ✅ **Minimal permissions** - Only requests location when needed
- ✅ **Open source** - Full transparency of data handling

See [PRIVACY.md](PRIVACY.md) for detailed privacy information.

## 📂 Project Structure

```
weather-app/
├── app/                    # App screens and routing
│   ├── (tabs)/            # Tab-based navigation
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
│   └── weather/          # Weather-specific components
├── hooks/                # Custom React hooks
│   ├── useWeather.ts     # Weather data fetching
│   ├── useGeocoding.ts   # Location services
│   └── useCurrentLocation.ts # Device location
├── styles/               # Styling and themes
├── types/                # TypeScript type definitions
└── utils/                # Helper functions
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Open-Meteo](https://open-meteo.com/) for providing free weather data
- [BigDataCloud](https://www.bigdatacloud.com/) for geocoding services
- [Expo](https://expo.dev/) for the amazing development platform
- [React Native](https://reactnative.dev/) community

## 📧 Support

If you have any questions or need help, please open an issue in the GitHub repository.

---

Made with ❤️ and ☕ for weather enthusiasts everywhere!
