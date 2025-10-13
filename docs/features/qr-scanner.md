# QR Code Scanner

The QR Scanner feature allows users to scan QR codes for access control entry and exit validation.

## Table of Contents

- [Overview](#overview)
- [usePassgageQRScanner Hook](#usepassgageqrscanner-hook)
- [Basic Usage](#basic-usage)
- [Advanced Examples](#advanced-examples)
- [Camera Integration](#camera-integration)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Overview

The QR Scanner validates QR codes against the Passgage backend to grant or deny access. When a QR code is scanned:

1. The code is sent to the backend for validation
2. Location data is automatically included (if available)
3. Device information is sent for audit purposes
4. An entrance record is created if validation succeeds

```
Scan QR Code → Validate → Location Check → Create Entrance → Access Granted
```

## usePassgageQRScanner Hook

### API Reference

```typescript
interface UsePassgageQRScannerOptions {
  onSuccess?: (entrance: Entrance | null) => void;
  onError?: (error: Error) => void;
}

interface UsePassgageQRScannerReturn {
  scan: (qrCode: string, device?: QrDevice) => Promise<ScanResult>;
  isLoading: boolean;
  error: Error | null;
}

interface ScanResult {
  success: boolean;
  entrance?: Entrance;
  error?: string;
}

interface Entrance {
  id: string;
  userId: string;
  branchId: string;
  type: 'entry' | 'exit';
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}
```

### Hook Parameters

- `onSuccess`: Callback when QR code is valid and access is granted
- `onError`: Callback when QR code is invalid or validation fails

### Return Values

- `scan(qrCode, device?)`: Function to validate a QR code
  - `qrCode`: The scanned QR code string
  - `device` (optional): Device information for the QR device
- `isLoading`: Whether a scan operation is in progress
- `error`: Any error that occurred during scanning

## Basic Usage

### Simple QR Scanner

```typescript
import React, {useState} from 'react';
import {View, TextInput, Button, Text, Alert} from 'react-native';
import {usePassgageQRScanner} from '@passgage/sdk-react-native';

export default function QRScannerScreen() {
  const [qrCode, setQrCode] = useState('');

  const {scan, isLoading, error} = usePassgageQRScanner({
    onSuccess: (entrance) => {
      Alert.alert(
        'Access Granted',
        `Entry recorded at ${entrance?.timestamp}`
      );
    },
    onError: (error) => {
      Alert.alert('Access Denied', error.message);
    },
  });

  const handleScan = async () => {
    if (!qrCode.trim()) {
      Alert.alert('Error', 'Please enter a QR code');
      return;
    }

    await scan(qrCode.trim());
  };

  return (
    <View>
      <TextInput
        placeholder="Enter QR code"
        value={qrCode}
        onChangeText={setQrCode}
        editable={!isLoading}
      />

      <Button
        title={isLoading ? 'Scanning...' : 'Scan QR Code'}
        onPress={handleScan}
        disabled={isLoading}
      />

      {error && <Text style={{color: 'red'}}>{error.message}</Text>}
    </View>
  );
}
```

### With Result Display

```typescript
import React, {useState} from 'react';
import {View, Button, Text, Alert, ActivityIndicator} from 'react-native';
import {usePassgageQRScanner} from '@passgage/sdk-react-native';

export default function QRScannerScreen() {
  const [lastResult, setLastResult] = useState<string | null>(null);

  const {scan, isLoading} = usePassgageQRScanner({
    onSuccess: (entrance) => {
      const message = `Access granted!\nEntrance ID: ${entrance?.id}`;
      setLastResult(message);
      Alert.alert('Success', message);
    },
    onError: (error) => {
      const message = `Access denied: ${error.message}`;
      setLastResult(message);
      Alert.alert('Failed', message);
    },
  });

  const handleScan = async (code: string) => {
    setLastResult(null);
    await scan(code);
  };

  return (
    <View style={{padding: 20}}>
      <Button
        title="Open Camera Scanner"
        onPress={() => {/* Open camera */}}
        disabled={isLoading}
      />

      {isLoading && (
        <View style={{marginTop: 20}}>
          <ActivityIndicator size="large" />
          <Text style={{textAlign: 'center', marginTop: 10}}>
            Validating QR code...
          </Text>
        </View>
      )}

      {lastResult && (
        <View style={{
          marginTop: 20,
          padding: 15,
          backgroundColor: lastResult.includes('granted') ? '#d4edda' : '#f8d7da',
          borderRadius: 8,
        }}>
          <Text>{lastResult}</Text>
        </View>
      )}
    </View>
  );
}
```

## Advanced Examples

### QR Scanner with Device Information

When scanning from a specific QR device terminal:

```typescript
interface QrDevice {
  id: string;
  name: string;
  location?: string;
}

const device: QrDevice = {
  id: 'terminal-001',
  name: 'Main Entrance Terminal',
  location: 'Building A - Floor 1'
};

const {scan} = usePassgageQRScanner({
  onSuccess: (entrance) => {
    console.log('Entry via device:', device.name);
  },
});

// Pass device information with scan
await scan(qrCode, device);
```

### Manual Success/Error Handling

If you prefer handling results manually instead of callbacks:

```typescript
const {scan, isLoading, error} = usePassgageQRScanner();

const handleScan = async (qrCode: string) => {
  const result = await scan(qrCode);

  if (result.success) {
    console.log('Access granted');
    console.log('Entrance:', result.entrance);
    navigation.navigate('AccessGranted', {entrance: result.entrance});
  } else {
    console.error('Access denied:', result.error);
    Alert.alert('Access Denied', result.error);
  }
};
```

### With Entry Type Detection

```typescript
const {scan} = usePassgageQRScanner({
  onSuccess: (entrance) => {
    if (entrance?.type === 'entry') {
      Alert.alert('Welcome', 'Entry recorded successfully');
    } else if (entrance?.type === 'exit') {
      Alert.alert('Goodbye', 'Exit recorded successfully');
    }
  },
});
```

## Camera Integration

### Using react-native-vision-camera

For production apps, integrate with a real camera:

```bash
npm install react-native-vision-camera react-native-vision-camera-code-scanner
```

Complete camera scanner implementation:

```typescript
import React, {useCallback} from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {Camera, useCameraDevice, useCodeScanner} from 'react-native-vision-camera';
import {usePassgageQRScanner} from '@passgage/sdk-react-native';

export default function QRCameraScanner() {
  const device = useCameraDevice('back');
  const [hasPermission, setHasPermission] = useState(false);

  const {scan, isLoading} = usePassgageQRScanner({
    onSuccess: (entrance) => {
      console.log('Access granted:', entrance?.id);
    },
    onError: (error) => {
      console.error('Access denied:', error.message);
    },
  });

  // Request camera permission
  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Handle QR code detection
  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: useCallback(
      (codes) => {
        if (isLoading) return; // Don't scan while processing

        const qrCode = codes[0]?.value;
        if (qrCode) {
          scan(qrCode);
        }
      },
      [scan, isLoading]
    ),
  });

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text>Camera permission required</Text>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.container}>
        <Text>No camera device found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        codeScanner={codeScanner}
      />

      <View style={styles.overlay}>
        <View style={styles.targetBox} />
        <Text style={styles.instructions}>
          Point camera at QR code
        </Text>
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Validating...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
  },
  instructions: {
    marginTop: 20,
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
});
```

## Error Handling

### Common Error Scenarios

```typescript
const {scan} = usePassgageQRScanner({
  onError: (error) => {
    switch (error.message) {
      case 'Invalid QR code':
        Alert.alert('Error', 'This QR code is not valid');
        break;

      case 'QR code expired':
        Alert.alert('Error', 'This QR code has expired');
        break;

      case 'Access denied':
        Alert.alert('Error', 'You do not have access to this location');
        break;

      case 'Outside geofence':
        Alert.alert('Error', 'You are too far from the location');
        break;

      default:
        Alert.alert('Error', error.message || 'Failed to validate QR code');
    }
  },
});
```

### Network Error Handling

```typescript
const {scan, isLoading, error} = usePassgageQRScanner();

const handleScan = async (qrCode: string) => {
  try {
    const result = await scan(qrCode);

    if (!result.success) {
      // Validation failed
      Alert.alert('Access Denied', result.error || 'Invalid QR code');
    }
  } catch (error: any) {
    // Network or other error
    if (error.message.includes('Network')) {
      Alert.alert('Network Error', 'Please check your internet connection');
    } else {
      Alert.alert('Error', 'Failed to scan QR code. Please try again.');
    }
  }
};
```

## Best Practices

### 1. Prevent Multiple Scans

Prevent scanning while a scan is in progress:

```typescript
const {scan, isLoading} = usePassgageQRScanner({...});

const handleScan = async (qrCode: string) => {
  if (isLoading) {
    console.log('Scan already in progress');
    return;
  }

  await scan(qrCode);
};
```

### 2. Validate QR Code Format

Validate QR code format before sending to API:

```typescript
const isValidQRCode = (code: string): boolean => {
  // Example validation - adjust based on your QR code format
  return /^[A-Z0-9]{8,32}$/.test(code);
};

const handleScan = async (qrCode: string) => {
  if (!isValidQRCode(qrCode)) {
    Alert.alert('Error', 'Invalid QR code format');
    return;
  }

  await scan(qrCode);
};
```

### 3. Provide Visual Feedback

```typescript
const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');

const {scan} = usePassgageQRScanner({
  onSuccess: () => {
    setScanStatus('success');
    setTimeout(() => setScanStatus('idle'), 2000);
  },
  onError: () => {
    setScanStatus('error');
    setTimeout(() => setScanStatus('idle'), 2000);
  },
});

// In render:
<View style={[
  styles.statusIndicator,
  {backgroundColor: scanStatus === 'success' ? 'green' : scanStatus === 'error' ? 'red' : 'gray'}
]} />
```

### 4. Log Scan Attempts

```typescript
const {scan} = usePassgageQRScanner({
  onSuccess: (entrance) => {
    console.log('[QR Scanner] Success:', {
      entranceId: entrance?.id,
      timestamp: entrance?.timestamp,
      type: entrance?.type,
    });
  },
  onError: (error) => {
    console.error('[QR Scanner] Failed:', {
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  },
});
```

### 5. Handle Offline Scenarios

```typescript
import NetInfo from '@react-native-community/netinfo';

const handleScan = async (qrCode: string) => {
  const netInfo = await NetInfo.fetch();

  if (!netInfo.isConnected) {
    Alert.alert(
      'No Internet',
      'QR code scanning requires an internet connection'
    );
    return;
  }

  await scan(qrCode);
};
```

## Testing

### Manual Testing

For testing without a physical QR code:

```typescript
// Use a text input for testing
<TextInput
  placeholder="Enter QR code for testing"
  value={qrCode}
  onChangeText={setQrCode}
/>

<Button title="Test Scan" onPress={() => scan(qrCode)} />
```

### Mock QR Codes

Ask your backend team for test QR codes:

```typescript
const TEST_QR_CODES = {
  valid: 'TEST-VALID-QR-12345',
  expired: 'TEST-EXPIRED-QR-12345',
  invalid: 'TEST-INVALID-QR-12345',
};

// Use for testing
await scan(TEST_QR_CODES.valid);
```

## Next Steps

- [NFC Scanner](./nfc-scanner.md) - Similar to QR but for NFC cards
- [Check-In](./check-in.md) - Location-based check-in
- [Error Handling](../error-handling.md) - Comprehensive error handling
- [Examples](../examples.md) - More complete examples
