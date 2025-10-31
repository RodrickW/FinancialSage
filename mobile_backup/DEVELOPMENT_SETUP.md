# React Native Development Setup Guide

This guide will help you set up your development environment to build and deploy the Mind My Money mobile app to iOS and Android platforms.

## Prerequisites

### System Requirements
- **macOS**: Required for iOS development (Xcode only runs on Mac)
- **Windows/Linux**: Can develop Android apps
- **Node.js**: Version 18 or higher
- **Git**: For version control

## 1. Install Development Tools

### For macOS (iOS + Android)

#### Install Xcode
1. Download Xcode from Mac App Store (free)
2. Install Xcode Command Line Tools:
   ```bash
   xcode-select --install
   ```
3. Accept Xcode license:
   ```bash
   sudo xcodebuild -license
   ```

#### Install Android Studio
1. Download Android Studio from https://developer.android.com/studio
2. During installation, select:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device
3. Configure Android environment variables in `~/.zshrc` or `~/.bash_profile`:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

### For Windows (Android only)

#### Install Android Studio
1. Download from https://developer.android.com/studio
2. Install with default settings including Android SDK
3. Add environment variables:
   ```
   ANDROID_HOME = C:\Users\%USERNAME%\AppData\Local\Android\Sdk
   Path += %ANDROID_HOME%\platform-tools
   Path += %ANDROID_HOME%\emulator
   Path += %ANDROID_HOME%\tools
   Path += %ANDROID_HOME%\tools\bin
   ```

#### Install Java Development Kit (JDK)
```bash
choco install openjdk11
```

## 2. Install React Native CLI

```bash
npm install -g @react-native-community/cli
```

## 3. Setup Project

### Navigate to mobile directory
```bash
cd mobile
npm install
```

### iOS Setup (macOS only)
```bash
cd ios
pod install
cd ..
```

## 4. Create Virtual Devices

### Android Emulator
1. Open Android Studio
2. Go to Tools → Device Manager
3. Create Virtual Device
4. Choose Pixel 4 or similar
5. Download and select Android 13 (API 33) system image
6. Start the emulator

### iOS Simulator (macOS only)
1. Open Xcode
2. Go to Window → Devices and Simulators
3. Simulators tab → Create Simulator
4. Choose iPhone 14 or similar
5. iOS 16.0 or later

## 5. Run the App

### Android
```bash
npm run android
```

### iOS (macOS only)
```bash
npm run ios
```

### Start Metro Bundler (if not started automatically)
```bash
npm start
```

## 6. Development Workflow

### Live Reload
- Shake device/simulator to open developer menu
- Enable "Fast Refresh" for live code updates

### Debugging
- Chrome DevTools: Shake device → Debug → Open Chrome DevTools
- Flipper: Advanced debugging tool (optional)

### Testing on Physical Device

#### Android
1. Enable Developer Options on Android device
2. Enable USB Debugging
3. Connect via USB
4. Run: `adb devices` to verify connection
5. Run: `npm run android`

#### iOS
1. Connect iPhone via USB
2. Open `ios/MindMyMoneyMobile.xcworkspace` in Xcode
3. Select your device from device list
4. Build and run from Xcode

## 7. Troubleshooting

### Common Issues

#### Metro bundler port conflicts
```bash
npx react-native start --reset-cache --port 8082
```

#### Android build failures
```bash
cd android
./gradlew clean
cd ..
npm run android
```

#### iOS build failures
1. Clean build folder in Xcode (Cmd+Shift+K)
2. Delete `ios/build` folder
3. Run `pod install` again
4. Rebuild

#### Dependency issues
```bash
rm -rf node_modules package-lock.json
npm install
cd ios && pod install && cd ..
```

### Environment Variables
Create `.env` file in mobile directory:
```
API_URL=http://localhost:5000
```

For production builds, update to:
```
API_URL=https://mindmymoneyapp.com
```

## 8. Performance Optimization

### Enable Hermes (Android)
Already enabled in `android/app/build.gradle`:
```gradle
project.ext.react = [
    enableHermes: true
]
```

### Bundle Size Optimization
```bash
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle
```

## Next Steps

Once your development environment is working:
1. Test all app features on simulator/emulator
2. Test on physical devices
3. Follow deployment guide for app store submission
4. Set up CI/CD pipeline for automated builds

## Resources

- [React Native Documentation](https://reactnative.dev/docs/environment-setup)
- [Xcode Documentation](https://developer.apple.com/xcode/)
- [Android Studio Guide](https://developer.android.com/studio/intro)
- [React Native Debugging](https://reactnative.dev/docs/debugging)