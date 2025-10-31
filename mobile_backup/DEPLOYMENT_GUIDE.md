# App Store Deployment Guide

This guide covers deploying the Mind My Money mobile app to Google Play Store and Apple App Store.

## Prerequisites

- Completed development setup
- Tested app on physical devices
- Developer accounts (see below)
- App icons and metadata prepared

## 1. Developer Account Setup

### Apple Developer Program
- **Cost**: $99/year
- **Requirements**: 
  - Apple ID
  - Valid payment method
  - Business verification (for company accounts)
- **Sign up**: https://developer.apple.com/programs/

### Google Play Console
- **Cost**: $25 one-time fee
- **Requirements**:
  - Google account
  - Valid payment method
- **Sign up**: https://play.google.com/console/signup

## 2. App Configuration

### Update App Information
Edit `mobile/package.json`:
```json
{
  "name": "MindMyMoneyMobile",
  "displayName": "Mind My Money",
  "version": "1.0.0"
}
```

### Android Configuration
Edit `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        applicationId "com.mindmymoney.app"
        versionCode 1
        versionName "1.0.0"
        minSdkVersion 21
        targetSdkVersion 33
    }
}
```

### iOS Configuration
Edit `ios/MindMyMoneyMobile/Info.plist`:
```xml
<key>CFBundleDisplayName</key>
<string>Mind My Money</string>
<key>CFBundleIdentifier</key>
<string>com.mindmymoney.app</string>
<key>CFBundleShortVersionString</key>
<string>1.0.0</string>
```

## 3. App Icons and Assets

### Icon Requirements

#### iOS
- Multiple sizes required (20px to 1024px)
- Use Xcode Asset Catalog
- File: `ios/MindMyMoneyMobile/Images.xcassets/AppIcon.appiconset/`

#### Android
- Multiple densities (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- Adaptive icon support (foreground + background)
- Files: `android/app/src/main/res/mipmap-*/`

### Generate Icons
Use tools like:
- App Icon Generator: https://appicon.co/
- Android Asset Studio: https://romannurik.github.io/AndroidAssetStudio/

## 4. Android Deployment (Google Play Store)

### Generate Signing Key
```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore mindmymoney-release-key.keystore -alias mindmymoney-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### Configure Gradle
Edit `android/gradle.properties`:
```properties
MINDMYMONEY_UPLOAD_STORE_FILE=mindmymoney-release-key.keystore
MINDMYMONEY_UPLOAD_KEY_ALIAS=mindmymoney-key-alias
MINDMYMONEY_UPLOAD_STORE_PASSWORD=your_keystore_password
MINDMYMONEY_UPLOAD_KEY_PASSWORD=your_key_password
```

Edit `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            if (project.hasProperty('MINDMYMONEY_UPLOAD_STORE_FILE')) {
                storeFile file(MINDMYMONEY_UPLOAD_STORE_FILE)
                storePassword MINDMYMONEY_UPLOAD_STORE_PASSWORD
                keyAlias MINDMYMONEY_UPLOAD_KEY_ALIAS
                keyPassword MINDMYMONEY_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled enableProguardInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}
```

### Build Release APK/AAB
```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### Upload to Play Console
1. Login to Google Play Console
2. Create new app
3. Complete app information:
   - App name: "Mind My Money"
   - Category: Finance
   - Content rating: Everyone
   - Privacy Policy URL
4. Upload app bundle (.aab file)
5. Complete store listing:
   - Description
   - Screenshots (phone, tablet)
   - Feature graphic
6. Submit for review

## 5. iOS Deployment (Apple App Store)

### Configure Xcode Project
1. Open `ios/MindMyMoneyMobile.xcworkspace` in Xcode
2. Select project → General tab
3. Update:
   - Display Name: "Mind My Money"
   - Bundle Identifier: "com.mindmymoney.app"
   - Version: "1.0.0"
   - Build: "1"

### Signing & Capabilities
1. Select Signing & Capabilities tab
2. Enable "Automatically manage signing"
3. Select your development team
4. Add capabilities if needed (e.g., background fetch)

### Build for Release
1. Select "Any iOS Device" or connected device
2. Product → Archive
3. When archive completes, Organizer window opens
4. Select archive → Distribute App
5. Choose "App Store Connect"
6. Follow upload wizard

### App Store Connect
1. Login to https://appstoreconnect.apple.com/
2. Create new app:
   - Platform: iOS
   - Name: "Mind My Money"
   - Bundle ID: com.mindmymoney.app
   - Language: English
3. Complete app information:
   - Subtitle
   - Description
   - Keywords
   - Category: Finance
   - Age Rating
4. Upload app screenshots:
   - iPhone (6.5", 5.5")
   - iPad (12.9", 10.5")
5. Upload build from Xcode
6. Submit for review

## 6. Required App Metadata

### App Description Template
```
Mind My Money - AI-Powered Personal Finance Management

Take control of your finances with intelligent insights and personalized coaching.

FEATURES:
• Connect bank accounts securely via Plaid
• AI financial coach "Money Mind" for personalized advice
• Automatic transaction categorization and analysis
• Smart budget creation and tracking
• Savings goals with progress tracking
• Real-time balance updates
• Spending pattern analysis
• Enterprise-grade security

WHY CHOOSE MIND MY MONEY:
✓ Bank-level 256-bit encryption
✓ Real-time financial insights
✓ Personalized AI coaching
✓ Comprehensive budget management
✓ Goal-based savings tracking

Start your 30-day free trial today!

Privacy Policy: [Your Privacy Policy URL]
Terms of Service: [Your Terms URL]
```

### Screenshots Needed
- Login screen
- Dashboard with account balances
- AI coach conversation
- Budget overview
- Account connection flow
- Savings goals
- Transaction history

### Privacy Policy Requirements
Must include sections on:
- Data collection and usage
- Third-party integrations (Plaid, Stripe)
- Data security measures
- User rights and data deletion
- Contact information

## 7. Post-Launch

### Analytics Setup
- Google Analytics for Firebase (Android)
- Firebase Analytics (iOS)
- App Store Connect Analytics

### Crash Reporting
- Crashlytics integration
- Error monitoring and alerts

### Updates and Maintenance
- Regular security updates
- Feature enhancements
- Bug fixes and performance improvements
- User feedback integration

## 8. Marketing Preparation

### App Store Optimization (ASO)
- Keyword research for app title and description
- Compelling screenshots and videos
- Regular A/B testing of store listing

### Launch Strategy
- Beta testing with TestFlight (iOS) and Play Console (Android)
- Press kit preparation
- Social media campaigns
- User acquisition planning

## 9. Compliance Requirements

### Financial App Regulations
- GDPR compliance (if serving EU users)
- CCPA compliance (California users)
- Financial data protection standards
- PCI DSS compliance for payment processing

### App Store Guidelines
- Follow Apple App Store Review Guidelines
- Adhere to Google Play Developer Policies
- Regular policy update monitoring

## Timeline Expectations

### Apple App Store
- Review time: 24-48 hours (after initial submission)
- First-time apps may take longer
- Rejections require resubmission

### Google Play Store
- Review time: 1-3 days for new apps
- Faster for updates to existing apps
- Internal testing available immediately

## Support Resources

- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Developer Policies](https://play.google.com/about/developer-content-policy/)
- [React Native Deployment Guide](https://reactnative.dev/docs/signed-apk-android)
- [iOS Distribution Guide](https://developer.apple.com/ios/submit/)