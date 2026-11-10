# Passgage SDK Example App

A React Native app that shows how to integrate [`@passgage/sdk-react-native`](https://www.npmjs.com/package/@passgage/sdk-react-native): sign-in, and QR / NFC entrance check-in with range validation.

| Screen | What it shows | File |
|--------|---------------|------|
| Login | Email/phone + password with `login`, and Azure AD with `loginWithAzure` | `src/screens/LoginScreen.tsx` |
| Home | The signed-in user, logout | `src/screens/HomeScreen.tsx` |
| QR Scanner | Validating a QR code typed in by hand | `src/screens/QRScannerScreen.tsx` |
| QR Scanner Camera | Validating codes from the camera (react-native-vision-camera) | `src/screens/QRScannerCameraScreen.tsx` |
| NFC Scanner | Reading an NFC card | `src/screens/NFCScannerScreen.tsx` |

`App.tsx` mounts `PassgageAccessProvider` and switches between the login screen and the app screens on `authStatus`, once the stored session has been looked up (`initialized`).

## Documentation

- [Getting started](./docs/getting-started.md)
- [Authentication](./docs/authentication.md) and [session and tokens](./docs/token-management.md)
- [QR scanner](./docs/features/qr-scanner.md) and [NFC scanner](./docs/features/nfc-scanner.md)
- [Error handling](./docs/error-handling.md)
- [FAQ](./docs/faq.md) and [troubleshooting](./docs/troubleshooting.md)

The package README is the reference for the API: <https://www.npmjs.com/package/@passgage/sdk-react-native>.

## Running the app

Requirements: the [React Native environment](https://reactnative.dev/docs/set-up-your-environment), a Passgage account, and a real device for NFC and location.

```sh
npm install
cd ios && bundle install && bundle exec pod install && cd ..

npm run ios
# or
npm run android
```

### Configuration

- **API URL:** `API_BASE_URL` in `App.tsx`.
- **Email/phone + password:** works with any Passgage user of that environment.
- **Azure AD:** `LoginScreen.tsx` signs in with `react-native-app-auth`. Replace the tenant id, client id and redirect URLs with the values of your Azure app registration; Passgage must have the same tenant and client id configured for your company. You can also pass the `id_token` to the provider as `msalToken` instead.

### Native setup this app already has

- iOS `Podfile`: `setup_permissions([... 'LocationWhenInUse', 'Camera' ...])`. Without it the location permission is never asked.
- iOS `Info.plist`: `NSLocationWhenInUseUsageDescription`, `NFCReaderUsageDescription`; NFC reader entitlement.
- Android manifest: `ACCESS_FINE_LOCATION`, `NFC`.

### Debugging

Shake the device to open the network logger and see the SDK's requests.
