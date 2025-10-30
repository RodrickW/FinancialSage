# 🚀 Expo Build Instructions for Mind My Money Mobile App

Your React Native app has been successfully converted to Expo! Follow these step-by-step instructions to build your APK and AAB files.

---

## ✅ Prerequisites

You mentioned you already have:
- ✅ Expo account created
- ✅ Downloaded Expo

---

## 📱 Step-by-Step Build Process

### Step 1: Install Dependencies

Open your terminal (Command Prompt, PowerShell, or Terminal) and navigate to the mobile folder:

```bash
cd mobile
npm install
```

This will install all the Expo packages and dependencies.

---

### Step 2: Install Expo CLI and EAS CLI

Install the command-line tools globally on your computer:

```bash
npm install -g expo-cli eas-cli
```

---

### Step 3: Login to Expo

Login with your Expo account:

```bash
eas login
```

Enter your Expo email and password when prompted.

---

### Step 4: Configure EAS Build

Initialize EAS in your project:

```bash
cd mobile
eas build:configure
```

This will:
- Create an Expo project ID
- Update your `app.json` with the project ID
- Confirm your build settings

When asked questions, choose:
- Platform: **Android** (or both if you want iOS too)
- Build type: Accept defaults by pressing Enter

---

### Step 5: Build Your APK (For Testing)

To create an APK file that you can install directly on Android devices:

```bash
eas build --platform android --profile preview
```

**What happens:**
- Expo uploads your code to their cloud servers
- Builds your app in the cloud (no Android Studio needed!)
- Takes about 10-15 minutes
- You'll get a link to download the APK when done

**Result:** You can install this APK on any Android phone to test.

---

### Step 6: Build AAB for Google Play Store (For Publishing)

To create an App Bundle for the Google Play Store:

```bash
eas build --platform android --profile production
```

**What happens:**
- Creates an optimized `.aab` file
- This is what you upload to Google Play Console
- Smaller download size for users
- Takes about 10-15 minutes

---

### Step 7: Download Your Builds

After the build completes:

1. You'll see a link in the terminal like:
   ```
   ✔ Build successful
   https://expo.dev/accounts/[your-account]/projects/mind-my-money/builds/[build-id]
   ```

2. Click the link or go to: https://expo.dev/accounts/[your-username]/projects/mind-my-money/builds

3. Click the "Download" button to get your APK or AAB file

---

## 🎯 Quick Reference Commands

```bash
# Development build (for testing with Expo Go app)
npm start

# Preview build (APK for direct install)
eas build --platform android --profile preview

# Production build (AAB for Google Play)
eas build --platform android --profile production

# Check build status
eas build:list

# For iOS (Mac only)
eas build --platform ios --profile production
```

---

## 📋 Build Profiles Explained

Your app has 3 build profiles (defined in `eas.json`):

| Profile | Output | Use Case |
|---------|--------|----------|
| **development** | APK with dev tools | Development only |
| **preview** | APK | Testing on devices, sharing with team |
| **production** | AAB | Google Play Store submission |

---

## 🔧 Troubleshooting

### "No development build found"
Run: `npm install` in the mobile folder

### "Not logged in"
Run: `eas login`

### "Project not configured"
Run: `eas build:configure`

### Build fails
- Check the build logs in the Expo dashboard
- Make sure all required secrets are set
- Verify package.json has no errors

### Can't install APK on phone
- Enable "Install from Unknown Sources" in Android settings
- Some phones call this "Install Unknown Apps"

---

## 🎨 Customizing App Icons (Optional)

Right now, the app will use default Expo icons. To add your own:

1. Create or download these images:
   - `icon.png` - 1024x1024 px (app icon)
   - `splash.png` - 1242x2436 px (loading screen)
   - `adaptive-icon.png` - 1024x1024 px (Android adaptive icon)

2. Place them in: `mobile/assets/`

3. Rebuild with: `eas build --platform android --profile production`

**Tip:** Use https://icon.kitchen/ to generate all required icon sizes automatically!

---

## 📤 Publishing to Google Play Store

Once you have your AAB file from the production build:

1. Go to: https://play.google.com/console
2. Create a new app (or select existing)
3. Go to "Production" → "Create new release"
4. Upload your AAB file
5. Fill in store listing details
6. Submit for review

**Note:** First-time Google Play developer account costs $25 (one-time fee)

---

## 💰 Expo Pricing

- **Free tier**: 
  - Includes builds for development and testing
  - Limited to 30 builds per month
  - Perfect for getting started!

- **Paid tier**: 
  - More builds per month
  - Priority build queue
  - Only needed if you build frequently

---

## ❓ Need Help?

- **Expo Documentation**: https://docs.expo.dev/build/setup/
- **Build troubleshooting**: https://docs.expo.dev/build-reference/troubleshooting/
- **Expo Forum**: https://forums.expo.dev/

---

## 🎉 That's It!

Your mobile app is now ready to build! The whole process should take about 20-30 minutes for your first build (including setup time). Subsequent builds are faster.

**Pro tip:** While the build is running, you can continue working on other things - Expo will send you an email when the build is complete!

---

**Last Updated:** January 2025  
**App Version:** 2.0.0  
**Expo SDK:** 51
