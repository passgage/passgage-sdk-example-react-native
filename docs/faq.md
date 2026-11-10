# FAQ

Answers for `@passgage/sdk-react-native` 1.0.21.

## Scanning

### Why does the user get "You are not within the allowed range of this device" at the door?

That is `LOCATION_OUT_OF_RANGE`. The SDK compared the phone's location with the device's coordinates and the distance was larger than the device's range.

- The range is a device setting in Passgage, in meters, and is separate for QR reads (`range_matter` / `range`) and NFC reads (`nfc_range_matter` / `nfc_range`). The check runs only when the matching `..._range_matter` is `'1'` and the device has a latitude and longitude.
- When the range value is missing or not a positive number, 100 meters is used.
- The location is read when the code is scanned. A location of at most 15 seconds ago is reused; otherwise the scan waits up to 10 seconds for a new one, and failing that accepts one of at most 5 minutes ago.
- The accuracy of the GPS fix is not taken into account. Indoors a fix can be off by more than a small range.
- `error.details` says how far away the phone was, for example `Distance: 240m`. Compare that with the device's range and coordinates.

If the coordinates or the range of the device are wrong, fix them in Passgage. Before 1.0.21 the SDK used the location from when the app started, which often caused this message; update if you are on an older version.

When there is no location at all, 1.0.21 reports `LOCATION_UNAVAILABLE` or `LOCATION_PERMISSION_DENIED`, not "out of range".

### Does the API check the location too?

No. The API does not check the location, so the SDK does it on the phone before it sends the read. `skipLocationCheck: true` turns it off.

### Does the SDK read the camera?

No. There is no camera component in the SDK. Read the code with any scanner (for example react-native-vision-camera's `useCodeScanner`) and pass the text to `scan(code)`. See [qr-scanner.md](./features/qr-scanner.md#wiring-a-camera).

### The camera reports the same code many times. Will that create several entrances?

No. While one scan is running, further `scan` calls are ignored. After a successful read, the same code is refused for 30 seconds with `REPETITIVE_READ`. Stop the camera, or ignore its codes, once `onSuccess` has fired.

### Can the user scan offline?

No. The device lists come from the API, and every entrance is a request to the API (and an IoT door is opened by the API). Without network a scan fails with `NETWORK_ERROR`, or with `DEVICE_NOT_FOUND` if the device lists were never loaded. The SDK does not queue reads for later.

### Why "QR Device not found"?

That is `DEVICE_NOT_FOUND`: no device in the user's list has this `qr_code_id` (for NFC: `nfc_code`). Common causes:

- The code belongs to a device the user may not use, or to another company. The device list contains only the devices the user may use.
- No session yet: the scan ran before sign-in or before the stored session was restored.
- The lists could not be loaded (no network at start). Since 1.0.21 an unknown code reloads the lists when they are older than 30 seconds, so the next scan with network works. Before 1.0.21 the app had to be restarted.
- A device added in Passgage a moment ago: the lists are refreshed when a code is unknown, and in the background when they are older than 10 minutes.

`qrScannerStore.getState().error` holds the message of a failed load.

### What does `REPETITIVE_READ` protect against, and can I turn it off?

It stops the same code from being recorded twice within 30 seconds, for example by a camera that keeps seeing the code. Only successful reads count, and the record lives in memory: it is cleared by `logout()` and by an app restart. `skipRepetitiveCheck: true` turns the check off.

### Does `skipLocationCheck` stop the location permission prompt?

No. It only skips the range check. The provider checks and, if needed, requests the location permission when it mounts.

### Does the SDK decide whether a read is an entry or an exit?

The SDK sends `device_id` and `read_method` (`qr` or `nfc`) to `entrances/create_from_qr`, nothing else. `QrDevice.direction` (`check_in`, `check_out`, `bidirectional`) shows how the device is set up, and the returned `Entrance` has `entrance_type`.

### Can I use my own location for the range check?

No. The range check uses the SDK's `locationStore`. `useLocation()` is a separate helper for your own screens and does not feed the check.

### Can I run the checks without the hooks?

For NFC, `NfcAccessService.validateNFC({nfcCode, device})` runs the same flow as the NFC hook. `QRAccessService.createEntranceFromQR` and `QRAccessService.triggerIoTDevice` only make the API calls: they skip the access, repeated-read and range checks. For QR, use the hook.

## NFC

### What format does an NFC card code have?

The NFC library gives the tag id as hex (for example `04A1B2C3`). The SDK reverses the byte order and converts it to decimal (`C3B2A104` → `3283263748`) with `reversedHexToDec`. That decimal string is matched against the device's `nfc_code`. `nfcData` on the hook holds the raw tag id, not the converted code. See [nfc-scanner.md](./features/nfc-scanner.md#tag-id-and-device-code).

### Do I have to call `NfcManager.start()`?

Yes, once, in an effect, before the first read. The hook does not call it.

### How do I read several cards in a row?

`startScanning()` reads one tag. Call it again for the next one, after `isScanning` has turned `false`.

## Sessions

### How long does a user stay signed in?

An access token is valid for 60 days and cannot be renewed after it has expired. When the app starts, the SDK renews a stored session that is older than 30 days. So a user who opens the app at least once in 60 days stays signed in. After 60 days without the app, the user signs in again. Details in [token-management.md](./token-management.md).

With `login({login, password, rememberUser: false})` the session is kept in memory only and is gone after a restart.

### What happens when the user also uses the Passgage app?

An account has one active mobile session at a time. Signing in through the SDK ends that user's session in the other app (for example the Passgage app), and the other way round. The SDK recovers on its next request by refreshing its token.

### Why is `onUnauthorized` called when my app starts?

Without `msalToken`, it is called when there is no stored session: first launch, after `logout()`, with `rememberUser={false}`, or when the stored session could not be renewed. Show your login screen. With `msalToken`, it is called when the Azure login fails. See [error-handling.md](./error-handling.md#onunauthorized).

### Where is the session stored?

In the Keychain (iOS) / Keystore (Android) through `react-native-keychain`, readable while the device is unlocked.

## TypeScript

### What changed in the types in 1.0.21?

The types now follow what the API sends:

- `QrDevice.name`, `description`, `company_id`, `branch_id`, `is_active`, `created_at` and `updated_at` are optional and marked deprecated: `devices/qr_devices` does not send them. Do not rely on `device.name` for display.
- `QrDevice.range` and `nfc_range` are `number | string | null` (the API sends strings such as `"30"`).
- `QrDevice.qr_code_id` is optional and, like `nfc_code`, `latitude`, `longitude`, `range_matter` and `nfc_range_matter`, can be `null` (a device without a QR code has no `qr_code_id`).
- `QrDevice.direction` (`'check_in' | 'check_out' | 'bidirectional'`) is new.
- `FlowResponseType.error` has a new optional `status`.
- `TokenInfo.expiresIn` is optional and deprecated; the API sends `expires_in`, which is now on the type.
- `LoginCredentials.rememberUser` is new (`false` keeps the session in memory only).
- `QRAccessService.triggerIoTDevice` returns `BaseResponse`: its answer carries no entrance.
- `AuthService.refreshToken(refreshToken, accessToken?)` takes the current access token as an optional second argument.
- `LoginResult` and `RefreshTokenResult` failures carry `status`.
- `PassgageAccessProvider`'s `msalToken` is optional.

If your code read one of the now-optional fields, add a fallback, for example `device.name ?? device.id`.

### Which values can `error.code` have?

See the table in [error-handling.md](./error-handling.md#every-scan-error-code). The API can also send its own codes, which arrive upper-cased, so keep a `default` branch.

## Other

### Where is the full setup?

[getting-started.md](./getting-started.md) for installation and the provider, [authentication.md](./authentication.md) for sign-in.

### Where do I get help?

Check [troubleshooting.md](./troubleshooting.md) first. For support, contact devops@passgage.com.
