#!/bin/bash

# Mind My Money - Android Build Script for Google Play Store
# This script builds a release-ready APK and AAB file for Google Play Store submission

echo "🏗️  Building Mind My Money Android App for Google Play Store..."

# Navigate to mobile directory
cd "$(dirname "$0")"

echo "📱 Step 1: Installing dependencies..."
npm install

echo "🔑 Step 2: Generating release keystore..."
cd android/app

# Generate keystore if it doesn't exist
if [ ! -f "mindmymoney-release-key.keystore" ]; then
    echo "Creating release keystore..."
    keytool -genkeypair -v -storetype PKCS12 \
        -keystore mindmymoney-release-key.keystore \
        -alias mindmymoney-key-alias \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -storepass "MindMyMoney2025!" \
        -keypass "MindMyMoney2025!" \
        -dname "CN=Mind My Money, OU=Finance, O=Mind My Money LLC, L=San Francisco, ST=CA, C=US"
    echo "✅ Keystore created successfully!"
else
    echo "✅ Keystore already exists!"
fi

cd ..

echo "🏗️  Step 3: Building release APK and AAB..."
echo "This may take several minutes..."

# Build the release APK
echo "Building APK..."
./gradlew assembleRelease

# Build the release AAB (Android App Bundle) - preferred by Google Play
echo "Building AAB (Android App Bundle)..."
./gradlew bundleRelease

echo ""
echo "🎉 Build completed successfully!"
echo ""
echo "📦 Generated files:"
echo "   APK: android/app/build/outputs/apk/release/app-release.apk"
echo "   AAB: android/app/build/outputs/bundle/release/app-release.aab"
echo ""
echo "📋 Next steps for Google Play Store:"
echo "1. Login to Google Play Console (https://play.google.com/console)"
echo "2. Create a new app"
echo "3. Upload the AAB file (app-release.aab) - Google's preferred format"
echo "4. Complete store listing with screenshots and description"
echo "5. Submit for review"
echo ""
echo "🔐 Keystore security:"
echo "   Store file: android/app/mindmymoney-release-key.keystore"
echo "   Keep this file secure - you'll need it for all future updates!"
echo ""