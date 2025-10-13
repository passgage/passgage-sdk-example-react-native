# Frequently Asked Questions (FAQ)

Common questions and answers about the Passgage SDK.

## Table of Contents

- [General Questions](#general-questions)
- [Installation & Setup](#installation--setup)
- [Authentication](#authentication)
- [Features](#features)
- [Troubleshooting](#troubleshooting)
- [Performance](#performance)
- [Security](#security)

## General Questions

### What is the Passgage SDK?

The Passgage SDK (@passgage/sdk-react-native) is a React Native library that provides access control, time tracking, and attendance management features for mobile applications.

### Which platforms are supported?

- **iOS**: 13.0 and higher
- **Android**: API level 23 (Android 6.0) and higher
- **React Native**: 0.70 and higher

### Is TypeScript supported?

Yes! The SDK is written in TypeScript and includes complete type definitions. You get full IntelliSense and type checking out of the box.

### What features does the SDK provide?

- JWT-based authentication with automatic token management
- QR code scanning for access control
- NFC card scanning for access control
- Location-based check-in/check-out
- Remote work time logging
- Automatic location detection
- Secure credential storage

### How much does the SDK cost?

The SDK is part of the Passgage platform. Contact sales@passgage.com for pricing information.

### Can I use the SDK in a commercial app?

Yes, the SDK can be used in commercial applications. Review the license terms or contact Passgage for licensing details.

## Installation & Setup

### How do I install the SDK?

```bash
npm install @passgage/sdk-react-native
# or
yarn add @passgage/sdk-react-native
```

See the [Getting Started Guide](./getting-started.md) for complete installation instructions.

### What are the peer dependencies?

Required:
- `@react-native-community/geolocation` - For location services
- `react-native-keychain` - For secure storage

Optional (based on features you use):
- `react-native-nfc-manager` - For NFC scanning
- `react-native-vision-camera` - For QR scanning with camera

### Do I need to eject from Expo?

Yes, currently the SDK requires native modules that are not available in Expo Go. You'll need to use a development build or bare React Native workflow.

### How do I get API credentials?

Contact your Passgage account administrator or support@passgage.com to get your API URL and API key.

### Can I use environment variables for configuration?

Yes! We recommend using `react-native-config`:

```typescript
import Config from 'react-native-config';

<PassgageAccessProvider
  apiUrl={Config.PASSGAGE_API_URL}
  apiKey={Config.PASSGAGE_API_KEY}
>
  <App />
</PassgageAccessProvider>
```

## Authentication

### How does authentication work?

The SDK uses JWT (JSON Web Token) based authentication:

1. User logs in with username/password
2. Backend returns access token and refresh token
3. Tokens are securely stored using react-native-keychain
4. Access token is automatically added to all API requests
5. Expired tokens are automatically refreshed

See the [Authentication Guide](./authentication.md) for details.

### Are tokens automatically refreshed?

Yes! When an access token expires, the SDK automatically:
1. Detects the 401 response
2. Uses the refresh token to get a new access token
3. Retries the original request
4. Updates the stored tokens

You don't need to handle token refresh manually.

### How long do tokens last?

- **Access Token**: Typically 1 hour
- **Refresh Token**: Typically 30 days

Contact your backend team for exact expiration times.

### Where are credentials stored?

Credentials are stored securely using `react-native-keychain`, which uses:
- **iOS**: Keychain Services
- **Android**: Keystore system

This provides hardware-backed security when available.

### Can users stay logged in between app restarts?

Yes! The SDK persists tokens in secure storage. When the app restarts, the SDK automatically loads stored tokens and the user remains logged in (unless tokens have expired).

### How do I implement "Remember Me" functionality?

The SDK implements this automatically. To force logout on app restart, clear tokens manually:

```typescript
const {logout} = usePassgageAuth();

// On app close or logout
await logout();
```

### Can I implement biometric authentication?

Yes! Use `react-native-biometrics` to protect your login screen:

```typescript
import ReactNativeBiometrics from 'react-native-biometrics';

const authenticateWithBiometrics = async () => {
  const {success} = await ReactNativeBiometrics.simplePrompt({
    promptMessage: 'Authenticate to login',
  });

  if (success) {
    // Proceed with auto-login using stored credentials
    await login({username, password});
  }
};
```

## Features

### Can I use only some features (e.g., just authentication)?

Yes! All features are optional. You can use only the features you need:

```typescript
// Use only authentication
import {usePassgageAuth} from '@passgage/sdk-react-native';

// Or use specific features
import {usePassgageQRScanner} from '@passgage/sdk-react-native';
```

### Does QR scanning require camera access?

The SDK provides QR validation only. For actual camera scanning, integrate with `react-native-vision-camera`:

```typescript
import {Camera, useCodeScanner} from 'react-native-vision-camera';
import {usePassgageQRScanner} from '@passgage/sdk-react-native';

// Combine camera scanning with SDK validation
const {scan} = usePassgageQRScanner();

const codeScanner = useCodeScanner({
  codeTypes: ['qr'],
  onCodeScanned: (codes) => {
    if (codes[0]?.value) {
      scan(codes[0].value);
    }
  },
});
```

### Does NFC scanning work on all devices?

NFC is only available on devices with NFC hardware:
- Most Android devices since 2012
- iPhone 7 and newer (iOS 11+)

Check NFC support before using:

```typescript
import NfcManager from 'react-native-nfc-manager';

const supported = await NfcManager.isSupported();
```

### Can I customize the QR/NFC validation behavior?

Yes, use callbacks to handle success/error cases:

```typescript
const {scan} = usePassgageQRScanner({
  onSuccess: (entrance) => {
    // Custom success handling
    navigation.navigate('AccessGranted', {entrance});
  },
  onError: (error) => {
    // Custom error handling
    showCustomErrorModal(error.message);
  },
});
```

### How accurate is location-based check-in?

Location accuracy depends on:
- GPS signal quality (better outdoors)
- Device GPS capability
- Location permissions granted

Typical accuracy: 5-50 meters outdoors, lower indoors.

### Can users check in without being at the location?

No. The backend validates that the user is within the configured radius (typically 100m) of the branch location. GPS spoofing detection may also be implemented server-side.

### Does remote work logging require location?

No, remote work logging doesn't require specific location. However, location may be recorded for audit purposes if available.

## Troubleshooting

### The SDK can't connect to the backend

Check:
1. API URL is correct and accessible
2. API key is valid
3. Device has internet connection
4. Firewall/network isn't blocking the connection
5. Backend service is running

```typescript
// Test connectivity
fetch('https://your-api.passgage.com/health')
  .then(() => console.log('Backend is reachable'))
  .catch(() => console.error('Cannot reach backend'));
```

### Tokens keep expiring immediately

Possible causes:
1. Device clock is incorrect (check device time settings)
2. Token expiration is too short (check backend config)
3. Refresh token is not working (check backend logs)

### Location services aren't working

Check:
1. Location permissions are granted
2. Location services are enabled on device
3. GPS has good signal (try going outdoors)
4. Info.plist (iOS) / AndroidManifest.xml have required entries

See [Getting Started](./getting-started.md#platform-specific-setup) for permission setup.

### NFC scanning doesn't work

Check:
1. Device has NFC hardware
2. NFC is enabled in device settings
3. NFC permissions are granted
4. Card is compatible (ISO 14443A/B or ISO 15693)
5. Phone case isn't too thick

### Build fails after installing SDK

Try:
1. Clean build: `cd ios && pod install && cd ..`
2. Clear Metro cache: `npx react-native start --reset-cache`
3. Clean native builds: `cd android && ./gradlew clean`
4. Reinstall dependencies: `rm -rf node_modules && npm install`

### App crashes on launch

Check:
1. All peer dependencies are installed
2. Native linking is complete (run `pod install` on iOS)
3. PassgageAccessProvider wraps your app correctly
4. Review crash logs for specific errors

## Performance

### Does the SDK affect app performance?

The SDK is optimized for minimal performance impact:
- Small bundle size (~50KB gzipped)
- Lazy loading of features
- Efficient API calls with caching
- Minimal memory footprint

### How much does the SDK increase app size?

Approximately:
- **JavaScript**: ~50KB gzipped
- **Native iOS**: ~100KB
- **Native Android**: ~150KB

Total impact: <300KB on app size.

### Does the SDK work offline?

Partially:
- User info is cached (accessible offline)
- QR/NFC validation requires internet (validates with backend)
- Check-in/check-out requires internet
- Remote work logging requires internet

Authentication tokens persist offline, so users remain logged in.

### How can I improve performance?

1. **Enable caching** for frequently accessed data
2. **Debounce** rapid API calls
3. **Implement pagination** for lists
4. **Use callbacks** instead of polling for state changes
5. **Clear old data** periodically

### Does the SDK drain battery?

No significant battery drain. Location services use minimal power with "when in use" permission. No background processes run unless you implement them.

## Security

### Is the SDK secure?

Yes, the SDK follows security best practices:
- JWT tokens stored in hardware-backed secure storage
- HTTPS for all network requests (TLS 1.2+)
- No sensitive data in app logs
- Automatic token refresh
- Secure keychain storage

See the [Security Guide](./security.md) for details.

### Can tokens be stolen?

Tokens are stored in the device's secure storage (Keychain/Keystore) which is encrypted and protected by the OS. Apps cannot access each other's keychain data.

### How do I report a security issue?

Email security@passgage.com with details. Do not post security issues publicly.

### Are passwords stored locally?

No. Passwords are never stored locally. They're only sent during login and immediately discarded after receiving tokens.

### Does the SDK validate SSL certificates?

Yes. All HTTPS connections validate SSL certificates. Certificate pinning can be implemented for extra security (contact support for details).

### What data does the SDK collect?

The SDK only collects data necessary for functionality:
- User authentication credentials (during login only)
- Location (when using check-in features)
- Device info (for access audit logs)
- Timestamps for attendance tracking

No analytics or tracking data is collected by the SDK itself.

### Is the SDK GDPR compliant?

The SDK provides tools to build GDPR-compliant apps. Your implementation should:
- Display privacy policy before data collection
- Allow users to request data deletion
- Obtain consent for location tracking
- Provide data export functionality

Contact Passgage for GDPR compliance guidance.

## Still Have Questions?

- Check the [Troubleshooting Guide](./troubleshooting.md)
- Review the [Examples](./examples.md)
- Contact support@passgage.com
- Open an issue on GitHub

---

**Can't find your question?** Submit it to docs@passgage.com and we'll add it to this FAQ.
