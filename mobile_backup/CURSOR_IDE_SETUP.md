# Cursor IDE Setup for React Native Android Development

## Overview

This guide specifically addresses setting up Cursor IDE for React Native Android development and resolves common build issues encountered when using Cursor.

## Cursor IDE Configuration

### 1. Install Cursor Extensions

Install these essential extensions in Cursor:

```
- React Native Tools
- Android iOS Emulator
- ES7+ React/Redux/React-Native snippets
- TypeScript and JavaScript Language Features
- Prettier - Code formatter
- GitLens — Git supercharged
- Auto Rename Tag
- Bracket Pair Colorizer
- Material Icon Theme
```

### 2. Cursor Settings Configuration

Create/update `.vscode/settings.json` in your project root:

```json
{
  "react-native-tools.showUserTips": false,
  "react-native-tools.logLevel": "Debug",
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.workingDirectories": ["mobile"],
  "files.exclude": {
    "**/node_modules": true,
    "**/android/build": true,
    "**/android/app/build": true,
    "**/ios/build": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/android/build": true,
    "**/android/app/build": true,
    "**/*.code-search": true
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "terminal.integrated.cwd": "./mobile"
}
```

### 3. Cursor Workspace Configuration

Create `.vscode/launch.json` for debugging:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Android",
      "cwd": "${workspaceFolder}/mobile",
      "type": "reactnative",
      "request": "launch",
      "platform": "android"
    },
    {
      "name": "Attach to packager",
      "cwd": "${workspaceFolder}/mobile",
      "type": "reactnative",
      "request": "attach"
    },
    {
      "name": "Run iOS",
      "cwd": "${workspaceFolder}/mobile",
      "type": "reactnative",
      "request": "launch",
      "platform": "ios"
    }
  ]
}
```

### 4. Cursor Tasks Configuration

Create `.vscode/tasks.json` for common React Native tasks:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Metro",
      "type": "shell",
      "command": "npx react-native start",
      "group": "build",
      "options": {
        "cwd": "${workspaceFolder}/mobile"
      },
      "isBackground": true,
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "new"
      }
    },
    {
      "label": "Run Android Debug",
      "type": "shell",
      "command": "npx react-native run-android",
      "group": "build",
      "options": {
        "cwd": "${workspaceFolder}/mobile"
      },
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "new"
      }
    },
    {
      "label": "Clean Android Build",
      "type": "shell",
      "command": "./gradlew clean",
      "group": "build",
      "options": {
        "cwd": "${workspaceFolder}/mobile/android"
      }
    },
    {
      "label": "Build Release APK",
      "type": "shell",
      "command": "./gradlew assembleRelease",
      "group": "build",
      "options": {
        "cwd": "${workspaceFolder}/mobile/android"
      }
    }
  ]
}
```

## Cursor-Specific Troubleshooting

### Issue 1: Terminal Path Problems

**Problem:** Commands not working because terminal doesn't start in mobile directory.

**Solution:**
1. Open terminal in Cursor (Ctrl+`)
2. Navigate to mobile directory: `cd mobile`
3. Or set default terminal directory in settings.json (already configured above)

### Issue 2: Cursor AI Code Completion Conflicts

**Problem:** Cursor's AI suggestions interfere with React Native autocomplete.

**Solution:**
Add to Cursor settings:
```json
{
  "cursor.cpp.disabledLanguages": ["typescript", "typescriptreact", "javascript", "javascriptreact"],
  "cursor.chat.alwaysSearchWeb": false
}
```

### Issue 3: Gradle Daemon Issues in Cursor

**Problem:** Gradle builds hang or fail in Cursor terminal.

**Solution:**
1. Open Command Prompt outside Cursor
2. Navigate to `mobile/android`
3. Run: `./gradlew --stop`
4. Then build in Cursor terminal

### Issue 4: Metro Bundler Port Conflicts

**Problem:** Metro can't start due to port conflicts.

**Solution:**
Create `mobile/metro.config.js`:
```javascript
const { getDefaultConfig } = require('metro-config');

module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts },
  } = await getDefaultConfig(__dirname);

  return {
    transformer: {
      babelTransformerPath: require.resolve('react-native-svg-transformer'),
    },
    resolver: {
      assetExts: assetExts.filter(ext => ext !== 'svg'),
      sourceExts: [...sourceExts, 'svg'],
    },
    server: {
      port: 8081, // Explicit port configuration
    },
  };
})();
```

## Cursor Workflow for Android Development

### 1. Daily Development Workflow

```bash
# 1. Open Cursor in project root
# 2. Use integrated terminal (Ctrl+`)
cd mobile

# 3. Start Metro bundler
npm start

# 4. In new terminal tab (Ctrl+Shift+`)
cd mobile
npx react-native run-android
```

### 2. Build Workflow in Cursor

#### Debug Build:
1. Open Command Palette (Ctrl+Shift+P)
2. Type "Tasks: Run Task"
3. Select "Run Android Debug"

#### Release Build:
1. Command Palette → "Tasks: Run Task"
2. Select "Build Release APK"
3. APK will be in `mobile/android/app/build/outputs/apk/release/`

### 3. Debugging in Cursor

1. Set breakpoints in your TypeScript/JavaScript files
2. Press F5 or use Command Palette → "Debug: Start Debugging"
3. Select "Run Android" configuration
4. Cursor will attach debugger to running app

## Environment Setup Script for Cursor

Create `mobile/setup-cursor.ps1` (Windows PowerShell):

```powershell
# Setup script for Cursor IDE React Native development

Write-Host "Setting up Cursor IDE for React Native development..." -ForegroundColor Green

# Check Node.js version
$nodeVersion = node --version
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Cyan

# Check Java version
$javaVersion = java -version 2>&1 | Select-String "version"
Write-Host "Java version: $javaVersion" -ForegroundColor Cyan

# Check Android SDK
if ($env:ANDROID_HOME) {
    Write-Host "Android SDK path: $env:ANDROID_HOME" -ForegroundColor Cyan
} else {
    Write-Host "ANDROID_HOME not set! Please configure Android SDK." -ForegroundColor Red
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Clear caches
Write-Host "Clearing caches..." -ForegroundColor Yellow
npx react-native start --reset-cache

# Clean Android build
Write-Host "Cleaning Android build..." -ForegroundColor Yellow
cd android
./gradlew clean
cd ..

Write-Host "Setup complete! Ready for development in Cursor IDE." -ForegroundColor Green
```

Create `mobile/setup-cursor.sh` (macOS/Linux):

```bash
#!/bin/bash

echo "Setting up Cursor IDE for React Native development..."

# Check versions
echo "Node.js version: $(node --version)"
echo "Java version: $(java -version 2>&1 | head -n 1)"
echo "Android SDK path: $ANDROID_HOME"

# Install dependencies
echo "Installing dependencies..."
npm install

# Clear caches
echo "Clearing caches..."
npx react-native start --reset-cache &
sleep 3
kill $!

# Clean Android build
echo "Cleaning Android build..."
cd android
./gradlew clean
cd ..

echo "Setup complete! Ready for development in Cursor IDE."
```

## Cursor Keyboard Shortcuts for React Native

### Custom Keybindings

Add to Cursor keybindings.json:

```json
[
  {
    "key": "ctrl+shift+r",
    "command": "workbench.action.tasks.runTask",
    "args": "Start Metro"
  },
  {
    "key": "ctrl+shift+a",
    "command": "workbench.action.tasks.runTask",
    "args": "Run Android Debug"
  },
  {
    "key": "ctrl+shift+c",
    "command": "workbench.action.tasks.runTask",
    "args": "Clean Android Build"
  },
  {
    "key": "ctrl+shift+b",
    "command": "workbench.action.tasks.runTask",
    "args": "Build Release APK"
  }
]
```

## Performance Optimization in Cursor

### 1. Exclude Build Directories

Already configured in settings.json to exclude:
- `node_modules`
- `android/build`
- `android/app/build`
- `ios/build`

### 2. Disable Unnecessary Features

```json
{
  "typescript.surveys.enabled": false,
  "workbench.tips.enabled": false,
  "workbench.welcomePage.enabled": false,
  "extensions.autoUpdate": false,
  "telemetry.enableTelemetry": false
}
```

### 3. Memory Management

```json
{
  "typescript.preferences.includePackageJsonAutoImports": "off",
  "typescript.disableAutomaticTypeAcquisition": true,
  "search.followSymlinks": false
}
```

## Common Cursor + Android Issues & Solutions

### Issue 1: Cursor Freezes During Build

**Solution:**
1. Increase Cursor memory: File → Preferences → Settings → "memory"
2. Close unnecessary tabs and panels
3. Use external terminal for heavy operations

### Issue 2: IntelliSense Not Working

**Solution:**
1. Reload TypeScript: Ctrl+Shift+P → "TypeScript: Reload Project"
2. Restart TypeScript Server: Ctrl+Shift+P → "TypeScript: Restart TS Server"
3. Check tsconfig.json path resolution

### Issue 3: Git Integration Problems

**Solution:**
```json
{
  "git.enabled": true,
  "git.path": "C:\\Program Files\\Git\\cmd\\git.exe",
  "git.autorefresh": true
}
```

## Final Cursor Setup Checklist

- [ ] All required extensions installed
- [ ] Workspace settings configured
- [ ] Launch configurations created
- [ ] Tasks configured for common operations
- [ ] Keybindings customized
- [ ] Terminal defaults to mobile directory
- [ ] Build directories excluded from search
- [ ] TypeScript and ESLint working
- [ ] Debugger configuration tested
- [ ] Setup scripts created and tested

With this Cursor IDE setup, you should have a smooth React Native Android development experience with proper tooling, debugging capabilities, and optimized performance.