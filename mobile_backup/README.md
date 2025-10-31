# Mind My Money - React Native Mobile App

## Overview

This is the React Native mobile application for Mind My Money, featuring:

- ✅ Complete authentication flow (Register, Login, Forgot Password)
- ✅ Dashboard with financial overview
- ✅ Account management and bank connections
- ✅ Trial status monitoring and subscription management
- ✅ Profile management with logout functionality
- 🚧 Budget, Goals, Coach, and Credit features (coming soon placeholders)

## Project Structure

```
mobile/
├── src/
│   ├── App.tsx                 # Main app component with navigation
│   ├── components/
│   │   └── TrialStatus.tsx    # Trial status banner component
│   ├── context/
│   │   └── AuthContext.tsx    # Authentication context provider
│   ├── services/
│   │   └── api.ts             # API request helper functions
│   └── screens/
│       ├── auth/              # Authentication screens
│       │   ├── LandingScreen.tsx
│       │   ├── LoginScreen.tsx
│       │   ├── RegisterScreen.tsx
│       │   └── ForgotPasswordScreen.tsx
│       └── main/              # Main app screens
│           ├── DashboardScreen.tsx
│           ├── AccountsScreen.tsx
│           ├── BudgetScreen.tsx     # Placeholder
│           ├── GoalsScreen.tsx      # Placeholder
│           ├── CoachScreen.tsx      # Placeholder
│           ├── CreditScreen.tsx     # Placeholder
│           ├── ProfileScreen.tsx
│           └── SubscribeScreen.tsx
├── package.json
├── index.js
└── app.json
```

## Features

### ✅ Completed Features

1. **Authentication Flow**
   - Landing screen with app introduction
   - User registration with form validation
   - Login with email/password
   - Forgot password functionality
   - Session management with AsyncStorage

2. **Dashboard**
   - Financial overview cards (balance, income, expenses, savings)
   - Quick action buttons for main features
   - Recent transactions display
   - Connected accounts overview
   - Pull-to-refresh functionality

3. **Account Management**
   - View connected bank accounts
   - Account refresh with 12-hour rate limiting
   - Disconnect accounts
   - Connect new accounts (Plaid integration ready)
   - Security information display

4. **Subscription Management**
   - Trial status monitoring
   - Subscription plans display
   - 14-day free trial messaging
   - Upgrade prompts and flows

5. **Profile Management**
   - User profile display
   - Premium/trial status badges
   - Settings navigation (placeholder)
   - Logout functionality

### 🚧 Placeholder Features (Ready for Implementation)

The following screens are created with "Coming Soon" placeholders:
- Budget planning and tracking
- Savings goals management
- AI financial coach
- Credit score monitoring

## Development Setup

### Prerequisites

- Node.js 16+ 
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. Navigate to mobile directory:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. For iOS (macOS only):
   ```bash
   cd ios
   pod install
   cd ..
   ```

### Running the App

1. Start Metro bundler:
   ```bash
   npm start
   ```

2. Run on Android:
   ```bash
   npm run android
   ```

3. Run on iOS (macOS only):
   ```bash
   npm run ios
   ```

## Building for Production

### Android

1. Build release APK:
   ```bash
   npm run build:android
   ```

2. Build App Bundle for Google Play:
   ```bash
   npm run build:android:bundle
   ```

The built files will be in:
- APK: `android/app/build/outputs/apk/release/`
- Bundle: `android/app/build/outputs/bundle/release/`

### iOS

1. Open project in Xcode:
   ```bash
   open ios/MindMyMoney.xcworkspace
   ```

2. Build for release through Xcode interface

## API Integration

The app connects to the backend API running at:
- Development: `http://10.0.2.2:5000` (Android emulator)
- Production: Configure in `src/services/api.ts`

### Key API Endpoints Used

- Authentication: `/api/auth/*`
- User profile: `/api/users/profile`
- Accounts: `/api/accounts`
- Dashboard: `/api/dashboard/overview`
- Transactions: `/api/transactions/recent`
- Subscription: `/api/subscription/status`

## Dependencies

### Core Dependencies
- **React Native 0.72**: Latest stable React Native version
- **React Navigation 6**: Navigation between screens
- **React Native Paper**: Material Design UI components
- **React Hook Form**: Form handling and validation
- **AsyncStorage**: Local data persistence
- **Zod**: Schema validation

### UI/UX Dependencies
- **React Native Vector Icons**: Icon library
- **React Native Linear Gradient**: Gradient backgrounds
- **React Native SVG**: SVG support

## Configuration

### Environment Variables

Configure API endpoints in `src/services/api.ts`:

```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:5000' // Android emulator
  : 'https://your-production-api.com';
```

### Navigation Structure

```
AuthStack (when not logged in):
├── Landing
├── Login  
├── Register
└── ForgotPassword

MainStack (when logged in):
├── MainTabs
│   ├── Dashboard
│   ├── Accounts
│   ├── Budget
│   ├── Goals
│   ├── Coach
│   └── Profile
├── Subscribe
└── Credit
```

## App Store Deployment

### Google Play Store

1. Build signed App Bundle:
   ```bash
   npm run build:android:bundle
   ```

2. Upload to Google Play Console
3. Follow Google Play review guidelines

### Apple App Store

1. Build through Xcode
2. Archive and upload to App Store Connect
3. Follow Apple review guidelines

## Security Notes

- User sessions managed through secure cookies
- Sensitive data stored in AsyncStorage
- API communication over HTTPS
- No sensitive credentials stored in app code

## Support

For technical issues or questions:
- Check the main project README
- Review API documentation
- Contact development team

---

**Version**: 2.0.0
**Last Updated**: January 2025