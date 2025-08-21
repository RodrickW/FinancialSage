# React Native Mobile App Setup Guide for Cursor IDE on Windows

This guide will help you set up the React Native mobile app for Mind My Money using Cursor IDE on Windows, ready for Google Play Store and Apple App Store deployment.

## Prerequisites

### Required Software

1. **Node.js** (Latest LTS version)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version` and `npm --version`

2. **Git**
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

3. **Java Development Kit (JDK) 11**
   - Download from: https://www.oracle.com/java/technologies/javase/jdk11-archive-downloads.html
   - Or use OpenJDK: https://openjdk.java.net/
   - Set JAVA_HOME environment variable

4. **Android Studio**
   - Download from: https://developer.android.com/studio
   - Install Android SDK, Android SDK Platform, Android Virtual Device

5. **Cursor IDE**
   - Download from: https://cursor.sh/

## Windows Environment Setup

### 1. Install Chocolatey (Optional but Recommended)

Open PowerShell as Administrator:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

### 2. Install React Native CLI

```bash
npm install -g react-native-cli
# or using yarn
npm install -g yarn
yarn global add react-native-cli
```

### 3. Set Environment Variables

Add these to your Windows environment variables:

1. **ANDROID_HOME**: Path to Android SDK
   - Typically: `C:\Users\YourUsername\AppData\Local\Android\Sdk`

2. **JAVA_HOME**: Path to JDK installation
   - Typically: `C:\Program Files\Java\jdk-11.0.x`

3. **Add to PATH**:
   - `%ANDROID_HOME%\emulator`
   - `%ANDROID_HOME%\tools`
   - `%ANDROID_HOME%\tools\bin`
   - `%ANDROID_HOME%\platform-tools`

### 4. Verify Android Setup

```bash
# Check if adb is working
adb devices

# Check if emulator is available
emulator -list-avds
```

## Project Setup in Cursor IDE

### 1. Open Project in Cursor

1. Launch Cursor IDE
2. File → Open Folder
3. Navigate to your project root directory
4. Select the `mobile` folder within your project

### 2. Install Dependencies

Open terminal in Cursor (Ctrl + ` or View → Terminal):

```bash
# Navigate to mobile directory if not already there
cd mobile

# Install Node.js dependencies
npm install

# For iOS (if on macOS)
cd ios
pod install
cd ..
```

### 3. Configure Android

1. **Create local.properties** (if not exists):
   ```bash
   # In mobile/android/local.properties
   sdk.dir=C:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
   ```

2. **Check Android configuration**:
   ```bash
   npx react-native doctor
   ```

### 4. Start Development

1. **Start Metro bundler**:
   ```bash
   npm start
   ```

2. **Run on Android** (new terminal):
   ```bash
   npm run android
   ```

## Building for Production

### Android APK Build

1. **Generate signing key** (first time only):
   ```bash
   cd android/app
   keytool -genkeypair -v -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure signing** in `android/gradle.properties`:
   ```properties
   MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
   MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
   MYAPP_UPLOAD_STORE_PASSWORD=*****
   MYAPP_UPLOAD_KEY_PASSWORD=*****
   ```

3. **Build release APK**:
   ```bash
   npm run build:android
   ```

4. **Build App Bundle for Google Play**:
   ```bash
   npm run build:android:bundle
   ```

### iOS Build (macOS Required)

For iOS builds, you'll need a Mac with Xcode. The project is ready for iOS development.

## Cursor IDE Configuration

### 1. Install Recommended Extensions

In Cursor, install these extensions:
- React Native Tools
- ES7+ React/Redux/React-Native snippets
- TypeScript and JavaScript Language Features
- Prettier - Code formatter
- ESLint

### 2. Configure Settings

Create `.vscode/settings.json` in the mobile folder:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "emmet.includeLanguages": {
    "typescript": "typescriptreact"
  },
  "files.associations": {
    "*.tsx": "typescriptreact"
  }
}
```

### 3. Configure Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Android",
      "type": "reactnative",
      "request": "launch",
      "platform": "android"
    },
    {
      "name": "Debug iOS",
      "type": "reactnative",
      "request": "launch",
      "platform": "ios"
    }
  ]
}
```

## Development Workflow

### 1. Daily Development

1. Open Cursor IDE
2. Open terminal: `npm start`
3. In new terminal: `npm run android`
4. Make code changes
5. Hot reload automatically updates the app

### 2. Testing on Physical Device

1. **Enable USB Debugging** on Android device
2. Connect device via USB
3. Check if detected: `adb devices`
4. Run: `npm run android`

### 3. Code Quality

```bash
# Run linting
npm run lint

# Run tests
npm test

# Type checking
npx tsc --noEmit
```

## Deployment to App Stores

### Google Play Store

1. **Build signed App Bundle**:
   ```bash
   npm run build:android:bundle
   ```

2. **Upload to Google Play Console**:
   - Go to: https://play.google.com/console
   - Create new app
   - Upload the `.aab` file from `android/app/build/outputs/bundle/release/`

3. **Complete store listing**:
   - App details
   - Screenshots
   - Content rating
   - Pricing & distribution

### Apple App Store (Requires Mac)

1. **Set up Apple Developer Account**
2. **Configure provisioning profiles**
3. **Build through Xcode**
4. **Upload to App Store Connect**

## Troubleshooting

### Common Issues

1. **Metro bundler issues**:
   ```bash
   npx react-native start --reset-cache
   ```

2. **Android build fails**:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npm run android
   ```

3. **Dependencies issues**:
   ```bash
   rm -rf node_modules
   npm install
   ```

4. **Path issues on Windows**:
   - Ensure all environment variables are set correctly
   - Restart Cursor IDE after setting environment variables

### Getting Help

1. **React Native Doctor**:
   ```bash
   npx react-native doctor
   ```

2. **Check official documentation**:
   - React Native: https://reactnative.dev/
   - Android: https://developer.android.com/

3. **Community support**:
   - Stack Overflow
   - React Native Community Discord

## File Structure Overview

```
mobile/
├── src/
│   ├── App.tsx                 # Main app with navigation
│   ├── components/            # Reusable components
│   ├── context/              # React contexts
│   ├── services/             # API and external services
│   └── screens/              # App screens
│       ├── auth/            # Authentication screens
│       └── main/            # Main app screens
├── android/                  # Android specific files
├── ios/                     # iOS specific files (for macOS)
├── package.json             # Dependencies and scripts
├── index.js                # Entry point
└── app.json                # App configuration
```

## Next Steps

1. **Complete the setup** following this guide
2. **Test the app** on Android emulator or device
3. **Customize branding** (icons, splash screen, app name)
4. **Test all features** thoroughly
5. **Build and deploy** to Google Play Store

## Security Considerations

- Never commit signing keys to version control
- Use environment variables for sensitive configuration
- Test security thoroughly before release
- Follow platform-specific security guidelines

---

This setup guide provides everything needed to develop, build, and deploy the Mind My Money React Native app using Cursor IDE on Windows. Follow each step carefully and refer to the troubleshooting section if you encounter issues.