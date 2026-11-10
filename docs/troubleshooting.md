# Troubleshooting

Symptom, cause and fix for problems seen when integrating `@passgage/sdk-react-native` 1.0.21. Error codes are explained in [error-handling.md](./error-handling.md).

When you report a problem, include the SDK version (`SDK_VERSION` is exported), the platform, and the `error.code`, `error.status`, `error.details` and `message` of the failure.

## Contents

- [Installation](#installation)
- [Location](#location)
- [QR scans](#qr-scans)
- [NFC](#nfc)
- [Sign-in and session](#sign-in-and-session)
- [API refusals](#api-refusals)

## Installation

### "Native module ... not found" / "... is null" at start

**Cause.** The SDK imports four native modules as peer dependencies. React Native only links native modules that are direct dependencies of the app, so they are missing when only the SDK is installed.

**Fix.** Install them in the app, then rebuild:

```bash
npm install react-native-geolocation-service react-native-permissions react-native-keychain react-native-nfc-manager
cd ios && pod install && cd ..
```

| Package | Version |
|---------|---------|
| `react-native-geolocation-service` | ^5.3.1 |
| `react-native-permissions` | ^5.4.4 |
| `react-native-keychain` | >=8.0.0 |
| `react-native-nfc-manager` | ^3.14.0 |

Then follow the native setup of each library. A Metro reload is not enough after adding native modules; rebuild the app.

## Location

### iOS never asks for the location permission

**Cause.** `react-native-permissions` reports a permission as unavailable unless it is enabled in the `Podfile`. The provider then tries to read the location without asking, the user is never prompted, and scans at devices with a range fail with `LOCATION_PERMISSION_DENIED` or `LOCATION_UNAVAILABLE`.

**Fix.** In `ios/Podfile`:

```ruby
setup_permissions(['LocationWhenInUse'])
```

Add `NSLocationWhenInUseUsageDescription` to `Info.plist`, run `pod install`, and rebuild. On Android, add `ACCESS_FINE_LOCATION` to the manifest.

### `LOCATION_PERMISSION_DENIED` although the app has asked

**Cause.** The user refused the permission. The provider asks only when the permission has not been decided yet. Once it is blocked, the system does not show the prompt again.

**Fix.** Ask the user to allow location access for the app in the system settings. `getLocationErrorCallback` receives an error with `code === 1` in this case, which you can use to show a hint. If the device does not need a range check, the company can turn the range off for it in Passgage.

### `LOCATION_UNAVAILABLE`, mostly indoors

**Cause.** The device has a range, and no usable location could be read. The scan waits up to 10 seconds for a new location (a location of at most 15 seconds ago is reused at once). If none arrives, a location of at most 5 minutes ago is accepted. Without one, the scan fails. GPS often has no fix inside buildings.

**Fix.**

- Make sure location services are on for the phone and the app.
- Mount the scanner screen before the user reaches the door. The scanner hooks start reading the location when they mount, so a location is usually ready by the time of the scan.
- Let the user try again; a later attempt may get a fix.
- If the device is indoors and the range check is not needed, ask for the range to be turned off for that device in Passgage.

### `LOCATION_OUT_OF_RANGE` while standing at the door

**Cause.** The distance between the phone's location and the device's coordinates is larger than the device's range (QR: `range`, NFC: `nfc_range`; 100 meters when unset). GPS accuracy is not taken into account.

**Fix.** Check `error.details` (for example `Distance: 240m`) against the device's coordinates and range in Passgage. A wrong coordinate or a very small range is the usual cause. On SDK versions before 1.0.21 the location from app start was used for every scan: update.

## QR scans

### `DEVICE_NOT_FOUND` ("QR Device not found") after the app started without network

**Cause.** The device lists are loaded after sign-in or session restore. Without network that load fails, and the lists stay empty.

**Fix.** 1.0.21 loads the lists again when an unknown code is scanned (if the lists are older than 30 seconds), so the next scan with network works. Before 1.0.21 the app had to be restarted; update. If it still fails:

- Check the network.
- Check that there is a session: `useAuthStore.getState().authStatus` is `true`. Without a session the lists are not reloaded.
- Read `qrScannerStore.getState().error`: it holds the message of the failed load.
- Check that the user may use the device. The list only contains devices the user may use.

### `DEVICE_NOT_FOUND` right after launch, with network

**Cause.** The scan ran before the stored session was restored or before sign-in finished.

**Fix.** Wait until `useAuthStore().initialized` is `true` and `authStatus` is `true` before showing the scanner.

### Several requests, or the door opens twice, for one QR code

**Cause.** SDK versions before 1.0.21 sent a request for every `scan` call, and a camera reports a code on every frame.

**Fix.** Update to 1.0.21: one scan runs at a time, and calls during a scan are ignored. Stop the camera, or ignore its codes, after `onSuccess`.

### `REPETITIVE_READ` on the second attempt

**Cause.** The same code was read successfully less than 30 seconds ago. This is intended.

**Fix.** Wait 30 seconds, or pass `skipRepetitiveCheck: true` if your use case needs repeated reads. A failed read does not block the next one.

## NFC

### `startScanning` never finishes, or `isScanning` stays `true`

**Cause.** SDK versions before 1.0.21: `isScanning` stayed `true` after the read, a cancelled scan rejected `startScanning`, and with NFC turned off on Android the scan waited forever.

**Fix.** Update to 1.0.21. `startScanning` now resolves when the read is over (also after a failure or a cancel), and `isScanning` turns `false` once the reader is released.

### `NFC_DISABLED`

**Cause.** NFC is turned off on an Android phone. The hook checks this before it waits for a tag.

**Fix.** Ask the user to turn NFC on in the system settings, then call `startScanning()` again.

### Nothing happens when the card is held to the phone

**Fix.** Check, in order:

- `NfcManager.start()` is called once, in an effect, before `startScanning`.
- `supportNFC` is `true`. It is `undefined` until the check on mount has finished.
- `startScanning()` was called and `isScanning` is `true`. Each call reads one tag; call it again for the next card.
- The native setup of `react-native-nfc-manager` is complete for the platform.

### `DEVICE_NOT_FOUND` for an NFC card

**Cause.** The decimal code built from the tag id matches no device's `nfc_code` in the user's list.

**Fix.** Convert the raw id with `reversedHexToDec(nfcData)` and compare it with the `nfc_code` of the device in Passgage. If the card is right, the user may not have access to the device, or the lists are not loaded (see the QR section above).

### `NFC_TAG_UNREADABLE`

**Cause.** The library returned a tag without an id.

**Fix.** Hold the card still against the phone and call `startScanning()` again.

### NFC read rejected as "not within the allowed range" although QR works

**Cause.** Since 1.0.21 an NFC read is checked against the device's NFC range (`nfc_range_matter` / `nfc_range`), not the QR range. The two settings can differ.

**Fix.** Check the NFC range of the device in Passgage.

## Sign-in and session

### Login shows "Request failed with status code 422"

**Cause.** SDK versions before 1.0.21 passed on the HTTP client's text for a refused login.

**Fix.** Update to 1.0.21. `reject(message)` and `useAuthStore().error` now carry the API's message, for example for a wrong password. A login that fails on the network shows the HTTP client's message and keeps the session that was active before.

### `onUnauthorized` is called at every start

**Cause and fix.**

- **First launch or after `logout()`:** there is no stored session. Expected: show your login.
- **`rememberUser={false}`:** the provider signs out on every start by design. Leave it at the default `true` to restore the session.
- **With `msalToken`:** the Azure login on mount failed; `error.message` starts with `Azure login failed:`. Check the token.
- **SDK before 1.0.21 without `msalToken`:** the session was wiped on every mount. Update.

Use `useAuthStore().initialized` to show a splash screen until it is known whether there is a session, so the login screen does not flash.

### Users must sign in again after a while

**Cause.** An access token is valid for 60 days and cannot be renewed once it has expired. The SDK renews a stored session older than 30 days when the app starts. A user who does not open the app for 60 days must sign in again. On versions before 1.0.21 every user was sent back to the login on day 60.

**Fix.** Update to 1.0.21. After that, sign-in after 60 days without the app is expected. See [token-management.md](./token-management.md).

### Session lost after using the Passgage app

**Cause.** An account has one active mobile session at a time. Signing in through the Passgage app ends the SDK's session, and the other way round.

**Fix.** Nothing to change in the app: the SDK refreshes its token on the next request. If the refresh is refused, `onUnauthorized` is called with `Session expired. Login is required`.

### The session is gone after an app restart

**Cause.** The login used `rememberUser: false`, or the provider has `rememberUser={false}`.

**Fix.** Leave `rememberUser` at its default `true` in both places if the session should survive a restart.

### On iOS the app opens to the login screen after starting in the background

**Cause.** The Keychain cannot be read while the device is locked. Before 1.0.21 this was treated as "no session".

**Fix.** Update to 1.0.21. The provider now waits until the app is in the foreground and looks again.

## API refusals

### Scans fail with `APP_UPDATE_REQUIRED` or `UNTRUSTED_DEVICE` (HTTP 422)

**Cause.** The user's company enforces device integrity. The SDK does not send an integrity report, so the API refuses reads while that company setting is on.

**Fix.** Nothing in the app can fix this. The company's Passgage administrator has to change the setting; contact Passgage if your users need SDK access under it.

### Scans fail with `PHONE_MATCHING_REQUIRED` (HTTP 403)

**Cause.** The company requires a matched phone for the user.

**Fix.** A company setting, not an app problem. The user should contact their administrator.

### Scans fail with `ACCESS_DENIED` (HTTP 403)

**Cause.** The API refused the user for this device, although the SDK's own checks passed.

**Fix.** Check the user's permissions for the device in Passgage.

### Scans fail with `NETWORK_ERROR`

**Cause.** The request got no answer: no network, or the request timed out (the provider's `timeout`, 30000 ms by default).

**Fix.** Check the network and the provider's `baseURL`. The SDK does not retry or queue the read; the user scans again.

## Still stuck

See [faq.md](./faq.md), or contact devops@passgage.com with the details listed at the top of this page.
