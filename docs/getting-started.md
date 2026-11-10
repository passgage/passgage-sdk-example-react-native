# Getting Started

This page takes you from an empty React Native app to a signed-in user, with `@passgage/sdk-react-native` 1.0.21.

- [Requirements](#requirements)
- [Installation](#installation)
- [Native setup](#native-setup)
- [Provider setup](#provider-setup)
- [A minimal app](#a-minimal-app)
- [What happens at startup](#what-happens-at-startup)
- [Next steps](#next-steps)

## Requirements

From the package's `peerDependencies`:

| Package | Version |
|---------|---------|
| `react` | >=18.0.0 |
| `react-native` | >=0.70.0 |

You also need the URL of your Passgage API (`baseURL`), and users who sign in either with Azure AD or with email/phone and password.

## Installation

```bash
npm install @passgage/sdk-react-native
# or
yarn add @passgage/sdk-react-native
```

### Peer dependencies

The SDK imports four native modules. Install them in your app: React Native only links native modules that are direct dependencies of the app.

```bash
npm install react-native-geolocation-service react-native-permissions react-native-keychain react-native-nfc-manager
```

| Package | Version | Used for |
|---------|---------|----------|
| `react-native-geolocation-service` | ^5.3.1 | Reading the location for the range check |
| `react-native-permissions` | ^5.4.4 | Checking and requesting the location permission |
| `react-native-keychain` | >=8.0.0 | Storing the session (Keychain / Keystore) |
| `react-native-nfc-manager` | ^3.14.0 | Reading NFC tags |

Install all four, also if you do not use NFC: the SDK imports each of them.

The SDK does not read QR codes from the camera. Use the scanner of your choice (for example `react-native-vision-camera`) and pass the code it reads to `scan`. See [QR Scanner](./features/qr-scanner.md).

On iOS, install the pods afterwards:

```bash
cd ios && pod install
```

## Native setup

Follow the native setup of each library. The SDK needs the parts below.

### Location permission

The provider checks the location permission when it mounts, and asks for it if the user has not been asked yet:

| Platform | Permission the SDK asks for |
|----------|-----------------------------|
| Android | `ACCESS_FINE_LOCATION` |
| iOS | `LOCATION_WHEN_IN_USE` |

**iOS.** `react-native-permissions` only includes the permission handlers you list in the `Podfile`. Without `LocationWhenInUse` the permission is reported as unavailable and the user is never asked:

```ruby
# ios/Podfile
node_require('react-native-permissions/scripts/setup.rb')

setup_permissions([
  'LocationWhenInUse',
])
```

Add the usage text to `Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Your location is used to check that you are near the door.</string>
```

Run `pod install` again after changing the `Podfile`.

**Android.** Add the permission to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

### Secure storage

`react-native-keychain` needs no extra configuration for the SDK. The session is written with `WHEN_UNLOCKED` accessibility, so it can only be read while the device is unlocked. See [Token Management](./token-management.md#the-ios-locked-device-case).

### NFC

Follow the setup of [react-native-nfc-manager](https://github.com/revtel/react-native-nfc-manager) (on iOS the NFC capability and `NFCReaderUsageDescription`, on Android the `NFC` permission). The SDK does not start the NFC manager: your app calls `NfcManager.start()`. See [NFC Scanner](./features/nfc-scanner.md).

## Provider setup

Wrap your app in `PassgageAccessProvider`. The provider creates the HTTP client that every SDK request uses, so mount it before any screen that uses the SDK.

```tsx
import {PassgageAccessProvider} from '@passgage/sdk-react-native';

export default function App() {
  return (
    <PassgageAccessProvider
      baseURL="https://your-api.passgage.com"
      onUnauthorized={error => {
        // There is no session: show your login screen
        console.log('Unauthorized:', error.message);
      }}
      getLocationErrorCallback={error => {
        console.log('Location error:', error);
      }}
      locationPermissionErrorCallback={error => {
        console.log('Permission check failed:', error);
      }}>
      <Root />
    </PassgageAccessProvider>
  );
}
```

### Provider props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `baseURL` | `string` | Yes | - | Base URL of your Passgage API. Requests go to `${baseURL}/api/${apiVersion}` |
| `msalToken` | `string` | No | - | Azure AD `id_token`. Read once, when the provider mounts; a value passed later is ignored. Omit it for email/phone + password sign-in, or when you call `loginWithAzure` yourself |
| `apiVersion` | `string` | No | `'v2'` | API version in the request path |
| `timeout` | `number` | No | `30000` | Request timeout in milliseconds |
| `rememberUser` | `boolean` | No | `true` | Only used without `msalToken`. `true` restores the stored session at startup. `false` signs out at every startup |
| `onUnauthorized` | `(error: Error) => void` | No | - | Called when there is no session: no stored session at startup, the provider's Azure login failed, or a session ended because it could not be refreshed. See [Authentication](./authentication.md#when-onunauthorized-is-called) |
| `getLocationErrorCallback` | `(error: any) => void` | No | - | Called when the location cannot be read. A missing permission arrives here too (`error.code === 1`) |
| `locationPermissionErrorCallback` | `(error: any) => void` | No | - | Called when the state of the location permission cannot be checked |
| `children` | `ReactNode` | Yes | - | Your app |

The provider reads its props once, when it mounts. Changing `baseURL`, `msalToken`, `apiVersion`, `timeout` or `rememberUser` afterwards has no effect. `onUnauthorized` is the exception: the provider always calls the latest one you passed.

## A minimal app

`useAuthStore` is a zustand hook. Two of its fields decide what to render:

| Field | Type | Meaning |
|-------|------|---------|
| `initialized` | `boolean` | `false` until it is known whether there is a session. Show a splash screen while it is `false` |
| `authStatus` | `boolean` | `true` while a user is signed in |

Check `initialized` first. During startup `authStatus` is `false` while the stored session is being read, and it can already be `true` while the SDK is still renewing that session. Do not gate on `loading` either: it is also `true` during every login and logout, so your navigator would unmount on each attempt.

```tsx
import React from 'react';
import {ActivityIndicator, Button, Text, View} from 'react-native';
import {
  PassgageAccessProvider,
  useAuthStore,
} from '@passgage/sdk-react-native';

function Splash() {
  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <ActivityIndicator size="large" />
    </View>
  );
}

function LoginScreen() {
  const {login, loading, error} = useAuthStore();

  return (
    <View style={{flex: 1, justifyContent: 'center', padding: 24}}>
      {error ? <Text style={{color: 'red'}}>{error}</Text> : null}
      <Button
        title={loading ? 'Signing in...' : 'Sign in'}
        disabled={loading}
        onPress={() =>
          login({login: 'user@example.com', password: 'password'})
        }
      />
    </View>
  );
}

function HomeScreen() {
  const {user, logout} = useAuthStore();

  return (
    <View style={{flex: 1, justifyContent: 'center', padding: 24}}>
      <Text>Signed in as {user?.fullName ?? 'unknown user'}</Text>
      <Button title="Sign out" onPress={() => logout()} />
    </View>
  );
}

function Root() {
  const {initialized, authStatus} = useAuthStore();

  if (!initialized) {
    return <Splash />;
  }
  return authStatus ? <HomeScreen /> : <LoginScreen />;
}

export default function App() {
  return (
    <PassgageAccessProvider baseURL="https://your-api.passgage.com">
      <Root />
    </PassgageAccessProvider>
  );
}
```

`user` can be `null` while `authStatus` is `true` (for example when the user record could not be loaded), so read it with `?.`.

A full login screen for each sign-in method is in [Authentication](./authentication.md).

## What happens at startup

The provider does this once, in a mount effect:

1. **Location permission.** Checks `ACCESS_FINE_LOCATION` (Android) or `LOCATION_WHEN_IN_USE` (iOS). If the user has not been asked yet, it asks. Then it reads the location once (a single reading, not continuous tracking). If the permission check itself fails, `locationPermissionErrorCallback` is called. If the location cannot be read, `getLocationErrorCallback` is called.
2. **HTTP client.** Creates the client for `${baseURL}/api/${apiVersion}` with `timeout`, and connects its 401 handling to the session refresh.
3. **Session.** One of three paths:

| Situation | What the provider does |
|-----------|------------------------|
| `msalToken` is set | Signs in with Azure (`loginWithAzure`) and does not restore the stored session. If the login fails, calls `onUnauthorized` with the message `Azure login failed: <reason>`. `initialized` becomes `true` when the login has finished |
| No `msalToken`, `rememberUser` is `true` (default) | Restores the session stored in the Keychain. A session older than 30 days is renewed first. If there is no session, calls `onUnauthorized` with the message `No active session. Login is required` |
| No `msalToken`, `rememberUser` is `false` | Calls `logout()` and then `onUnauthorized` with `No active session. Login is required` |

Why the Azure path does not restore: the API keeps one active session per user. The Azure login creates a new session and invalidates the stored one, so the provider does not send requests with the old token. See [Authentication](./authentication.md#one-active-session-per-user).

After a successful login or restore, the SDK loads the devices the user may use and the list of codes the user may read. The QR and NFC hooks need these lists.

If iOS refuses to read the Keychain because the device is locked (the app was started in the background), the restore result is `'unavailable'`. The provider then waits until the app comes to the foreground and tries again. `initialized` stays `false` until then. See [Token Management](./token-management.md#the-ios-locked-device-case).

## Next steps

- [Authentication](./authentication.md): Azure AD and email/phone sign-in, logout, `onUnauthorized`
- [Token Management](./token-management.md): how the session is stored, renewed and ended
- [QR Scanner](./features/qr-scanner.md) and [NFC Scanner](./features/nfc-scanner.md)
- [Error Handling](./error-handling.md)
- [Troubleshooting](./troubleshooting.md) and [FAQ](./faq.md)
