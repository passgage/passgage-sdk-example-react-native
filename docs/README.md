# Passgage SDK Documentation

Developer documentation for `@passgage/sdk-react-native` 1.0.21, the Passgage Access SDK for React Native. The example app in this repository uses it.

The package README on npm is the short reference: [@passgage/sdk-react-native](https://www.npmjs.com/package/@passgage/sdk-react-native). These pages go into more detail.

## What the SDK does

- **Sign-in.** Signs the user in to the Passgage API, with an Azure AD `id_token` or with email/phone and password. It stores the session in the device Keychain/Keystore, restores it at the next start, and renews it.
- **QR entrance.** Takes a code that your app read (the SDK does not open the camera) and records an entrance for the matching Passgage device. For an IoT device it opens the door first.
- **NFC entrance.** Reads an NFC tag and runs the same flow.
- **Checks before an entrance.** The code must belong to a device the user may use, the same code is refused for 30 seconds after a successful read, and when the device requires it, the user must be within the device's range (checked on the phone with a location read at scan time).

## Pages

### Start here

- [Getting Started](./getting-started.md): installation, native setup, the provider and its props, a minimal app, and what happens at startup

### Sign-in and session

- [Authentication](./authentication.md): Azure AD and email/phone sign-in with full login screens, `onUnauthorized`, logout, failed logins, and the one-session-per-user rule
- [Token Management](./token-management.md): what is stored where, the 60-day token, renewal, 401 handling, and when the session ends

### Features

- [QR Scanner](./features/qr-scanner.md): `usePassgageQRScanner`
- [NFC Scanner](./features/nfc-scanner.md): `usePassgageNFCScanner`

### Reference and help

- [Error Handling](./error-handling.md): error codes and how to handle them
- [FAQ](./faq.md)
- [Troubleshooting](./troubleshooting.md)

## Public API at a glance

| Export | Kind | Purpose |
|--------|------|---------|
| `PassgageAccessProvider` | Component | Configures the SDK and starts the session |
| `useAuthStore` | Zustand hook | Sign-in state and `login`, `loginWithAzure`, `logout` |
| `usePassgageQRScanner` | Hook | Validates a QR code and records the entrance |
| `usePassgageNFCScanner` | Hook | Reads an NFC tag and records the entrance |
| `useLocation` | Hook | Reads the location for your own screens (not used by the range check) |
| `qrScannerStore` | Zustand store | The devices and codes the user may use |
| `locationStore` | Zustand store | The location used by the range check |
| `AuthService`, `DeviceAccessService`, `QRAccessService`, `NfcAccessService` | Objects | Low-level calls that use the provider's session |

## Requirements

- React Native >=0.70 and React >=18
- Peer dependencies: `react-native-geolocation-service`, `react-native-permissions`, `react-native-keychain`, `react-native-nfc-manager` (see [Getting Started](./getting-started.md#peer-dependencies))
- A Passgage API base URL

## Support

For support, contact devops@passgage.com.
