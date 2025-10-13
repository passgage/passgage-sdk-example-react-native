# Troubleshooting Guide

This guide helps you diagnose and fix common issues with the Passgage SDK.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Build Issues](#build-issues)
- [Runtime Errors](#runtime-errors)
- [Authentication Issues](#authentication-issues)
- [Feature-Specific Issues](#feature-specific-issues)
- [Performance Issues](#performance-issues)
- [Debugging Tips](#debugging-tips)

## Installation Issues

### Issue: "Cannot find module '@passgage/sdk-react-native'"

**Symptoms:**
```
Error: Cannot find module '@passgage/sdk-react-native'
```

**Solutions:**

1. **Install the package:**
   ```bash
   npm install @passgage/sdk-react-native
   # or
   yarn add @passgage/sdk-react-native
   ```

2. **Clear Metro cache:**
   ```bash
   npx react-native start --reset-cache
   ```

3. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules package-lock.json yarn.lock
   npm install
   # or
   yarn install
   ```

### Issue: Peer dependency warnings

**Symptoms:**
```
warning " > @passgage/sdk-react-native@1.0.4" has unmet peer dependency "@react-native-community/geolocation@^3.0.0"
```

**Solutions:**

Install the required peer dependencies:
```bash
npm install @react-native-community/geolocation react-native-keychain
```

Optional peer dependencies (install if using these features):
```bash
npm install react-native-nfc-manager  # For NFC scanning
npm install react-native-vision-camera  # For QR camera
```

### Issue: Pod install fails on iOS

**Symptoms:**
```
[!] CocoaPods could not find compatible versions for pod "..."
```

**Solutions:**

1. **Update CocoaPods:**
   ```bash
   sudo gem install cocoapods
   ```

2. **Clear CocoaPods cache:**
   ```bash
   cd ios
   pod deintegrate
   pod cache clean --all
   pod install
   cd ..
   ```

3. **Update pod repository:**
   ```bash
   cd ios
   pod repo update
   pod install
   cd ..
   ```

## Build Issues

### Issue: iOS build fails

**Symptoms:**
```
❌  'React/RCTBridgeModule.h' file not found
```

**Solutions:**

1. **Clean and rebuild:**
   ```bash
   cd ios
   xcodebuild clean
   pod install
   cd ..
   npx react-native run-ios
   ```

2. **Reset Xcode derived data:**
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData
   ```

3. **Check minimum iOS version:**
   Ensure `ios/Podfile` has:
   ```ruby
   platform :ios, '13.0'
   ```

### Issue: Android build fails

**Symptoms:**
```
error: package android.support.annotation does not exist
```

**Solutions:**

1. **Clean Android build:**
   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```

2. **Check minimum SDK version:**
   In `android/build.gradle`:
   ```gradle
   minSdkVersion = 23
   ```

3. **Enable AndroidX:**
   In `android/gradle.properties`:
   ```properties
   android.useAndroidX=true
   android.enableJetifier=true
   ```

4. **Clear Gradle cache:**
   ```bash
   cd android
   ./gradlew clean
   ./gradlew cleanBuildCache
   cd ..
   ```

### Issue: Metro bundler stuck

**Symptoms:**
Metro bundler shows no progress or is stuck.

**Solutions:**

1. **Reset Metro cache:**
   ```bash
   npx react-native start --reset-cache
   ```

2. **Kill Metro process:**
   ```bash
   lsof -ti:8081 | xargs kill
   npx react-native start
   ```

3. **Clear watchman:**
   ```bash
   watchman watch-del-all
   ```

## Runtime Errors

### Issue: "Invariant Violation: PassgageAccessProvider is not configured"

**Symptoms:**
```
Invariant Violation: PassgageAccessProvider is not configured
```

**Cause:**
PassgageAccessProvider is not wrapping your app, or hooks are used outside the provider.

**Solution:**

Ensure PassgageAccessProvider wraps your entire app:

```typescript
// App.tsx
import {PassgageAccessProvider} from '@passgage/sdk-react-native';

export default function App() {
  return (
    <PassgageAccessProvider
      apiUrl="https://api.passgage.com"
      apiKey="your-api-key"
    >
      <NavigationContainer>
        <YourApp />
      </NavigationContainer>
    </PassgageAccessProvider>
  );
}
```

Don't use SDK hooks outside the provider:

```typescript
// ❌ Wrong - outside provider
function AppContainer() {
  const {user} = usePassgageAuth(); // ERROR!

  return (
    <PassgageAccessProvider ...>
      <App />
    </PassgageAccessProvider>
  );
}

// ✅ Correct - inside provider
function AppContainer() {
  return (
    <PassgageAccessProvider ...>
      <App />
    </PassgageAccessProvider>
  );
}

function App() {
  const {user} = usePassgageAuth(); // OK!
  // ...
}
```

### Issue: "Network request failed"

**Symptoms:**
```
Error: Network request failed
TypeError: Network request failed
```

**Solutions:**

1. **Check internet connection:**
   ```typescript
   import NetInfo from '@react-native-community/netinfo';

   const netInfo = await NetInfo.fetch();
   console.log('Connected:', netInfo.isConnected);
   ```

2. **Verify API URL:**
   ```typescript
   // Test if API is reachable
   fetch('https://your-api.passgage.com/health')
     .then(res => console.log('Status:', res.status))
     .catch(err => console.error('Error:', err));
   ```

3. **Check iOS App Transport Security:**
   If using HTTP (not recommended), add to `Info.plist`:
   ```xml
   <key>NSAppTransportSecurity</key>
   <dict>
     <key>NSAllowsArbitraryLoads</key>
     <true/>
   </dict>
   ```

4. **Check Android cleartext traffic:**
   If using HTTP (not recommended), add to `AndroidManifest.xml`:
   ```xml
   <application
     android:usesCleartextTraffic="true">
   ```

### Issue: App crashes on startup

**Symptoms:**
App crashes immediately after launch with no clear error.

**Solutions:**

1. **Check native logs:**
   - iOS: Open Xcode, Window → Devices and Simulators → View Device Logs
   - Android: `adb logcat`

2. **Common causes:**
   - Missing peer dependencies
   - Incorrect native linking
   - Corrupted build cache

3. **Full reset:**
   ```bash
   # Clean everything
   rm -rf node_modules ios/Pods ios/build android/build
   rm -rf ios/Podfile.lock yarn.lock package-lock.json

   # Reinstall
   npm install
   cd ios && pod install && cd ..

   # Rebuild
   npx react-native run-ios
   # or
   npx react-native run-android
   ```

## Authentication Issues

### Issue: Login always fails

**Symptoms:**
Login returns error even with correct credentials.

**Solutions:**

1. **Check API credentials:**
   ```typescript
   console.log('API URL:', apiUrl);
   console.log('API Key:', apiKey ? 'Set' : 'Missing');
   ```

2. **Verify credentials are correct:**
   Test login with curl:
   ```bash
   curl -X POST https://api.passgage.com/auth/login \
     -H "Content-Type: application/json" \
     -H "X-API-Key: your-api-key" \
     -d '{"username":"test@example.com","password":"password"}'
   ```

3. **Check error message:**
   ```typescript
   const {login} = usePassgageAuth({
     onLoginError: (error) => {
       console.error('Login error:', error);
       console.error('Error message:', error.message);
       console.error('Error details:', JSON.stringify(error));
     },
   });
   ```

### Issue: Tokens expire immediately

**Symptoms:**
User is logged out immediately after login.

**Cause:**
Device clock is incorrect or token expiration time is wrong.

**Solutions:**

1. **Check device time:**
   Settings → General → Date & Time → Set Automatically

2. **Check token expiration:**
   ```typescript
   import {getStoredToken} from '@passgage/sdk-react-native';

   const token = await getStoredToken();
   console.log('Token expires at:', new Date(token.expiresAt));
   console.log('Current time:', new Date());
   ```

3. **Contact backend team:**
   Token expiration might be configured too short on the backend.

### Issue: User info not available

**Symptoms:**
```typescript
const {user} = usePassgageAuth();
console.log(user); // null
```

**Cause:**
User is not logged in, or token has expired.

**Solutions:**

1. **Check loading state:**
   ```typescript
   const {user, isLoading} = usePassgageAuth();

   if (isLoading) {
     return <LoadingScreen />;
   }

   if (!user) {
     return <LoginScreen />;
   }

   return <HomeScreen />;
   ```

2. **Force refresh:**
   ```typescript
   const {user, refreshUser} = usePassgageAuth();

   useEffect(() => {
     if (!user) {
       refreshUser();
     }
   }, []);
   ```

## Feature-Specific Issues

### QR Scanner Issues

**Issue: QR code validation always fails**

**Solutions:**

1. **Check QR code format:**
   ```typescript
   console.log('QR Code:', qrCode);
   console.log('QR Code length:', qrCode.length);
   ```

2. **Test with known valid code:**
   Ask backend team for a test QR code.

3. **Check backend logs:**
   Backend might reject the code for reasons not returned to client.

### NFC Scanner Issues

**Issue: "NFC not supported"**

**Solutions:**

1. **Check NFC hardware:**
   ```typescript
   import NfcManager from 'react-native-nfc-manager';

   const supported = await NfcManager.isSupported();
   console.log('NFC supported:', supported);
   ```

2. **Check device compatibility:**
   - Android: Most devices since 2012
   - iOS: iPhone 7 and newer

**Issue: NFC scanning hangs**

**Solutions:**

1. **Stop previous session:**
   ```typescript
   await stopScanning();
   await new Promise(resolve => setTimeout(resolve, 500));
   await startScanning();
   ```

2. **Check NFC is enabled:**
   ```typescript
   const enabled = await NfcManager.isEnabled();
   if (!enabled) {
     Alert.alert('Please enable NFC in settings');
     NfcManager.goToNfcSetting();
   }
   ```

### Location/Check-In Issues

**Issue: "Location not available"**

**Solutions:**

1. **Check location permission:**
   ```typescript
   import {check, PERMISSIONS, request} from 'react-native-permissions';

   const status = await check(
     Platform.OS === 'ios'
       ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
       : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
   );

   console.log('Location permission:', status);
   ```

2. **Request permission:**
   ```typescript
   const status = await request(
     Platform.OS === 'ios'
       ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
       : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
   );

   if (status !== 'granted') {
     Alert.alert('Location permission required');
   }
   ```

3. **Check location services:**
   Settings → Privacy → Location Services → Enable

**Issue: No branches found**

**Solutions:**

1. **Increase search radius:**
   ```typescript
   const result = await getNearbyBranches({
     radius: 20000, // 20km instead of 5km
   });
   ```

2. **Check current location:**
   ```typescript
   import Geolocation from '@react-native-community/geolocation';

   Geolocation.getCurrentPosition(
     position => console.log('Location:', position.coords),
     error => console.error('Location error:', error)
   );
   ```

3. **Verify branches exist:**
   Contact your Passgage admin to verify branches are configured in the system.

## Performance Issues

### Issue: App is slow/laggy

**Solutions:**

1. **Enable Hermes (Android):**
   In `android/app/build.gradle`:
   ```gradle
   project.ext.react = [
       enableHermes: true
   ]
   ```

2. **Reduce API calls:**
   ```typescript
   // ❌ Too many calls
   useEffect(() => {
     loadBranches();
   }, [search]); // Calls on every keystroke

   // ✅ Debounced
   const debouncedSearch = useDebounce(search, 500);
   useEffect(() => {
     loadBranches();
   }, [debouncedSearch]);
   ```

3. **Use pagination:**
   ```typescript
   const [page, setPage] = useState(1);

   const loadMore = () => {
     setPage(page + 1);
   };
   ```

### Issue: High memory usage

**Solutions:**

1. **Clear old data:**
   ```typescript
   // Clear history older than 30 days
   const filtered = history.filter(item => {
     const age = Date.now() - new Date(item.timestamp).getTime();
     return age < 30 * 24 * 60 * 60 * 1000;
   });
   ```

2. **Limit list size:**
   ```typescript
   <FlatList
     data={branches}
     maxToRenderPerBatch={10}
     windowSize={5}
     removeClippedSubviews={true}
   />
   ```

## Debugging Tips

### Enable Debug Logging

```typescript
// In development
<PassgageAccessProvider
  apiUrl="..."
  apiKey="..."
  debug={__DEV__}
>
  <App />
</PassgageAccessProvider>
```

### View Network Requests

Use Flipper or React Native Debugger to inspect network requests:

1. **Install Flipper:** https://fbflipper.com
2. **Enable Network plugin**
3. **View all SDK API calls**

### Log All SDK Calls

```typescript
const {login} = usePassgageAuth({
  onLoginSuccess: (user) => {
    console.log('[SDK] Login success:', user);
  },
  onLoginError: (error) => {
    console.error('[SDK] Login error:', error);
  },
});

const {scan} = usePassgageQRScanner({
  onSuccess: (entrance) => {
    console.log('[SDK] QR scan success:', entrance);
  },
  onError: (error) => {
    console.error('[SDK] QR scan error:', error);
  },
});
```

### Check SDK Version

```typescript
import {version} from '@passgage/sdk-react-native/package.json';
console.log('SDK version:', version);
```

### Test API Connectivity

```typescript
// Test basic connectivity
fetch('https://api.passgage.com/health')
  .then(res => {
    console.log('API reachable, status:', res.status);
    return res.json();
  })
  .then(data => console.log('Health check:', data))
  .catch(err => console.error('API unreachable:', err));
```

## Getting Help

If you can't resolve your issue:

1. **Check the FAQ:** [FAQ](./faq.md)
2. **Review documentation:** [Documentation](./README.md)
3. **Contact support:** support@passgage.com
4. **Open GitHub issue:** Include:
   - SDK version
   - React Native version
   - Platform (iOS/Android)
   - Steps to reproduce
   - Error messages
   - Relevant code snippets

---

**Couldn't find a solution?** Contact support@passgage.com with detailed information about your issue.
