# Passgage SDK React Native Example

This is an example React Native application demonstrating how to integrate and use the Passgage Access SDK.

## Features Demonstrated

- **Authentication**: Login and logout with JWT token management
- **QR Code Scanner**: Validate QR codes for access control
- **NFC Scanner**: Validate NFC cards for access control
- **Location-Based Check-In**: Check in/out at nearby branches
- **Remote Work Logging**: Log remote work entry and exit times

## Prerequisites

- Node.js 16 or higher
- npm or yarn
- React Native development environment set up
  - For iOS: Xcode 13+, CocoaPods
  - For Android: Android Studio, JDK 11+

## Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd passgage-sdk-example-react-native
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Install iOS pods (iOS only):
```bash
cd ios
pod install
cd ..
```

## Configuration

1. Update the API base URL in `App.tsx`:
```typescript
const API_BASE_URL = 'https://your-api-url.com';
```

2. Configure your Passgage SDK credentials (obtain from Passgage dashboard)

## Running the App

### iOS
```bash
npm run ios
# or
yarn ios
```

### Android
```bash
npm run android
# or
yarn android
```

## Project Structure

```
passgage-sdk-example-react-native/
├── src/
│   └── screens/
│       ├── LoginScreen.tsx        # Authentication screen
│       ├── HomeScreen.tsx         # Main menu
│       ├── QRScannerScreen.tsx    # QR code validation
│       ├── NFCScannerScreen.tsx   # NFC card validation
│       ├── CheckInScreen.tsx      # Location-based check-in
│       └── RemoteWorkScreen.tsx   # Remote work logging
├── App.tsx                        # Main app component
├── index.js                       # App entry point
└── package.json                   # Dependencies
```

## SDK Integration

### 1. Provider Setup

Wrap your app with `PassgageAccessProvider`:

```typescript
import {PassgageAccessProvider} from '@passgage-sdk/react-native';

function App() {
  return (
    <PassgageAccessProvider
      baseURL="https://your-api-url.com"
      onUnauthorized={() => {
        // Handle session expiration
      }}>
      <YourAppContent />
    </PassgageAccessProvider>
  );
}
```

### 2. Authentication

```typescript
import {usePassgageAuth} from '@passgage-sdk/react-native';

function LoginScreen() {
  const {login, logout, user, isLoading} = usePassgageAuth();

  const handleLogin = async () => {
    const result = await login({
      username: 'user@example.com',
      password: 'password',
    });

    if (result.success) {
      console.log('Logged in:', result.data.user);
    }
  };
}
```

### 3. QR Code Scanning

```typescript
import {usePassgageQRScanner} from '@passgage-sdk/react-native';

function QRScannerScreen() {
  const {validateQR, isLoading} = usePassgageQRScanner();

  const handleScan = async (qrCode: string) => {
    const result = await validateQR({
      qrCode,
      device: {
        id: 'device-id',
        name: 'Device Name',
      },
    });

    if (result.success) {
      console.log('Access granted:', result.data);
    }
  };
}
```

### 4. NFC Validation

```typescript
import {usePassgageNFCScanner} from '@passgage-sdk/react-native';

function NFCScannerScreen() {
  const {validateNFC, isLoading} = usePassgageNFCScanner();

  const handleNFC = async (nfcCode: string) => {
    const result = await validateNFC({
      nfcCode,
      device: {
        id: 'device-id',
        name: 'Device Name',
      },
    });
  };
}
```

### 5. Location-Based Check-In

```typescript
import {usePassgageCheckIn} from '@passgage-sdk/react-native';

function CheckInScreen() {
  const {getNearbyBranches, checkInEntry, checkInExit} = usePassgageCheckIn();

  const loadBranches = async () => {
    const result = await getNearbyBranches({
      radius: 5000, // 5km
    });

    if (result.success) {
      console.log('Nearby branches:', result.data);
    }
  };

  const handleCheckIn = async (branchId: string) => {
    const result = await checkInEntry({
      branchId,
      userId: user.id,
    });
  };
}
```

### 6. Remote Work Logging

```typescript
import {usePassgageRemoteWork} from '@passgage-sdk/react-native';

function RemoteWorkScreen() {
  const {logEntry, logExit, isLoading} = usePassgageRemoteWork();

  const startWork = async () => {
    const result = await logEntry({
      userId: user.id,
      description: 'Working from home',
    });
  };

  const endWork = async () => {
    const result = await logExit({
      userId: user.id,
      description: 'Finished work',
    });
  };
}
```

## Available Hooks

- `usePassgageAuth()` - Authentication management
- `usePassgageQRScanner()` - QR code validation
- `usePassgageNFCScanner()` - NFC card validation
- `usePassgageCheckIn()` - Location-based check-in
- `usePassgageRemoteWork()` - Remote work logging

## API Response Format

All SDK methods return a standardized response:

```typescript
{
  success: boolean;
  data?: any;
  error?: string;
}
```

## Error Handling

```typescript
const result = await login(credentials);

if (result.success) {
  // Handle success
  console.log(result.data);
} else {
  // Handle error
  console.error(result.error);
}
```

## Troubleshooting

### Common Issues

1. **Module not found**: Ensure all dependencies are installed
```bash
npm install
cd ios && pod install
```

2. **Metro bundler issues**: Clear cache
```bash
npm start -- --reset-cache
```

3. **Build errors on iOS**: Clean build folder
```bash
cd ios
xcodebuild clean
```

4. **Build errors on Android**: Clean gradle
```bash
cd android
./gradlew clean
```

## Documentation

For complete SDK documentation, visit: [Passgage SDK Documentation](https://docs.passgage.com)

## Support

For issues and questions:
- GitHub Issues: [Report an issue](https://github.com/passgage/sdk-issues)
- Email: support@passgage.com

## License

This example app is provided for demonstration purposes.
