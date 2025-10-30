# ⚡ Quick Start Guide

## Get Your APK in 5 Steps

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Install EAS CLI
```bash
npm install -g eas-cli
```

### 3. Login to Expo
```bash
eas login
```
*(Enter your Expo email and password)*

### 4. Configure Project
```bash
eas build:configure
```
*(Press Enter to accept defaults)*

### 5. Build APK
```bash
eas build --platform android --profile preview
```
*(Wait 10-15 minutes, then download from the link)*

---

## 📱 Install on Your Phone

1. Download the APK from the build link
2. Transfer to your Android phone
3. Enable "Install from Unknown Sources" in Settings
4. Tap the APK file to install
5. Done! Your app is ready to use

---

## 📤 Build for Google Play Store

```bash
eas build --platform android --profile production
```

This creates an AAB file you can upload to Google Play Console.

---

## 📚 Need More Help?

See `EXPO_BUILD_INSTRUCTIONS.md` for detailed step-by-step instructions.

---

**That's it! Simple, right?** ✨
