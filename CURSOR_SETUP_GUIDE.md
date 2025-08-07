# Mind My Money Mobile App Setup in Cursor IDE

## Quick Setup for Google Play Store Deployment

### Step 1: Create New React Native Project in Cursor
```bash
npx react-native init MindMyMoneyMobile
cd MindMyMoneyMobile
```

### Step 2: Install Required Dependencies
```bash
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install react-native-gesture-handler react-native-reanimated
npm install @stripe/stripe-react-native
npm install react-native-vector-icons
npm install @react-native-async-storage/async-storage
```

### Step 3: Android-Specific Setup for Google Play
```bash
cd android && ./gradlew clean
```

### Step 4: Key Configuration Files

#### package.json
```json
{
  "name": "MindMyMoneyMobile",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "jest",
    "lint": "eslint .",
    "build-android": "cd android && ./gradlew assembleRelease"
  },
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.72.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/stack": "^6.3.0",
    "@react-navigation/bottom-tabs": "^6.5.0",
    "react-native-screens": "^3.20.0",
    "react-native-safe-area-context": "^4.5.0",
    "react-native-gesture-handler": "^2.10.0",
    "react-native-reanimated": "^3.1.0",
    "@stripe/stripe-react-native": "^0.19.0",
    "react-native-vector-icons": "^9.2.0",
    "@react-native-async-storage/async-storage": "^1.18.0"
  }
}
```

## For Google Play Store Release:

### 1. Generate Signing Key
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Configure android/app/build.gradle
Add this to your build.gradle:

```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            ...
            signingConfig signingConfigs.release
        }
    }
}
```

### 3. Build Release APK
```bash
cd android
./gradlew assembleRelease
```

Your APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

## API Configuration

Your app will connect to: `https://your-replit-url.replit.app`

Update the API base URL in your services to match your deployed Replit URL.

## App Store Information

- **App Name**: Mind My Money
- **Package Name**: com.mindmymoney.app
- **Version**: 1.0.0
- **Target SDK**: 33
- **Min SDK**: 21

## Key Features to Include:
- User authentication
- Dashboard with financial overview
- Subscription management ($9.99/month, $95.99/year)
- Bank account integration (when available)
- AI financial coaching
- Budget tracking
- Savings goals

The mobile app will sync with your web app using the same backend API.