# NFC Scanner

`usePassgageNFCScanner` reads one NFC card or tag, finds the device it belongs to, and runs the same entrance flow as the [QR scanner](./qr-scanner.md). This page describes the hook as it works in `@passgage/sdk-react-native` 1.0.21.

Set up the provider and sign the user in first: see [getting-started.md](../getting-started.md) and [authentication.md](../authentication.md).

## Contents

- [Setup](#setup)
- [The hook](#the-hook)
- [Starting and stopping a read](#starting-and-stopping-a-read)
- [What happens on a read](#what-happens-on-a-read)
- [Tag id and device code](#tag-id-and-device-code)
- [iOS and Android](#ios-and-android)
- [Complete screen](#complete-screen)

## Setup

1. Install `react-native-nfc-manager` in your app (it is a peer dependency of the SDK) and follow its native setup for iOS and Android.
2. Call `NfcManager.start()` once, in an effect, before the first read. The hook does not call it for you.

```tsx
import NfcManager from 'react-native-nfc-manager';

useEffect(() => {
  NfcManager.start();
}, []);
```

## The hook

```typescript
import {usePassgageNFCScanner} from '@passgage/sdk-react-native';

const {nfcData, supportNFC, startScanning, stopScanning, isScanning, error} =
  usePassgageNFCScanner({
    options: {skipLocationCheck: false, skipRepetitiveCheck: false},
    onSuccess: entrance => {
      console.log('Entrance recorded', entrance?.id);
    },
    onError: failure => {
      console.log(failure.error?.code, failure.message);
    },
  });
```

### Arguments

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `options` | `{skipLocationCheck?: boolean; skipRepetitiveCheck?: boolean}` | Yes | Pass `{}` for the default behaviour (both checks on). Same meaning as for the [QR scanner](./qr-scanner.md#options) |
| `onSuccess` | `(entrance?: Entrance) => void` | No | Called after the API recorded the entrance |
| `onError` | `(error: FlowResponseType) => void` | No | Called for every failed read. Not called when the user cancels |

### Returns

| Field | Type | Description |
|-------|------|-------------|
| `supportNFC` | `boolean \| undefined` | `undefined` until checked on mount, then whether the phone has NFC |
| `startScanning` | `() => Promise<void>` | Waits for one tag and validates it |
| `stopScanning` | `() => Promise<void>` | Cancels a running read |
| `isScanning` | `boolean` | `true` from `startScanning` until the reader is released |
| `nfcData` | `string \| undefined` | The raw id of the last tag read, as the NFC library reports it (`''` when the tag had no id). This is not the converted device code |
| `error` | `FlowResponseType \| null` | The last failed read. Reset to `null` when a new read starts, so it is `null` after a successful one |

The failure has the same shape as for QR: `{success: false, message, error?: {code, details?, status?}}`. Branch on `error.code`; see [error-handling.md](../error-handling.md).

## Starting and stopping a read

`startScanning()` waits for **one** tag:

- It resolves when the read is over: after success, after a failure, and after a cancel. It does not reject. Failures arrive in `onError` and in `error`.
- A call while a read is running is ignored.
- After the read, the SDK releases the NFC reader. `isScanning` turns `false` when that is done, which can be a moment after the promise resolved. A `startScanning` call before that is ignored too.
- To read another tag, call `startScanning()` again.

`stopScanning()` cancels the pending read. The cancel is quiet: `onError` is not called and `error` is not set. `isScanning` turns `false` once the reader is released.

When the component unmounts, the hook cancels a pending read.

## What happens on a read

| # | Step | Fails with |
|---|------|------------|
| – | **NFC off (Android only).** Checked before waiting for a tag | `NFC_DISABLED` |
| – | **Tag id.** The tag must have an id | `NFC_TAG_UNREADABLE` |
| – | **Device.** The converted code must match a device's `nfc_code` | `DEVICE_NOT_FOUND` |
| 1 | **Format.** The code must be non-empty | `INVALID_QR_FORMAT` |
| 2 | **Access list.** The code must be in `qrAccessDevices` | `QR_ACCESS_DENIED` |
| 3 | **Repeated read.** Not read successfully in the last 30 seconds | `REPETITIVE_READ` |
| 4 | **Range check.** Only when the device has `nfc_range_matter === '1'` and a latitude and longitude. Location read at scan time, must be within `nfc_range` meters | `LOCATION_PERMISSION_DENIED`, `LOCATION_UNAVAILABLE`, `LOCATION_OUT_OF_RANGE` |
| 5a | **IoT trigger** (when `device.is_iot`): `POST iot/trigger/:id` | `IOT_TRIGGER_FAILED`, or a code for the HTTP error |
| 5b | **Entrance**: `POST entrances/create_from_qr` with `{device_id, read_method: 'nfc'}` | `REQUEST_REJECTED`, or a code for the HTTP error |
| – | Anything else that goes wrong during the read | `NFC_SCAN_FAILED` |

Points that differ from QR:

- **The NFC range is separate.** A device has one range setting for QR reads (`range_matter` / `range`) and another for NFC reads (`nfc_range_matter` / `nfc_range`). An NFC read uses only the NFC pair. When `nfc_range` is missing, not a number, or not above zero, 100 meters is used.
- **Device lookup** uses `findQrDevice(device => device.nfc_code === code)` at the moment the tag is read, so a list that was loaded or reloaded after `startScanning` was called is used. The reload rules are the same as for QR (an unknown code reloads the lists when they are older than 30 seconds; lists older than 10 minutes are refreshed in the background). See [Device lookup and list reloads](./qr-scanner.md#device-lookup-and-list-reloads).
- The **location** rules are the same as for QR: a location of at most 15 seconds ago is reused; otherwise a new one is read (up to 10 seconds); failing that, a location of at most 5 minutes ago is accepted.

## Tag id and device code

The NFC library reports the tag id as a hex string. Passgage stores the device's card code (`nfc_code`) as a decimal number written in reverse byte order. `reversedHexToDec` does the conversion:

1. Remove whitespace.
2. Reverse the order of the bytes (pairs of hex digits).
3. Convert the hex value to a decimal string (with `big-integer`, so long ids keep every digit).

| Tag id | Reversed | `nfc_code` |
|--------|----------|------------|
| `04A1B2C3` | `C3B2A104` | `3283263748` |
| `04 A1 B2 C3` | `C3B2A104` | `3283263748` |

If the id cannot be parsed as hex, the function returns the input without whitespace.

`reversedHexToDec` is exported, so you can show or log the code that will be looked up:

```typescript
import {reversedHexToDec} from '@passgage/sdk-react-native';

const code = nfcData ? reversedHexToDec(nfcData) : undefined;
```

If a card gives `DEVICE_NOT_FOUND`, compare this value with the `nfc_code` of the device in Passgage.

## iOS and Android

| | iOS | Android |
|---|-----|---------|
| Support check | `supportNFC` from `NfcManager.isSupported()` | Same |
| NFC switched off | Not checked | `startScanning` checks `NfcManager.isEnabled()` first and fails at once with `NFC_DISABLED` |
| Read UI | The system NFC sheet is shown while waiting. The SDK closes it as soon as the tag id is read, before the device lookup and the API calls | No system UI. Show your own "hold the card near the phone" message while `isScanning` is `true` |
| User cancels | Dismissing the sheet counts as a cancel: quiet, no `onError` | `stopScanning()` is the cancel: quiet, no `onError` |
| After the read | The reader is released | The reader is released; this takes a moment, and `isScanning` stays `true` until it is done |

The hook requests the `NfcTech.Ndef` technology with `invalidateAfterFirstRead: true`.

## Complete screen

```tsx
import React, {useEffect} from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import NfcManager from 'react-native-nfc-manager';
import {
  FlowResponseType,
  usePassgageNFCScanner,
} from '@passgage/sdk-react-native';

const messageFor = (failure: FlowResponseType): string => {
  switch (failure.error?.code) {
    case 'NFC_DISABLED':
      return 'NFC is turned off. Turn it on in the settings and try again.';
    case 'NFC_TAG_UNREADABLE':
      return 'The card could not be read. Hold it still and try again.';
    case 'DEVICE_NOT_FOUND':
      return 'This card does not belong to a door you can use.';
    case 'QR_ACCESS_DENIED':
    case 'ACCESS_DENIED':
      return 'You do not have access to this door.';
    case 'REPETITIVE_READ':
      return 'This card was just used. Wait a moment and try again.';
    case 'LOCATION_PERMISSION_DENIED':
      return 'Allow location access to use this door.';
    case 'LOCATION_UNAVAILABLE':
      return 'Your location could not be found. Try again.';
    case 'LOCATION_OUT_OF_RANGE':
      return 'You are too far from this door.';
    case 'NETWORK_ERROR':
      return 'No connection. Check your network and try again.';
    default:
      return failure.message || 'The card could not be validated.';
  }
};

export function NFCScannerScreen() {
  // Once, before any read
  useEffect(() => {
    NfcManager.start();
  }, []);

  const {supportNFC, startScanning, stopScanning, isScanning, error} =
    usePassgageNFCScanner({
      options: {},
      onSuccess: entrance => {
        Alert.alert('Welcome', `Entrance ${entrance?.id ?? ''} recorded.`);
      },
      onError: failure => {
        Alert.alert('Not allowed', messageFor(failure));
      },
    });

  if (supportNFC === undefined) {
    return <ActivityIndicator style={styles.center} />;
  }
  if (supportNFC === false) {
    return <Text style={styles.text}>This phone does not support NFC.</Text>;
  }

  return (
    <View style={styles.center}>
      <Text style={styles.text}>
        {isScanning
          ? 'Hold the card near the phone'
          : 'Tap the button, then hold the card near the phone'}
      </Text>

      {isScanning ? (
        <TouchableOpacity style={styles.button} onPress={stopScanning}>
          <Text>Cancel</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.button} onPress={startScanning}>
          <Text>Read card</Text>
        </TouchableOpacity>
      )}

      {error && (
        <Text style={styles.error}>
          {error.message} ({error.error?.code})
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  text: {margin: 24, textAlign: 'center'},
  button: {padding: 16, borderRadius: 8, backgroundColor: '#e5e5ea'},
  error: {marginTop: 16, color: '#c00', textAlign: 'center'},
});
```

## See also

- [qr-scanner.md](./qr-scanner.md): the shared entrance flow in detail
- [error-handling.md](../error-handling.md): every error code
- [troubleshooting.md](../troubleshooting.md): NFC problems
