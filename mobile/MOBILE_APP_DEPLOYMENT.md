# Mind My Money Mobile App - App Store Deployment Guide

This guide covers deploying the Mind My Money React Native mobile app to both Apple App Store and Google Play Store.

## Recent Updates (August 2025)

### Subscription Features Added
- ✅ Monthly subscription plan ($9.99/month)
- ✅ Annual subscription plan ($95.99/year with 20% discount) 
- ✅ 30-day free trial for both plans
- ✅ Stripe integration with existing price IDs
- ✅ Premium feature gate removal (basic features now accessible immediately)
- ✅ Subscribe screen with plan comparison
- ✅ TrialGate component for premium features
- ✅ Mobile-optimized subscription UI

### Mobile App Features
- **Dashboard**: Financial overview with account balances and quick actions
- **Accounts**: Bank account management with Plaid integration
- **Budget**: Real-time budget tracking and categories
- **AI Coach**: Financial coaching with Money Mind AI
- **Goals**: Savings goal creation and tracking
- **Subscribe**: Subscription management with monthly/annual options

## Pre-Deployment Checklist

### 1. Code Quality and Testing
- [ ] All screens render correctly on iOS and Android
- [ ] Subscription flow works end-to-end
- [ ] API integration with backend is functional
- [ ] TypeScript compilation successful
- [ ] No console errors or warnings

### 2. App Configuration

#### Version Numbers
Update in the following files:
- `package.json`: Update version field
- `android/app/build.gradle`: Update versionCode and versionName
- `ios/MindMyMoneyMobile/Info.plist`: Update CFBundleShortVersionString and CFBundleVersion

#### App Icons and Splash Screens
- [ ] iOS icons: `ios/MindMyMoneyMobile/Images.xcassets/AppIcon.appiconset/`
- [ ] Android icons: `android/app/src/main/res/mipmap-*/`
- [ ] Android adaptive icons: `android/app/src/main/res/mipmap-*/ic_launcher.xml`

#### Bundle Identifiers
- iOS: `com.mindmymoney.mobile`
- Android: `com.mindmymoney.mobile`

### 3. Subscription Configuration

#### Stripe Configuration
- [ ] STRIPE_PREMIUM_PRICE_ID set for monthly plan
- [ ] STRIPE_ANNUAL_PRICE_ID set for annual plan  
- [ ] STRIPE_SECRET_KEY configured on backend
- [ ] VITE_STRIPE_PUBLIC_KEY set for frontend

#### App Store Subscription Products
Need to create in-app purchase products that match Stripe:

**iOS (App Store Connect)**
- Product ID: `mindmymoney_premium_monthly` ($9.99/month)
- Product ID: `mindmymoney_premium_annual` ($95.99/year)

**Android (Google Play Console)**
- Product ID: `mindmymoney_premium_monthly` ($9.99/month)
- Product ID: `mindmymoney_premium_annual` ($95.99/year)

### 4. Backend API Configuration
- [ ] Backend deployed and accessible
- [ ] Database migrations applied
- [ ] Environment variables set (Stripe, Plaid, OpenAI)
- [ ] CORS configured for mobile app domains
- [ ] SSL certificates valid

## iOS App Store Deployment

### Prerequisites
- Apple Developer Account ($99/year)
- Xcode 15+ installed
- iOS deployment target: iOS 13.0+

### Steps

1. **Prepare Xcode Project**
   ```bash
   cd ios
   pod install
   ```

2. **Configure Signing**
   - Open `ios/MindMyMoneyMobile.xcworkspace` in Xcode
   - Select project → Signing & Capabilities
   - Choose your development team
   - Ensure bundle identifier matches: `com.mindmymoney.mobile`

3. **Create App Store Connect Record**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Create new app with bundle ID `com.mindmymoney.mobile`
   - App Name: "Mind My Money"
   - Category: Finance
   - Content Rating: 4+ (Ages 4 and up)

4. **Configure In-App Purchases**
   - In App Store Connect → Features → In-App Purchases
   - Create auto-renewable subscriptions:
     - `mindmymoney_premium_monthly`: $9.99/month
     - `mindmymoney_premium_annual`: $95.99/year
   - Submit for review

5. **Build and Upload**
   ```bash
   # Build release version
   npx react-native run-ios --configuration Release
   
   # Or use Xcode:
   # Product → Archive → Distribute App → App Store Connect
   ```

6. **App Store Listing**
   - App Description (see template below)
   - Screenshots for all device sizes
   - App preview videos (optional but recommended)
   - Keywords: "finance, budgeting, AI, money management, savings"

### iOS App Description Template
```
Take control of your finances with Mind My Money - the AI-powered personal finance management app.

KEY FEATURES:
🧠 AI Financial Coach - Get personalized advice from Money Mind
💳 Bank Account Integration - Securely connect all your accounts
📊 Smart Budgeting - AI-generated budgets that adapt to your lifestyle
🎯 Savings Goals - Track progress and celebrate milestones
📈 Spending Analytics - Understand your money habits
🔒 Bank-Level Security - Your data is encrypted and protected

SUBSCRIPTION PLANS:
• Monthly: $9.99/month
• Annual: $95.99/year (Save 20%)
• 30-day free trial for all plans

Mind My Money helps you:
- Understand your spending patterns
- Build better financial habits
- Reach your savings goals faster
- Make informed financial decisions

Download now and start your journey to financial wellness!

Privacy Policy: [Your Privacy Policy URL]
Terms of Service: [Your Terms of Service URL]
```

## Android Google Play Store Deployment

### Prerequisites
- Google Play Developer Account ($25 one-time fee)
- Android Studio installed
- Target SDK: API 34 (Android 14)

### Steps

1. **Configure Android Build**
   ```bash
   cd android
   ./gradlew clean
   ```

2. **Generate Signing Key**
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

3. **Configure Gradle**
   Add to `android/gradle.properties`:
   ```
   MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
   MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
   MYAPP_UPLOAD_STORE_PASSWORD=****
   MYAPP_UPLOAD_KEY_PASSWORD=****
   ```

4. **Build Release APK/AAB**
   ```bash
   cd android
   ./gradlew bundleRelease
   # Output: android/app/build/outputs/bundle/release/app-release.aab
   ```

5. **Google Play Console Setup**
   - Go to [Google Play Console](https://play.google.com/console)
   - Create new app
   - App name: "Mind My Money"
   - Category: Finance
   - Content rating: Everyone

6. **Configure In-App Products**
   - Go to Monetize → Products → Subscriptions
   - Create subscriptions:
     - `mindmymoney_premium_monthly`: $9.99/month
     - `mindmymoney_premium_annual`: $95.99/year

7. **Upload and Release**
   - Upload AAB file to Internal Testing first
   - Test thoroughly
   - Promote to Production when ready

### Android App Description Template
```
🚀 Mind My Money - AI-Powered Personal Finance

Transform your financial life with intelligent money management. Connect your accounts, get AI coaching, and reach your goals faster.

✨ FEATURES
• AI Financial Coach for personalized advice
• Secure bank account integration
• Smart budgeting with real-time tracking
• Savings goals with progress tracking
• Spending analytics and insights
• Bank-level security and encryption

💰 PRICING
Monthly Plan: $9.99/month
Annual Plan: $95.99/year (20% savings)
Free 30-day trial available

🎯 PERFECT FOR
- Building better money habits
- Tracking spending and budgets
- Saving for specific goals
- Getting personalized financial advice
- Understanding your financial health

Download Mind My Money today and take the first step toward financial freedom!

🔒 Your privacy and security are our top priorities. All data is encrypted and never shared with third parties.
```

## Post-Deployment

### App Store Optimization (ASO)
- Monitor app rankings for keywords
- A/B test app icons and screenshots
- Respond to user reviews promptly
- Regular app updates based on feedback

### Analytics and Monitoring
- Set up crash reporting (Crashlytics)
- Monitor subscription conversion rates
- Track user engagement metrics
- Monitor app performance and loading times

### Marketing Launch
- Press release for app launch
- Social media campaign
- Influencer partnerships
- App review websites

## Troubleshooting Common Issues

### iOS Build Issues
- **Code signing errors**: Verify developer certificates and provisioning profiles
- **Archive upload fails**: Check for build warnings and resolve them
- **App rejection**: Common reasons include missing privacy descriptions, crashes, or UI issues

### Android Build Issues
- **Build failures**: Clear build cache with `./gradlew clean`
- **APK signing issues**: Verify keystore configuration
- **Play Store upload errors**: Ensure AAB format and correct signing

### Subscription Issues
- **Test subscriptions**: Use sandbox/test environments before production
- **Receipt validation**: Ensure backend properly validates subscription receipts
- **Refunds**: Set up proper refund handling processes

## Support and Maintenance

### Regular Updates
- Monthly bug fixes and improvements
- Quarterly feature updates
- Annual iOS/Android version compatibility updates

### User Support
- In-app help and FAQ section
- Email support system
- Knowledge base website

### Compliance
- GDPR compliance for EU users
- CCPA compliance for California users
- Regular security audits
- App store guideline compliance

---

For technical support during deployment, contact the development team or refer to the main project documentation.