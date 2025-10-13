# Passgage SDK React Native Example App

A complete example React Native application demonstrating all features of the **@passgage/sdk-react-native** package (v1.0.4).

## 📱 What This App Demonstrates

This example app showcases production-ready implementation of all Passgage SDK features:

### ✅ Authentication Flow
- JWT-based login with automatic token management
- User session persistence across app restarts
- Secure token storage (iOS Keychain / Android Keystore)
- Automatic token refresh
- User profile display
- Logout functionality

### ✅ QR Code Scanner
- QR code validation for access control
- Real-time feedback (success/error states)
- Result display with entrance information
- Clear button for quick re-scan
- Integration ready for react-native-vision-camera

### ✅ NFC Card Scanner
- NFC card reading and validation
- Start/Stop scanning controls
- Visual scanning status indicator
- Platform compatibility checks (iOS 13+, Android API 23+)
- Comprehensive error handling

### ✅ Location-Based Check-In
- Automatic nearby branch discovery (5km radius)
- Check-in / Check-out functionality
- Distance calculation and display
- Pull-to-refresh for branch list
- Empty state handling
- User authentication validation

### ✅ Remote Work Logging
- Work entry (start time) logging
- Work exit (end time) logging
- Optional description field
- Last action status display with timestamp
- User validation before actions

### ✅ User Interface Features
- Clean, modern UI design
- Loading states for all operations
- Error handling with user-friendly messages
- Success/failure visual feedback
- Responsive layouts
- Navigation between features

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm/yarn
- React Native development environment:
  - **iOS**: Xcode 13+, CocoaPods
  - **Android**: Android Studio, JDK 11+

### Installation

1. **Install dependencies:**
   ```bash
   yarn install
   # or
   npm install
   ```

2. **Install iOS pods (iOS only):**
   ```bash
   cd ios && pod install && cd ..
   ```

3. **Configure API credentials:**

   Update `App.tsx` with your Passgage API credentials:
   ```typescript
   <PassgageAccessProvider
     apiUrl="https://your-api.passgage.com"
     apiKey="your-api-key-here"
   >
   ```

### Running the App

**iOS:**
```bash
yarn ios
# or
npm run ios
```

**Android:**
```bash
yarn android
# or
npm run android
```

## 📁 Project Structure

```
passgage-sdk-example-react-native/
├── src/
│   └── screens/
│       ├── LoginScreen.tsx          # Authentication & JWT demo
│       ├── HomeScreen.tsx           # Main dashboard with user info
│       ├── QRScannerScreen.tsx      # QR code validation
│       ├── NFCScannerScreen.tsx     # NFC card validation
│       ├── CheckInScreen.tsx        # Location-based check-in
│       └── RemoteWorkScreen.tsx     # Remote work time logging
├── docs/                            # Complete SDK documentation
│   ├── README.md                    # Documentation index
│   ├── getting-started.md           # Setup guide
│   ├── authentication.md            # Auth flow details
│   ├── token-management.md          # JWT token handling
│   ├── features/                    # Feature-specific guides
│   │   ├── qr-scanner.md
│   │   ├── nfc-scanner.md
│   │   ├── check-in.md
│   │   └── remote-work.md
│   ├── error-handling.md            # Error handling patterns
│   ├── faq.md                       # Frequently asked questions
│   └── troubleshooting.md           # Common issues & solutions
├── App.tsx                          # Root component with Provider
├── package.json                     # Dependencies (SDK v1.0.4)
└── README.md                        # This file
```

## 🔧 SDK Integration Examples

### 1. Provider Setup (App.tsx)

The entire app must be wrapped with `PassgageAccessProvider`:

```typescript
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {PassgageAccessProvider, usePassgageAuth} from '@passgage/sdk-react-native';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <PassgageAccessProvider
      apiUrl="https://api.passgage.com"
      apiKey="your-api-key"
    >
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </PassgageAccessProvider>
  );
}
```

### 2. Authentication (LoginScreen.tsx)

```typescript
import {usePassgageAuth} from '@passgage/sdk-react-native';

function LoginScreen() {
  const {login, isLoading} = usePassgageAuth({
    onLoginSuccess: (user) => {
      Alert.alert('Success', `Welcome ${user.fullName}!`);
      navigation.replace('Home');
    },
    onLoginError: (error) => {
      Alert.alert('Login Failed', error.message);
    },
  });

  const handleLogin = async () => {
    await login({
      username: 'user@example.com',
      password: 'password123',
    });
  };

  return (
    <Button
      title={isLoading ? 'Logging in...' : 'Login'}
      onPress={handleLogin}
      disabled={isLoading}
    />
  );
}
```

### 3. QR Scanner (QRScannerScreen.tsx)

```typescript
import {usePassgageQRScanner} from '@passgage/sdk-react-native';

function QRScannerScreen() {
  const [lastResult, setLastResult] = useState<string | null>(null);

  const {scan, isLoading} = usePassgageQRScanner({
    onSuccess: (entrance) => {
      const message = `Access granted!\nEntrance ID: ${entrance?.id}`;
      setLastResult(message);
      Alert.alert('Success', message);
    },
    onError: (error) => {
      setLastResult(`Error: ${error.message}`);
      Alert.alert('Failed', error.message);
    },
  });

  const handleScan = async (qrCode: string) => {
    await scan(qrCode);
  };

  return (
    <View>
      <TextInput
        placeholder="Enter QR code"
        onSubmitEditing={(e) => handleScan(e.nativeEvent.text)}
      />
      {lastResult && (
        <Text style={{color: lastResult.includes('Error') ? 'red' : 'green'}}>
          {lastResult}
        </Text>
      )}
    </View>
  );
}
```

### 4. NFC Scanner (NFCScannerScreen.tsx)

```typescript
import {usePassgageNFCScanner} from '@passgage/sdk-react-native';

function NFCScannerScreen() {
  const {startScanning, stopScanning, isScanning} = usePassgageNFCScanner({
    onSuccess: (entrance) => {
      Alert.alert('Access Granted', `Entrance ID: ${entrance?.id}`);
      stopScanning();
    },
    onError: (error) => {
      Alert.alert('Access Denied', error.message);
      stopScanning();
    },
  });

  return (
    <View>
      {!isScanning ? (
        <Button title="Start NFC Scan" onPress={startScanning} />
      ) : (
        <>
          <ActivityIndicator />
          <Text>Hold device near NFC card...</Text>
          <Button title="Stop Scanning" onPress={stopScanning} />
        </>
      )}
    </View>
  );
}
```

### 5. Check-In (CheckInScreen.tsx)

```typescript
import {usePassgageCheckIn, usePassgageAuth} from '@passgage/sdk-react-native';

function CheckInScreen() {
  const {user} = usePassgageAuth();
  const {getNearbyBranches, checkInEntry, checkInExit, isLoading} = usePassgageCheckIn();
  const [branches, setBranches] = useState([]);

  const loadBranches = async () => {
    const result = await getNearbyBranches({
      radius: 5000, // 5km
    });

    if (result.success && result.data) {
      setBranches(result.data);
    }
  };

  const handleCheckIn = async (branchId: string) => {
    if (!user?.id) return;

    const result = await checkInEntry({
      branchId,
      userId: user.id,
    });

    if (result.success) {
      Alert.alert('Success', 'Checked in successfully');
    }
  };

  return (
    <FlatList
      data={branches}
      renderItem={({item}) => (
        <View>
          <Text>{item.title}</Text>
          <Text>{item.address}</Text>
          <Text>📍 {Math.round(item.distance)}m away</Text>
          <Button title="Check In" onPress={() => handleCheckIn(item.id)} />
        </View>
      )}
      onRefresh={loadBranches}
      refreshing={isLoading}
    />
  );
}
```

### 6. Remote Work (RemoteWorkScreen.tsx)

```typescript
import {usePassgageRemoteWork, usePassgageAuth} from '@passgage/sdk-react-native';

function RemoteWorkScreen() {
  const {user} = usePassgageAuth();
  const {logEntry, logExit, isLoading} = usePassgageRemoteWork();
  const [description, setDescription] = useState('');

  const handleStartWork = async () => {
    if (!user?.id) return;

    const result = await logEntry({
      userId: user.id,
      description: description.trim() || undefined,
    });

    if (result.success) {
      Alert.alert('Success', 'Work started');
      setDescription('');
    }
  };

  const handleEndWork = async () => {
    if (!user?.id) return;

    const result = await logExit({
      userId: user.id,
      description: description.trim() || undefined,
    });

    if (result.success) {
      Alert.alert('Success', 'Work ended');
      setDescription('');
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Description (optional)"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <Button
        title="Start Work"
        onPress={handleStartWork}
        disabled={isLoading}
      />
      <Button
        title="End Work"
        onPress={handleEndWork}
        disabled={isLoading}
      />
    </View>
  );
}
```

## 🎣 Available Hooks

All hooks use the `usePassgage*` prefix for better discoverability and to avoid naming conflicts:

| Hook | Purpose | Documentation |
|------|---------|---------------|
| `usePassgageAuth()` | Authentication & user management | [docs/authentication.md](docs/authentication.md) |
| `usePassgageQRScanner()` | QR code validation | [docs/features/qr-scanner.md](docs/features/qr-scanner.md) |
| `usePassgageNFCScanner()` | NFC card validation | [docs/features/nfc-scanner.md](docs/features/nfc-scanner.md) |
| `usePassgageCheckIn()` | Location-based check-in | [docs/features/check-in.md](docs/features/check-in.md) |
| `usePassgageRemoteWork()` | Remote work logging | [docs/features/remote-work.md](docs/features/remote-work.md) |

## 📚 Documentation

Complete documentation is available in the `docs/` directory:

- **[Getting Started](docs/getting-started.md)** - Installation and setup
- **[Authentication](docs/authentication.md)** - Login flow and user sessions
- **[Token Management](docs/token-management.md)** - Automatic JWT handling
- **[Error Handling](docs/error-handling.md)** - Error handling patterns
- **[FAQ](docs/faq.md)** - Frequently asked questions
- **[Troubleshooting](docs/troubleshooting.md)** - Common issues and solutions

### Feature Guides

- **[QR Scanner](docs/features/qr-scanner.md)** - QR code scanning implementation
- **[NFC Scanner](docs/features/nfc-scanner.md)** - NFC card scanning implementation
- **[Check-In](docs/features/check-in.md)** - Location-based check-in implementation
- **[Remote Work](docs/features/remote-work.md)** - Remote work logging implementation

## 🔐 Security Features

This example demonstrates SDK security features:

- ✅ JWT tokens stored in iOS Keychain / Android Keystore
- ✅ Automatic token refresh when expired
- ✅ HTTPS-only API communication (TLS 1.2+)
- ✅ No passwords stored locally
- ✅ User data cached securely
- ✅ Tokens cleared on logout

## 📦 Dependencies

### Required
- `@passgage/sdk-react-native`: ^1.0.4
- `@react-native-community/geolocation`: ^3.0.0
- `react-native-keychain`: ^8.0.0

### Optional (for specific features)
- `react-native-nfc-manager`: ^3.14.0 (NFC scanning)
- `react-native-vision-camera`: ^4.0.0 (QR camera scanning)

## 🐛 Troubleshooting

### Common Issues

**"Cannot find module '@passgage/sdk-react-native'"**
```bash
yarn install
npx react-native start --reset-cache
```

**Location not working**
- iOS: Check `Info.plist` has location permissions
- Android: Check `AndroidManifest.xml` has location permissions
- Ensure location services are enabled on device

**NFC not working**
- Check device has NFC hardware
- Ensure NFC is enabled in device settings
- iOS: Requires iPhone 7+ with iOS 13+
- Android: Requires Android 6.0+ (API 23+)

**Build errors**
```bash
# iOS
cd ios && pod deintegrate && pod install && cd ..

# Android
cd android && ./gradlew clean && cd ..

# Metro
npx react-native start --reset-cache
```

For more troubleshooting help, see [docs/troubleshooting.md](docs/troubleshooting.md)

## 📄 API Response Format

All SDK methods return a standardized response:

```typescript
{
  success: boolean;
  data?: any;       // Response data on success
  error?: string;   // Error message on failure
}
```

Example error handling:

```typescript
const result = await login(credentials);

if (result.success) {
  console.log('User:', result.data.user);
} else {
  console.error('Error:', result.error);
}
```

## 🚀 Next Steps

After exploring this example app:

1. **Read the Documentation**: Start with [docs/getting-started.md](docs/getting-started.md)
2. **Integrate into Your App**: Follow the [Integration Guide](docs/getting-started.md#quick-start)
3. **Customize UI**: Use the screens as templates for your design
4. **Add Features**: Implement only the features you need
5. **Test Thoroughly**: See [docs/troubleshooting.md](docs/troubleshooting.md) for testing tips

## 📞 Support

- **Documentation**: See `docs/` directory
- **Issues**: Open an issue on GitHub
- **Email**: support@passgage.com
- **Website**: https://passgage.com

## 📝 License

This example app is provided for demonstration purposes.
The Passgage SDK is proprietary - © 2025 Passgage.

---

**Built with ❤️ by the Passgage Team**

SDK Version: 1.0.4 | React Native: 0.76.9
