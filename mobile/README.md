# Mind My Money - React Native Mobile App

This is the React Native mobile version of Mind My Money, providing native iOS and Android apps that connect to the same backend as the web application.

## Features

- **Complete Feature Parity**: All web app features available on mobile
- **Native UI**: Optimized mobile interface with React Navigation
- **Secure Authentication**: AsyncStorage and Keychain integration
- **Real-time Data**: Same backend APIs as web app
- **AI Financial Coach**: Full Money Mind integration
- **Bank Account Integration**: Plaid Link for mobile
- **Cross-platform**: iOS and Android support

## Prerequisites

- Node.js 18+
- React Native CLI
- Xcode (for iOS development)
- Android Studio (for Android development)

## Setup Instructions

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. iOS Setup

```bash
cd ios
pod install
cd ..
```

### 3. Android Setup

Ensure Android Studio is installed and configured with:
- Android SDK
- Android Virtual Device (AVD)

### 4. Environment Configuration

The mobile app connects to the same backend as the web app. Update the API base URL in `src/services/api.ts`:

- Development: `http://localhost:5000`
- Production: `https://mindmymoneyapp.com`

## Running the App

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

### Metro Bundler
```bash
npm start
```

## Project Structure

```
mobile/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Logo.tsx
│   ├── screens/            # Screen components
│   │   ├── LoginScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── CoachScreen.tsx
│   │   ├── AccountsScreen.tsx
│   │   ├── BudgetScreen.tsx
│   │   └── GoalsScreen.tsx
│   ├── services/           # API and auth services
│   │   ├── api.ts
│   │   └── auth.ts
│   └── App.tsx            # Main app component
├── android/               # Android-specific files
├── ios/                   # iOS-specific files
└── package.json
```

## Key Technologies

- **React Native 0.74**: Latest stable version
- **React Navigation 6**: Navigation and routing
- **TanStack Query**: Data fetching and caching
- **AsyncStorage**: Local data persistence
- **Keychain**: Secure credential storage
- **React Native SVG**: Logo and icons
- **TypeScript**: Type safety

## Authentication Flow

1. Login/Register screens for unauthenticated users
2. Secure token storage with Keychain
3. Automatic authentication checking
4. Bottom tab navigation for authenticated users

## API Integration

The mobile app uses the same REST APIs as the web application:

- `/api/auth/*` - Authentication endpoints
- `/api/accounts` - Bank account data
- `/api/transactions` - Transaction history
- `/api/ai/coaching` - Money Mind AI coach
- `/api/budget` - Budget management
- `/api/savings-goals` - Savings goals

## Security

- Secure HTTP-only authentication
- Keychain storage for sensitive data
- API request encryption
- Same security standards as web app

## Development Notes

- The web app remains fully functional alongside mobile development
- Backend APIs are shared between web and mobile
- UI components are mobile-optimized but maintain design consistency
- Real-time data sync between web and mobile clients

## Building for Production

### iOS
1. Open `ios/MindMyMoneyMobile.xcworkspace` in Xcode
2. Configure signing and provisioning profiles
3. Build for release

### Android
```bash
cd android
./gradlew assembleRelease
```

## Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache with `npx react-native start --reset-cache`
2. **iOS build failures**: Clean build folder in Xcode and rebuild
3. **Android build issues**: Clean with `cd android && ./gradlew clean`
4. **API connection issues**: Verify backend URL and network connectivity

### Dependencies

If you encounter dependency conflicts, try:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Contributing

Follow the same development guidelines as the web application. All changes should maintain feature parity between web and mobile versions.