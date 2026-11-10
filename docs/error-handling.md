# Error Handling

This page lists every error the SDK (`@passgage/sdk-react-native` 1.0.21) reports and where each one comes from. There are four channels:

| Channel | What arrives there |
|---------|--------------------|
| `onError` of `usePassgageQRScanner` / `usePassgageNFCScanner`, and the hook's `error` | Failed scans, as `FlowResponseType` with an `error.code` |
| `reject` callback of `login` / `loginWithAzure`, and `useAuthStore().error` | Failed sign-ins, as a message string |
| `onUnauthorized` prop of `PassgageAccessProvider` | No session, or a session that ended |
| `getLocationErrorCallback` / `locationPermissionErrorCallback` props | Location problems |

The SDK does not throw from these flows. Scans and logins report through callbacks and state.

## Scan errors

### The shape

```typescript
interface FlowResponseType {
  success: boolean; // false for a failure
  message: string;
  error?: {
    code: string;
    details?: string; // LOCATION_OUT_OF_RANGE: 'Distance: 240m'
    status?: number; // HTTP status, when the API answered with an error
  };
}
```

`message` is the text the API sent when there is one, otherwise a fixed English text from the SDK. `status` is set only when the API answered with an HTTP error.

### Branch on the code, not the message

Messages can come from the API, so their wording and language can change. Codes do not. Show your own text per code, and fall back to `message` for codes you do not handle:

```typescript
import {FlowResponseType} from '@passgage/sdk-react-native';

export function scanErrorText(failure?: FlowResponseType): string {
  switch (failure?.error?.code) {
    case 'LOCATION_OUT_OF_RANGE':
      return 'You are too far from this door.';
    case 'LOCATION_PERMISSION_DENIED':
      return 'Allow location access to use this door.';
    case 'REPETITIVE_READ':
      return 'This code was just used. Wait a moment.';
    case 'NETWORK_ERROR':
      return 'No connection. Try again.';
    default:
      return failure?.message ?? 'Something went wrong.';
  }
}
```

The QR hook types its callback as `onError?: (error?: FlowResponseType) => void`, so use `failure?.error?.code` there. The NFC hook passes a value that is always set: `(error: FlowResponseType) => void`.

### Every scan error code

Steps refer to the entrance flow described in [qr-scanner.md](./features/qr-scanner.md#what-happens-on-a-scan): 1 format, 2 access list, 3 repeated read, 4 range check, 5 IoT trigger and entrance request.

| Code | Where it comes from | HTTP | SDK message (when the API sent none) | Suggested user message |
|------|---------------------|------|--------------------------------------|------------------------|
| `DEVICE_NOT_FOUND` | The scanned code matches no device in `qrDevices`, even after a reload (before step 1). Also an API answer 404 in step 5 | 404 when from the API | `QR Device not found` / `NFC device not found` | "This code is not linked to a door you can use." |
| `INVALID_QR_FORMAT` | Step 1: the code is empty. In practice only when you pass a `device` to `scan` with an empty code, or call `NfcAccessService.validateNFC` with an empty `nfcCode` | – | `Invalid QR code format` | "The code could not be read." |
| `QR_ACCESS_DENIED` | Step 2: the code is not in `qrAccessDevices` | – | `You do not have permission. Please contact your administrator` | "You do not have access to this door." |
| `REPETITIVE_READ` | Step 3: the same code was read successfully in the last 30 seconds | – | `QR code was recently scanned. Please wait before scanning again.` (NFC: `NFC code ...`) | "Already recorded. Wait a moment before trying again." |
| `LOCATION_PERMISSION_DENIED` | Step 4: the device has a range and the location permission is missing | – | `Location permission is required to use this device` | "Allow location access in Settings." |
| `LOCATION_UNAVAILABLE` | Step 4: the device has a range and no usable location could be read | – | `Your location could not be determined. Please try again` | "Your location could not be found. Try again, ideally near a window or outdoors." |
| `LOCATION_OUT_OF_RANGE` | Step 4: the user is outside the range. `details` gives the distance in meters | – | `You are not within the allowed range of this device` | "You are too far from this door." |
| `IOT_TRIGGER_FAILED` | Step 5: the API answered the IoT trigger without success. (If the trigger request fails with an HTTP error, you get one of the HTTP codes below instead) | – | `Trigger IOT validation failed` | "The door did not open. Try again." |
| `REQUEST_REJECTED` | Step 5: the API answered the entrance request without success, or answered with a 4xx not listed in this table | e.g. 400, 409, 422 | `QR code validation failed` / `Enterance validation failed` | Show `message` |
| `NETWORK_ERROR` | Step 5: the request got no answer (offline, timeout) | – | the HTTP client's message | "No connection. Try again." |
| `UNAUTHORIZED` | Step 5: 401, and refreshing the session did not help | 401 | API text | "Your session has ended. Sign in again." |
| `ACCESS_DENIED` | Step 5: the API refused the user for this device | 403 | API text | "You do not have access to this door." |
| `PHONE_MATCHING_REQUIRED` | Step 5: the company requires a matched phone | 403 | API text | "This phone must be matched to your account. Contact your administrator." |
| `APP_UPDATE_REQUIRED`, `UNTRUSTED_DEVICE` | Step 5: the company enforces device integrity | 422 | API text | "Entrances are blocked by a company setting. Contact your administrator." |
| `RATE_LIMITED` | Step 5: too many requests | 429 | API text | "Too many attempts. Wait a little." |
| `SERVER_ERROR` | Step 5: server error | 5xx | API text | "Passgage is not available. Try again later." |
| `QR_SCAN_FAILED` | QR hook: an unexpected error during the scan | – | the error's message, or `Qr scan failed` | "Something went wrong. Try again." |
| `NFC_SCAN_FAILED` | NFC hook: an unexpected error during the read (not a user cancel) | – | the error's message, or `NFC scanning failed` | "The card could not be read. Try again." |
| `NFC_DISABLED` | NFC hook, Android: NFC is turned off. Checked before waiting for a tag | – | `NFC is turned off` | "Turn on NFC in Settings." |
| `NFC_TAG_UNREADABLE` | NFC hook: the tag has no id | – | `NFC tag could not be read` | "The card could not be read. Hold it still and try again." |

### How an HTTP error becomes a code

For a failed request in step 5 the SDK picks the code in this order:

1. No HTTP answer at all: `NETWORK_ERROR` (no `status`).
2. The error body has a `code` string: that code in upper case, with `status`. This is how `app_update_required` becomes `APP_UPDATE_REQUIRED` and `untrusted_device` becomes `UNTRUSTED_DEVICE`. The API may send other codes this way, so always keep a `default` branch.
3. The body's `errors` list has an item with `field_name: 'phone_matching_required'`: `PHONE_MATCHING_REQUIRED`.
4. By status: 401 `UNAUTHORIZED`, 403 `ACCESS_DENIED`, 404 `DEVICE_NOT_FOUND`, 429 `RATE_LIMITED`, 500 and above `SERVER_ERROR`, anything else `REQUEST_REJECTED`.

A 401 is first answered by one token refresh and one retry of the request. `UNAUTHORIZED` reaches `onError` only when that did not help. If the API refused the refresh, the user is also logged out and `onUnauthorized` is called. See [token-management.md](./token-management.md).

### Company settings the SDK cannot satisfy

Three codes mean a setting of the user's company blocks the read. Retrying does not help, and there is nothing to fix in the app:

- `APP_UPDATE_REQUIRED` and `UNTRUSTED_DEVICE` (422): the company enforces device integrity. The SDK does not send an integrity report, so reads are refused while that company setting is on.
- `PHONE_MATCHING_REQUIRED` (403): the company requires the user's phone to be matched to the account.

Tell the user to contact their administrator, and raise it with Passgage if your users need SDK access under these settings.

### What to log

Log `error.code`, `error.status`, `error.details` and `message` together. That is enough to tell a range problem from a permission problem from an API refusal:

```typescript
onError: failure => {
  console.warn('[passgage] scan failed', {
    code: failure?.error?.code,
    status: failure?.error?.status,
    details: failure?.error?.details,
    message: failure?.message,
  });
},
```

## Sign-in errors

`login` and `loginWithAzure` on `useAuthStore` report a failure in two places:

- the `reject(message)` callback, the third argument;
- `useAuthStore().error`, a `string | null`. It is reset when the next login starts; `clearError()` resets it by hand.

```typescript
import {useAuthStore} from '@passgage/sdk-react-native';

const {login, loading, error, clearError} = useAuthStore();

login(
  {login: email, password},
  user => console.log('Signed in', user?.fullName),
  message => Alert.alert('Sign-in failed', message),
);
```

What `message` contains:

| Situation | Message |
|-----------|---------|
| The API refused the credentials or the Azure token (wrong password, unknown user, invalid `id_token`) | The text the API sent |
| The API answered without tokens and without a text | `Login failed` / `Azure login failed` |
| No answer (offline, timeout) | The HTTP client's error message, or `An error occurred during login` / `An error occurred during Azure login` |

Before 1.0.21 a wrong password showed `Request failed with status code 422`. It now shows the API's message.

The store hands over text only. The underlying `AuthService.login` / `AuthService.loginWithAzure` results also carry a `code` (`LOGIN_FAILED`, `AZURE_LOGIN_FAILED`, or a network code) and `status`. Calling those services directly does not start a session in the store, though, so sign in through `useAuthStore`.

A refused login (wrong password) also signs out the session that was active before it. A login that fails on the network keeps that session.

More in [authentication.md](./authentication.md).

## `onUnauthorized`

`PassgageAccessProvider` calls `onUnauthorized(error)` when the app has to show its login. `error.message` says why:

| `error.message` | When |
|-----------------|------|
| `No active session. Login is required` | No `msalToken`, and no stored session (first launch, after `logout()`, or a stored session the API refused to renew). Also on every start with `rememberUser={false}` |
| `Session expired. Login is required` | A 401 could not be fixed by a refresh because the API refused it. The user has been logged out. Called once per ended session |
| `Azure login failed: <reason>` | The provider was given `msalToken` and the Azure login on mount failed |

It is not called when the Keychain cannot be read because the phone is locked (iOS). The provider then waits until the app is in the foreground and looks again.

Use `useAuthStore().initialized` to avoid flashing the login screen: it is `false` until it is known whether there is a session.

## Location errors

The provider reports location problems through two props:

| Prop | Called when |
|------|-------------|
| `getLocationErrorCallback(error)` | Reading the location failed: on mount, when a scanner screen starts reading the location, and when a scan reads it. `error` is the error object of `react-native-geolocation-service`. `error.code === 1` means the permission is missing; the other codes are defined by that library |
| `locationPermissionErrorCallback(error)` | The state of the location permission could not be checked |

```tsx
<PassgageAccessProvider
  baseURL="https://your-api.passgage.com"
  getLocationErrorCallback={error => {
    if (error?.code === 1) {
      // Show a hint that location access is off
    }
  }}
  locationPermissionErrorCallback={error => {
    console.warn('Location permission check failed', error);
  }}>
  <App />
</PassgageAccessProvider>
```

These callbacks are informational. A scan that needs the location reports its own code (`LOCATION_PERMISSION_DENIED` or `LOCATION_UNAVAILABLE`) through `onError`, so you do not have to connect the two.

## Device list errors

When loading the device lists fails, `qrScannerStore.getState().error` holds the message. Scans then fail with `DEVICE_NOT_FOUND` until a reload succeeds. The SDK reloads the lists on its own when an unknown code is scanned, and `fetchQrDevicesAndAccess()` reloads them on request. See [qr-scanner.md](./features/qr-scanner.md#device-lookup-and-list-reloads).

## See also

- [troubleshooting.md](./troubleshooting.md): symptoms and fixes
- [faq.md](./faq.md)
