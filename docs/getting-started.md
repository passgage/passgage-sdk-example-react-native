# Getting Started with Passgage SDK

This guide will walk you through integrating the Passgage SDK into your React Native application.

## Prerequisites

- React Native 0.70 or higher
- iOS 13.0+ / Android 6.0+
- Node.js 16+ and npm/yarn
- Basic knowledge of React Native and TypeScript

## Installation

### Step 1: Install the SDK

```bash
npm install @passgage/sdk-react-native
# or
yarn add @passgage/sdk-react-native
```

### Step 2: Install Required Peer Dependencies

```bash
npm install @react-native-community/geolocation react-native-keychain
```

### Step 3: Install Optional Dependencies (Based on Features)

If you're using NFC scanning:
```bash
npm install react-native-nfc-manager
```

If you're using QR scanning with camera:
```bash
npm install react-native-vision-camera
```

### Step 4: Platform-Specific Setup

#### iOS Setup

1. Install CocoaPods dependencies:
```bash
cd ios && pod install && cd ..
```

2. Add location permissions to `ios/YourApp/Info.plist`:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to find nearby branches for check-in</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>We need your location to find nearby branches</string>
```

3. If using NFC, add NFC capability:
```xml
<key>NFCReaderUsageDescription</key>
<string>We need NFC access to scan employee cards</string>
```

4. If using camera for QR codes:
```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to scan QR codes</string>
```

#### Android Setup

1. Add permissions to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

2. If using NFC:
```xml
<uses-permission android:name="android.permission.NFC" />
<uses-feature android:name="android.hardware.nfc" android:required="false" />
```

3. If using camera:
```xml
<uses-permission android:name="android.permission.CAMERA" />
```

## Quick Start

### Step 1: Wrap Your App with PassgageAccessProvider

The provider must wrap your entire application to provide authentication context.

```typescript
// App.tsx
import React from 'react';
import {PassgageAccessProvider} from '@passgage/sdk-react-native';
import {NavigationContainer} from '@react-navigation/native';
import {MainNavigator} from './navigation';

export default function App() {
  return (
    <PassgageAccessProvider
      apiUrl="https://api.passgage.com"  // Your API URL
      apiKey="your-api-key-here"          // Your API key
    >
      <NavigationContainer>
        <MainNavigator />
      </NavigationContainer>
    </PassgageAccessProvider>
  );
}
```

### Step 2: Create a Login Screen

```typescript
// screens/LoginScreen.tsx
import React, {useState} from 'react';
import {
  View,
  TextInput,
  Button,
  Text,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import {usePassgageAuth} from '@passgage/sdk-react-native';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const {login, isLoading, error} = usePassgageAuth({
    onLoginSuccess: (user) => {
      Alert.alert('Success', `Welcome ${user.fullName}!`);
      // Navigation will automatically happen when authenticated
    },
    onLoginError: (error) => {
      Alert.alert('Login Failed', error.message);
    },
  });

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    await login({username, password});
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Passgage Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Username or Email"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        editable={!isLoading}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isLoading}
      />

      {error && <Text style={styles.error}>{error.message}</Text>}

      <Button
        title={isLoading ? 'Logging in...' : 'Login'}
        onPress={handleLogin}
        disabled={isLoading}
      />

      {isLoading && <ActivityIndicator style={styles.loader} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  error: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
  loader: {
    marginTop: 20,
  },
});
```

### Step 3: Create Navigation Based on Auth State

```typescript
// navigation/MainNavigator.tsx
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {usePassgageAuth} from '@passgage/sdk-react-native';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import QRScannerScreen from '../screens/QRScannerScreen';

const Stack = createNativeStackNavigator();

export function MainNavigator() {
  const {user, isLoading} = usePassgageAuth();

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator>
      {!user ? (
        // User is not authenticated
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{headerShown: false}}
        />
      ) : (
        // User is authenticated
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{title: 'Home'}}
          />
          <Stack.Screen
            name="QRScanner"
            component={QRScannerScreen}
            options={{title: 'QR Scanner'}}
          />
          {/* Add more authenticated screens */}
        </>
      )}
    </Stack.Navigator>
  );
}
```

### Step 4: Use SDK Features

Now you can use any SDK feature in your authenticated screens:

```typescript
// screens/HomeScreen.tsx
import React from 'react';
import {View, Text, Button} from 'react-native';
import {usePassgageAuth} from '@passgage/sdk-react-native';

export default function HomeScreen({navigation}) {
  const {user, logout} = usePassgageAuth();

  return (
    <View style={{flex: 1, padding: 20}}>
      <Text>Welcome, {user?.fullName}!</Text>
      <Text>Email: {user?.email}</Text>

      {user?.company && (
        <Text>Company: {user.company.name}</Text>
      )}

      <Button
        title="Scan QR Code"
        onPress={() => navigation.navigate('QRScanner')}
      />

      <Button
        title="Check In"
        onPress={() => navigation.navigate('CheckIn')}
      />

      <Button
        title="Logout"
        onPress={logout}
      />
    </View>
  );
}
```

## Project Structure

Here's a recommended project structure when using the SDK:

```
your-app/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── QRScannerScreen.tsx
│   │   ├── NFCScannerScreen.tsx
│   │   ├── CheckInScreen.tsx
│   │   └── RemoteWorkScreen.tsx
│   ├── navigation/
│   │   └── MainNavigator.tsx
│   ├── components/
│   │   ├── LoadingScreen.tsx
│   │   └── ErrorBoundary.tsx
│   └── types/
│       └── navigation.ts
├── App.tsx
└── package.json
```

## Configuration Options

The `PassgageAccessProvider` accepts the following props:

```typescript
interface PassgageAccessProviderProps {
  // Required
  apiUrl: string;        // Your Passgage API URL
  apiKey: string;        // Your API key

  // Optional
  children: ReactNode;   // Your app components
  timeout?: number;      // API request timeout (default: 30000ms)
  debug?: boolean;       // Enable debug logging (default: false)
}
```

Example with all options:
```typescript
<PassgageAccessProvider
  apiUrl="https://api.passgage.com"
  apiKey="your-api-key-here"
  timeout={60000}  // 60 seconds
  debug={__DEV__}  // Enable in development
>
  <App />
</PassgageAccessProvider>
```

## Environment Variables

For better security, use environment variables:

1. Install react-native-config:
```bash
npm install react-native-config
```

2. Create `.env` file:
```env
PASSGAGE_API_URL=https://api.passgage.com
PASSGAGE_API_KEY=your-api-key-here
```

3. Use in your app:
```typescript
import Config from 'react-native-config';

<PassgageAccessProvider
  apiUrl={Config.PASSGAGE_API_URL}
  apiKey={Config.PASSGAGE_API_KEY}
>
  <App />
</PassgageAccessProvider>
```

## Next Steps

Now that you have the basic setup complete, explore the SDK features:

- [Authentication Flow](./authentication.md) - Understand how authentication works
- [QR Scanner](./features/qr-scanner.md) - Implement QR code scanning
- [NFC Scanner](./features/nfc-scanner.md) - Implement NFC card scanning
- [Check-In](./features/check-in.md) - Implement location-based check-in
- [Remote Work](./features/remote-work.md) - Implement remote work tracking
- [Token Management](./token-management.md) - Learn about automatic token handling
- [Error Handling](./error-handling.md) - Handle errors gracefully

## Example Application

Check out the complete example application at:
```
examples/passgage-sdk-example-react-native
```

This example demonstrates all SDK features with production-ready code.

## Troubleshooting

If you encounter issues during setup, check the [Troubleshooting Guide](./troubleshooting.md) or see common issues below:

### Common Setup Issues

**Issue**: "Unable to resolve module @passgage/sdk-react-native"
- **Solution**: Run `npm install` or `yarn install` again
- Clear Metro cache: `npx react-native start --reset-cache`

**Issue**: Location permissions not working
- **Solution**: Check that permissions are added to Info.plist (iOS) and AndroidManifest.xml (Android)
- Request permissions at runtime using react-native-permissions

**Issue**: "Invariant Violation: "PassgageAccessProvider" is not configured"
- **Solution**: Make sure `PassgageAccessProvider` wraps your entire app component tree

For more issues and solutions, see the [FAQ](./faq.md).
