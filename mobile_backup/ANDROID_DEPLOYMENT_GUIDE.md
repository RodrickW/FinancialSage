# Mind My Money - Android Deployment Guide

## Overview

This guide provides complete instructions for building and deploying the Mind My Money Android app using Cursor IDE on Windows. It includes troubleshooting for common issues and ensures a smooth deployment process.

## Prerequisites

### 1. System Requirements
- Windows 10/11 (64-bit)
- At least 8GB RAM (16GB recommended)
- 10GB+ free disk space
- Stable internet connection

### 2. Required Software

#### Install Node.js
```bash
# Download and install Node.js 18 LTS from nodejs.org
# Verify installation
node --version  # Should be v18.x.x or higher
npm --version   # Should be 9.x.x or higher
```

#### Install Java Development Kit (JDK)
```bash
# Install OpenJDK 11 (required for React Native 0.74)
# Download from: https://adoptium.net/temurin/releases/?version=11
# Set JAVA_HOME environment variable
```

#### Install Android Studio
1. Download Android Studio from: https://developer.android.com/studio
2. During installation, ensure these components are selected:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device
   - Performance (Intel HAXM)

#### Configure Environment Variables
Add these to your system PATH:
```
ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-11.0.x-hotspot
```

Add to PATH:
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
%JAVA_HOME%\bin
```

## Project Setup

### 1. Clone and Setup Mobile App
```bash
# Navigate to your project root
cd /path/to/mind-my-money

# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# For iOS (if on macOS)
cd ios && pod install && cd ..
```

### 2. Android SDK Configuration
Open Android Studio and configure:

1. **SDK Platforms** (Install these):
   - Android 14.0 (API 34) - Latest
   - Android 13.0 (API 33)
   - Android 12.0 (API 31)

2. **SDK Tools** (Ensure these are installed):
   - Android SDK Build-Tools 34.0.0
   - Android SDK Command-line Tools
   - Android SDK Platform-Tools
   - Android Emulator
   - Intel x86 Emulator Accelerator (HAXM installer)

### 3. Configure React Native
```bash
# Install React Native CLI globally
npm install -g react-native-cli

# Verify React Native environment
npx react-native doctor
```

## Building the Android App

### 1. Update App Configuration

#### Update `android/app/build.gradle`:
```gradle
android {
    compileSdkVersion 34
    buildToolsVersion "34.0.0"

    defaultConfig {
        applicationId "com.mindmymoney.app"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode 1
        versionName "2.0.0"
        multiDexEnabled true
    }

    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }
}
```

#### Update `android/gradle.properties`:
```properties
android.useAndroidX=true
android.enableJetifier=true
android.enableDexingArtifactTransform.desugaring=false

# Increase memory allocation
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8

# Enable R8
android.enableR8=true
android.enableR8.fullMode=true
```

### 2. Generate Keystore (for Release Build)
```bash
# Navigate to android/app directory
cd android/app

# Generate keystore
keytool -genkeypair -v -storetype PKCS12 -keystore mindmymoney-release-key.keystore -alias mindmymoney -keyalg RSA -keysize 2048 -validity 10000

# Move keystore to android/app directory
```

#### Configure Signing in `android/gradle.properties`:
```properties
MYAPP_UPLOAD_STORE_FILE=mindmymoney-release-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=mindmymoney
MYAPP_UPLOAD_STORE_PASSWORD=your_keystore_password
MYAPP_UPLOAD_KEY_PASSWORD=your_key_password
```

#### Update `android/app/build.gradle` signing config:
```gradle
android {
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
}
```

### 3. Clean and Build

#### Clean Previous Builds:
```bash
# Clean React Native cache
npx react-native start --reset-cache

# Clean node modules
rm -rf node_modules
npm install

# Clean Android build
cd android
./gradlew clean
cd ..
```

#### Build Development APK:
```bash
# Build debug version
npx react-native run-android

# Or build APK directly
cd android
./gradlew assembleDebug
cd ..
```

#### Build Production APK:
```bash
# Build release APK
cd android
./gradlew assembleRelease
cd ..

# APK will be generated at:
# android/app/build/outputs/apk/release/app-release.apk
```

## Deployment Options

### Option 1: Direct APK Installation
1. Transfer the APK to your Android device
2. Enable "Unknown Sources" in device settings
3. Install the APK directly

### Option 2: Google Play Store (Internal Testing)
1. Create a Google Play Console account
2. Create a new application
3. Upload the signed release APK
4. Configure internal testing
5. Add test users

### Option 3: Firebase App Distribution
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Upload APK to Firebase App Distribution
firebase appdistribution:distribute android/app/build/outputs/apk/release/app-release.apk \
  --app YOUR_FIREBASE_APP_ID \
  --groups testers
```

## Troubleshooting Common Issues

### Issue 1: Gradle Build Fails
**Solution:**
```bash
# Clean gradle cache
cd android
./gradlew clean

# Clear global gradle cache
rm -rf ~/.gradle/caches/

# Rebuild
./gradlew assembleDebug
```

### Issue 2: Metro Bundler Issues
**Solution:**
```bash
# Kill existing Metro processes
npx react-native start --reset-cache

# Or manually:
pkill -f "node.*metro"
npx react-native start
```

### Issue 3: Android Emulator Not Starting
**Solutions:**
1. Enable Virtualization in BIOS
2. Install Intel HAXM
3. Increase AVD RAM allocation
4. Use ARM64 emulator image if Intel virtualization unavailable

### Issue 4: Build Tools Version Mismatch
**Solution:**
Update `android/build.gradle`:
```gradle
buildscript {
    ext {
        buildToolsVersion = "34.0.0"
        minSdkVersion = 21
        compileSdkVersion = 34
        targetSdkVersion = 34
        ndkVersion = "23.1.7779620"
    }
}
```

### Issue 5: Out of Memory Errors
**Solution:**
Update `android/gradle.properties`:
```properties
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.jvmargs=-Xmx8192m -XX:MaxPermSize=512m
```

### Issue 6: Network Security Issues
Add to `android/app/src/main/res/xml/network_security_config.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
```

## Performance Optimization

### 1. Enable ProGuard/R8 (Release Build)
Already configured in build.gradle above.

### 2. Optimize Bundle Size
```bash
# Analyze bundle size
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res

# Generate size analysis
cd android
./gradlew assembleRelease --scan
```

### 3. Enable Hermes Engine
In `android/app/build.gradle`:
```gradle
project.ext.react = [
    enableHermes: true
]
```

## App Store Preparation

### 1. App Icon and Assets
- Icon: 1024x1024 PNG (required for Play Store)
- Feature Graphic: 1024x500 PNG
- Screenshots: Multiple sizes for different devices
- App description and metadata

### 2. Play Store Requirements
- Target API Level 34 (Android 14)
- 64-bit native libraries
- App Bundle format (recommended)
- Privacy Policy URL
- Content rating
- Testing with at least 20 testers for 14 days (for production)

### 3. Generate App Bundle (Recommended for Play Store)
```bash
cd android
./gradlew bundleRelease

# Bundle will be generated at:
# android/app/build/outputs/bundle/release/app-release.aab
```

## Testing Checklist

Before deployment, ensure:
- [ ] App installs successfully on physical device
- [ ] All features work without crashes
- [ ] Network requests work properly
- [ ] Authentication flow works
- [ ] Credit simulator functions correctly
- [ ] All screens navigate properly
- [ ] App works in airplane mode (offline features)
- [ ] App handles low memory situations
- [ ] Proper error handling for network failures

## Continuous Integration (Optional)

### GitHub Actions for Automated Builds
Create `.github/workflows/android.yml`:
```yaml
name: Android Build

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Setup Java
      uses: actions/setup-java@v2
      with:
        distribution: 'adopt'
        java-version: '11'
        
    - name: Install dependencies
      run: |
        cd mobile
        npm install
        
    - name: Build Android
      run: |
        cd mobile/android
        ./gradlew assembleDebug
```

## Support and Resources

### Documentation
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Android Developer Docs](https://developer.android.com/)
- [Firebase App Distribution](https://firebase.google.com/docs/app-distribution)

### Common Commands Reference
```bash
# Start Metro bundler
npx react-native start

# Run on Android device/emulator
npx react-native run-android

# Clean and rebuild
cd android && ./gradlew clean && cd .. && npm start -- --reset-cache

# Generate debug APK
cd android && ./gradlew assembleDebug

# Generate release APK
cd android && ./gradlew assembleRelease

# Generate release bundle (for Play Store)
cd android && ./gradlew bundleRelease
```

## Final Notes

1. **Always test on real devices** - Emulators may not catch all issues
2. **Keep keystores secure** - Store them safely and never commit to version control
3. **Monitor app performance** - Use tools like Firebase Performance Monitoring
4. **Regular updates** - Keep React Native and dependencies updated
5. **Follow Android best practices** - Adhere to Material Design guidelines

This deployment guide should help you successfully build and deploy the Mind My Money Android app without issues. Follow each step carefully and refer to the troubleshooting section if you encounter problems.