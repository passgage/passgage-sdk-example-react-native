# QR Scanner

`usePassgageQRScanner` validates a QR code and, when every check passes, records an entrance (and opens the door for an IoT device). This page describes the hook as it works in `@passgage/sdk-react-native` 1.0.21.

The SDK does not read the camera. Your app reads the code with the scanner of its choice (for example [react-native-vision-camera](https://react-native-vision-camera.com/docs/guides)) and passes the text to `scan`.

Before you start, set up the provider and sign the user in: see [getting-started.md](../getting-started.md) and [authentication.md](../authentication.md). A scan made before there is a session fails with `DEVICE_NOT_FOUND`.

## Contents

- [The hook](#the-hook)
- [What happens on a scan](#what-happens-on-a-scan)
- [Device lookup and list reloads](#device-lookup-and-list-reloads)
- [One scan at a time](#one-scan-at-a-time)
- [Options](#options)
- [Wiring a camera](#wiring-a-camera)
- [Complete screen](#complete-screen)
- [Manual entry](#manual-entry)

## The hook

```typescript
import {usePassgageQRScanner} from '@passgage/sdk-react-native';

const {scan, isLoading, error} = usePassgageQRScanner({
  options: {skipLocationCheck: false, skipRepetitiveCheck: false},
  onSuccess: entrance => {
    console.log('Entrance recorded', entrance?.id);
  },
  onError: failure => {
    console.log(failure?.error?.code, failure?.message);
  },
});

await scan(qrCode);
```

### Arguments

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `options` | `{skipLocationCheck?: boolean; skipRepetitiveCheck?: boolean}` | Yes | Pass `{}` for the default behaviour (both checks on). See [Options](#options) |
| `onSuccess` | `(entrance?: Entrance) => void` | No | Called after the API recorded the entrance |
| `onError` | `(error?: FlowResponseType) => void` | No | Called for every failed scan |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `scan` | `(qrCode: string, device?: QrDevice) => Promise<void>` | Validates a code. Ignored while a scan is running |
| `isLoading` | `boolean` | `true` while a scan is running |
| `error` | `FlowResponseType \| null` | The last failed scan. Reset to `null` when a new scan starts, so it is `null` after a successful one |

`scan` does not throw. It resolves when the scan is over; the result arrives in `onSuccess` or `onError`.

A failure has this shape:

```typescript
interface FlowResponseType {
  success: boolean; // false
  message: string; // the API's text when it sent one, otherwise the SDK's
  error?: {
    code: string; // for example 'LOCATION_OUT_OF_RANGE'
    details?: string; // for example 'Distance: 240m'
    status?: number; // HTTP status, when the API answered with an error
  };
}
```

Branch on `error.code`, not on `message`. Every code is listed in [error-handling.md](../error-handling.md).

## What happens on a scan

`scan(qrCode)` first finds the device (see the next section). If no device has `qr_code_id === qrCode`, the scan stops with `DEVICE_NOT_FOUND`. Then the entrance flow runs, in this order. The first step that fails ends the scan.

| # | Step | Fails with |
|---|------|------------|
| 1 | **Format.** The code must be a non-empty string | `INVALID_QR_FORMAT` |
| 2 | **Access list.** The code must be in `qrAccessDevices`, the codes the user may use (from `qr_access/accessible_qrs`) | `QR_ACCESS_DENIED` |
| 3 | **Repeated read.** The same code must not have been read successfully in the last 30 seconds | `REPETITIVE_READ` |
| 4 | **Range check.** Only when the device has `range_matter === '1'` and a latitude and longitude. The location is read now, at scan time, and must be within `range` meters of the device | `LOCATION_PERMISSION_DENIED`, `LOCATION_UNAVAILABLE`, `LOCATION_OUT_OF_RANGE` |
| 5a | **IoT trigger.** Only when `device.is_iot` is `true`: `POST iot/trigger/:id` opens the door | `IOT_TRIGGER_FAILED`, or a code for the HTTP error |
| 5b | **Entrance.** `POST entrances/create_from_qr` with `{device_id, read_method: 'qr'}` | `REQUEST_REJECTED`, or a code for the HTTP error |

Notes on the steps:

- **Repeated read.** The record is kept in memory. Only a successful read is recorded, so a failed scan does not block the next attempt. The records are cleared by `logout()` and when the app restarts.
- **Location.** A location read at most 15 seconds ago is used as it is. Otherwise a new one is requested, and the scan waits for it up to 10 seconds. If no new location arrives, the last one is accepted when it is at most 5 minutes old. With no usable location the scan fails with `LOCATION_PERMISSION_DENIED` (permission missing) or `LOCATION_UNAVAILABLE`, not with "out of range".
- **Distance.** The distance is computed with the Haversine formula. The API sends `range` as a string (`"30"`). When it is missing, not a number, or not above zero, 100 meters is used. On `LOCATION_OUT_OF_RANGE`, `error.details` holds the distance, for example `Distance: 240m`.
- **The API does not check the location.** The range check runs on the phone, in the SDK.
- **IoT order.** For an IoT device the door is opened first and the entrance is recorded after it. If the trigger fails, no entrance is recorded. If the trigger succeeds and the entrance request then fails, the door has opened and `onError` is still called.
- **Success.** `onSuccess` receives the `Entrance` the API returned (`id`, `user_id`, `device_id`, `entrance_type`, `created_at`, ...).

The scanner hooks start reading the location when they mount, so the scan itself rarely has to wait. They skip this when the device list is loaded and no device has a range, and when the location permission was refused.

## Device lookup and list reloads

The SDK keeps two lists in `qrScannerStore`:

- `qrDevices`: the devices the user may use (`devices/qr_devices`, read 50 per page until every page is loaded).
- `qrAccessDevices`: the codes the user may use (`qr_access/accessible_qrs`).

Both are loaded after sign-in and after a stored session is restored. They are kept in memory only.

When you call `scan(qrCode)` without a device, the SDK looks the code up with `findQrDevice(device => device.qr_code_id === qrCode)`:

| Situation | What happens |
|-----------|--------------|
| Code found, lists at most 10 minutes old | The device is used |
| Code found, lists older than 10 minutes | The device is used, and the lists are reloaded in the background for later scans |
| Code not found, lists older than 30 seconds (or never loaded) | The lists are loaded again, then the code is looked up once more |
| Code not found, lists loaded in the last 30 seconds | `DEVICE_NOT_FOUND` at once |
| No session on the HTTP client | No reload. `DEVICE_NOT_FOUND` when the code is not in the list |

An app that started without network therefore recovers on the first scan once the network is back; no restart is needed. When a load fails, `qrScannerStore.getState().error` holds its message.

You can reload the lists yourself:

```typescript
import {qrScannerStore} from '@passgage/sdk-react-native';

const loaded = await qrScannerStore.getState().fetchQrDevicesAndAccess();
if (!loaded) {
  console.log(qrScannerStore.getState().error);
}
```

### Passing the device yourself

`scan(qrCode, device)` skips the lookup and uses the `QrDevice` you pass. The code is still checked against `qrAccessDevices` (step 2), and the range of the device you passed is used.

## One scan at a time

A camera reports the code it sees on every frame. While one scan is running, further calls to `scan` return at once without doing anything. So only one request is made, and an IoT door is triggered once.

The lock ends when the scan ends. After a successful read the camera keeps reporting the same code, and that code is refused for 30 seconds with `REPETITIVE_READ`. Once `onSuccess` has fired, stop the camera or ignore its codes until the user wants to scan again.

## Options

| Option | Default | Effect |
|--------|---------|--------|
| `skipLocationCheck` | `false` | `true` skips step 4: the device's range is not checked |
| `skipRepetitiveCheck` | `false` | `true` skips step 3. A successful read is still recorded |

`skipLocationCheck` only turns the check off. The provider still asks for the location permission when it mounts.

## Wiring a camera

With react-native-vision-camera, pass the first code that `useCodeScanner` reports to `scan`, then stop listening:

```typescript
const accepting = useRef(true);

const codeScanner = useCodeScanner({
  codeTypes: ['qr'],
  onCodeScanned: codes => {
    const value = codes[0]?.value;
    if (!value || !accepting.current) {
      return;
    }
    accepting.current = false; // a ref, because state would let the next frames through
    setCameraActive(false);
    scan(value);
  },
});
```

Set `accepting.current = true` again when the user wants to scan again (for example from the button of the result dialog).

## Complete screen

```tsx
import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import {
  FlowResponseType,
  usePassgageQRScanner,
} from '@passgage/sdk-react-native';

const messageFor = (failure?: FlowResponseType): string => {
  switch (failure?.error?.code) {
    case 'DEVICE_NOT_FOUND':
      return 'This code does not belong to a door you can use.';
    case 'QR_ACCESS_DENIED':
    case 'ACCESS_DENIED':
      return 'You do not have access to this door.';
    case 'REPETITIVE_READ':
      return 'This code was just used. Wait a moment and try again.';
    case 'LOCATION_PERMISSION_DENIED':
      return 'Allow location access to use this door.';
    case 'LOCATION_UNAVAILABLE':
      return 'Your location could not be found. Try again.';
    case 'LOCATION_OUT_OF_RANGE':
      return 'You are too far from this door.';
    case 'NETWORK_ERROR':
      return 'No connection. Check your network and try again.';
    default:
      return failure?.message ?? 'The code could not be validated.';
  }
};

export function QRScannerScreen() {
  const device = useCameraDevice('back');
  const {hasPermission, requestPermission} = useCameraPermission();
  const [cameraActive, setCameraActive] = useState(true);
  const accepting = useRef(true);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const resume = () => {
    accepting.current = true;
    setCameraActive(true);
  };

  const {scan, isLoading} = usePassgageQRScanner({
    options: {},
    onSuccess: entrance => {
      Alert.alert('Welcome', `Entrance ${entrance?.id ?? ''} recorded.`, [
        {text: 'OK', onPress: resume},
      ]);
    },
    onError: failure => {
      Alert.alert('Not allowed', messageFor(failure), [
        {text: 'Scan again', onPress: resume},
      ]);
    },
  });

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: codes => {
      const value = codes[0]?.value;
      if (!value || !accepting.current) {
        return;
      }
      accepting.current = false;
      setCameraActive(false);
      scan(value);
    },
  });

  if (!hasPermission) {
    return <Text style={styles.message}>Camera permission is required.</Text>;
  }
  if (device == null) {
    return <Text style={styles.message}>No camera found.</Text>;
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={cameraActive}
        codeScanner={codeScanner}
      />
      {isLoading && (
        <View style={styles.overlay}>
          <ActivityIndicator color="#fff" size="large" />
        </View>
      )}
      {!cameraActive && !isLoading && (
        <TouchableOpacity style={styles.button} onPress={resume}>
          <Text>Scan again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: 'black'},
  message: {margin: 24, textAlign: 'center'},
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  button: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'white',
  },
});
```

## Manual entry

For testing, or as a fallback without a camera, pass typed text to the same `scan`:

```tsx
import React, {useState} from 'react';
import {Alert, Button, TextInput, View} from 'react-native';
import {usePassgageQRScanner} from '@passgage/sdk-react-native';

export function ManualQRScreen() {
  const [code, setCode] = useState('');
  const {scan, isLoading} = usePassgageQRScanner({
    options: {},
    onSuccess: entrance => Alert.alert('Success', `Entrance ${entrance?.id}`),
    onError: failure =>
      Alert.alert('Failed', `${failure?.message} (${failure?.error?.code})`),
  });

  return (
    <View>
      <TextInput value={code} onChangeText={setCode} autoCapitalize="none" />
      <Button
        title="Validate"
        disabled={isLoading || !code.trim()}
        onPress={() => scan(code.trim())}
      />
    </View>
  );
}
```

## See also

- [nfc-scanner.md](./nfc-scanner.md): the same flow for NFC cards
- [error-handling.md](../error-handling.md): every error code
- [troubleshooting.md](../troubleshooting.md) and [faq.md](../faq.md)
