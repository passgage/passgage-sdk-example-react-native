# NFC Card Scanner

The NFC Scanner feature allows users to scan NFC cards for access control entry and exit validation.

## Table of Contents

- [Overview](#overview)
- [usePassgageNFCScanner Hook](#usepassgagenfcscanner-hook)
- [Basic Usage](#basic-usage)
- [Advanced Examples](#advanced-examples)
- [NFC Tag Reading](#nfc-tag-reading)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Overview

The NFC Scanner reads NFC card/tag IDs and validates them against the Passgage backend for access control. The flow:

1. User initiates NFC scanning
2. App detects NFC tag when device is near the card
3. Tag ID is extracted and validated with backend
4. Location and device info are included automatically
5. Entrance record is created on successful validation

```
Start Scanning → Detect NFC Tag → Read Tag ID → Validate → Create Entrance → Access Granted
```

## usePassgageNFCScanner Hook

### API Reference

```typescript
interface UsePassgageNFCScannerOptions {
  onSuccess?: (entrance: Entrance | null) => void;
  onError?: (error: Error) => void;
}

interface UsePassgageNFCScannerReturn {
  startScanning: () => Promise<void>;
  stopScanning: () => Promise<void>;
  isScanning: boolean;
  error: Error | null;
}

interface Entrance {
  id: string;
  userId: string;
  branchId: string;
  type: 'entry' | 'exit';
  timestamp: string;
  nfcCardId?: string;
}
```

### Hook Parameters

- `onSuccess`: Callback when NFC card is valid and access is granted
- `onError`: Callback when NFC card is invalid or validation fails

### Return Values

- `startScanning()`: Start listening for NFC tags
- `stopScanning()`: Stop listening for NFC tags
- `isScanning`: Whether actively scanning for NFC tags
- `error`: Any error that occurred during scanning

## Basic Usage

### Simple NFC Scanner

```typescript
import React from 'react';
import {View, Button, Text, Alert, ActivityIndicator} from 'react-native';
import {usePassgageNFCScanner} from '@passgage/sdk-react-native';

export default function NFCScannerScreen() {
  const {startScanning, stopScanning, isScanning, error} = usePassgageNFCScanner({
    onSuccess: (entrance) => {
      Alert.alert('Access Granted', `Entry recorded: ${entrance?.id}`);
      stopScanning(); // Stop scanning after success
    },
    onError: (error) => {
      Alert.alert('Access Denied', error.message);
      stopScanning(); // Stop scanning after error
    },
  });

  return (
    <View style={{padding: 20}}>
      {!isScanning ? (
        <Button
          title="Start NFC Scan"
          onPress={startScanning}
        />
      ) : (
        <>
          <ActivityIndicator size="large" />
          <Text style={{textAlign: 'center', marginTop: 10}}>
            Hold your device near an NFC card
          </Text>
          <Button
            title="Stop Scanning"
            onPress={stopScanning}
          />
        </>
      )}

      {error && (
        <Text style={{color: 'red', marginTop: 10}}>
          {error.message}
        </Text>
      )}
    </View>
  );
}
```

### With Status Display

```typescript
import React, {useState} from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import {usePassgageNFCScanner} from '@passgage/sdk-react-native';

export default function NFCScannerScreen() {
  const [lastResult, setLastResult] = useState<string | null>(null);

  const {startScanning, stopScanning, isScanning} = usePassgageNFCScanner({
    onSuccess: (entrance) => {
      const message = `Access granted!\nCard: ${entrance?.nfcCardId}`;
      setLastResult(message);
      stopScanning();
    },
    onError: (error) => {
      const message = `Access denied: ${error.message}`;
      setLastResult(message);
      stopScanning();
    },
  });

  const handleStartScan = async () => {
    setLastResult(null);
    await startScanning();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>💳</Text>
      <Text style={styles.title}>NFC Card Scanner</Text>

      <View style={styles.statusContainer}>
        {isScanning ? (
          <>
            <Text style={styles.statusText}>
              🔍 Scanning for NFC cards...
            </Text>
            <Text style={styles.instruction}>
              Hold your device near the card
            </Text>
          </>
        ) : (
          <Text style={styles.statusText}>Ready to scan</Text>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          isScanning ? styles.stopButton : styles.startButton
        ]}
        onPress={isScanning ? stopScanning : handleStartScan}
      >
        <Text style={styles.buttonText}>
          {isScanning ? 'Stop Scanning' : 'Start NFC Scan'}
        </Text>
      </TouchableOpacity>

      {lastResult && (
        <View style={[
          styles.resultContainer,
          lastResult.includes('granted') ? styles.successResult : styles.errorResult
        ]}>
          <Text>{lastResult}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  statusContainer: {
    width: '100%',
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#FF9500',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    width: '100%',
    marginTop: 20,
    padding: 15,
    borderRadius: 8,
  },
  successResult: {
    backgroundColor: '#d4edda',
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  errorResult: {
    backgroundColor: '#f8d7da',
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
});
```

## Advanced Examples

### Auto-Stop After Scan

Automatically stop scanning after successful or failed scan:

```typescript
const {startScanning, stopScanning, isScanning} = usePassgageNFCScanner({
  onSuccess: async (entrance) => {
    await stopScanning();
    Alert.alert('Success', 'Access granted');
    navigation.navigate('AccessGranted', {entrance});
  },
  onError: async (error) => {
    await stopScanning();
    Alert.alert('Error', error.message);
  },
});
```

### Manual Result Handling

```typescript
const {startScanning, stopScanning, isScanning, error} = usePassgageNFCScanner();

const handleScan = async () => {
  try {
    await startScanning();

    // Scanning is now active
    // Wait for NFC tag detection (handled automatically)
    // Success/error will be reflected in hook state

  } catch (err: any) {
    console.error('Failed to start NFC scanning:', err);
    Alert.alert('Error', 'Failed to initialize NFC scanner');
  }
};

// Monitor error state
useEffect(() => {
  if (error) {
    Alert.alert('Scan Failed', error.message);
    stopScanning();
  }
}, [error]);
```

### With Timeout

Stop scanning automatically after a timeout:

```typescript
const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

const {startScanning, stopScanning, isScanning} = usePassgageNFCScanner({
  onSuccess: (entrance) => {
    if (timeoutId) clearTimeout(timeoutId);
    Alert.alert('Access Granted');
  },
  onError: (error) => {
    if (timeoutId) clearTimeout(timeoutId);
    Alert.alert('Access Denied', error.message);
  },
});

const handleStartWithTimeout = async () => {
  await startScanning();

  // Auto-stop after 30 seconds
  const id = setTimeout(async () => {
    await stopScanning();
    Alert.alert('Timeout', 'No NFC card detected');
  }, 30000);

  setTimeoutId(id);
};

// Cleanup on unmount
useEffect(() => {
  return () => {
    if (timeoutId) clearTimeout(timeoutId);
    stopScanning();
  };
}, [timeoutId]);
```

## NFC Tag Reading

### Checking NFC Support

```typescript
import NfcManager from 'react-native-nfc-manager';

const checkNFCSupport = async () => {
  try {
    const supported = await NfcManager.isSupported();

    if (!supported) {
      Alert.alert(
        'NFC Not Supported',
        'This device does not support NFC'
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking NFC support:', error);
    return false;
  }
};

// Use before scanning
const handleScan = async () => {
  const isSupported = await checkNFCSupport();

  if (isSupported) {
    await startScanning();
  }
};
```

### Checking NFC Enabled

```typescript
import NfcManager from 'react-native-nfc-manager';

const checkNFCEnabled = async () => {
  try {
    const enabled = await NfcManager.isEnabled();

    if (!enabled) {
      Alert.alert(
        'NFC Disabled',
        'Please enable NFC in your device settings',
        [
          {text: 'Cancel'},
          {
            text: 'Open Settings',
            onPress: () => {
              if (Platform.OS === 'android') {
                NfcManager.goToNfcSetting();
              } else {
                Linking.openSettings();
              }
            }
          }
        ]
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking NFC enabled:', error);
    return false;
  }
};
```

### Complete NFC Setup Check

```typescript
const initializeNFC = async (): Promise<boolean> => {
  // Check NFC support
  const supported = await NfcManager.isSupported();
  if (!supported) {
    Alert.alert('Error', 'This device does not support NFC');
    return false;
  }

  // Check if NFC is enabled
  const enabled = await NfcManager.isEnabled();
  if (!enabled) {
    Alert.alert(
      'NFC Disabled',
      'Please enable NFC in settings to use this feature',
      [
        {text: 'Cancel'},
        {text: 'Open Settings', onPress: () => NfcManager.goToNfcSetting()}
      ]
    );
    return false;
  }

  // Start NFC manager
  await NfcManager.start();

  return true;
};

// Use in your component
useEffect(() => {
  initializeNFC();

  return () => {
    NfcManager.stop();
  };
}, []);
```

## Error Handling

### Common Error Scenarios

```typescript
const {startScanning, stopScanning} = usePassgageNFCScanner({
  onError: (error) => {
    switch (error.message) {
      case 'NFC not supported':
        Alert.alert('Error', 'Your device does not support NFC');
        break;

      case 'NFC disabled':
        Alert.alert(
          'NFC Disabled',
          'Please enable NFC in your device settings',
          [
            {text: 'Cancel'},
            {text: 'Settings', onPress: () => /* open settings */}
          ]
        );
        break;

      case 'Invalid NFC card':
        Alert.alert('Error', 'This NFC card is not registered');
        break;

      case 'NFC card expired':
        Alert.alert('Error', 'This NFC card has expired');
        break;

      case 'Access denied':
        Alert.alert('Error', 'You do not have access to this location');
        break;

      case 'User canceled':
        // User stopped the scan, no alert needed
        console.log('NFC scan canceled by user');
        break;

      default:
        Alert.alert('Error', error.message || 'NFC scan failed');
    }

    stopScanning();
  },
});
```

### Network Error Handling

```typescript
import NetInfo from '@react-native-community/netinfo';

const {startScanning} = usePassgageNFCScanner({
  onError: async (error) => {
    const netInfo = await NetInfo.fetch();

    if (!netInfo.isConnected) {
      Alert.alert(
        'No Internet',
        'NFC validation requires an internet connection'
      );
    } else {
      Alert.alert('Error', error.message);
    }

    stopScanning();
  },
});
```

## Best Practices

### 1. Always Stop Scanning

Stop scanning when leaving the screen:

```typescript
useEffect(() => {
  return () => {
    stopScanning();
  };
}, []);
```

### 2. Handle App State Changes

Stop scanning when app goes to background:

```typescript
import {AppState} from 'react-native';

useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      stopScanning();
    }
  });

  return () => {
    subscription.remove();
  };
}, []);
```

### 3. Provide Clear Instructions

```typescript
<View style={styles.instructions}>
  <Text style={styles.instructionTitle}>How to scan:</Text>
  <Text style={styles.instructionText}>
    1. Tap "Start NFC Scan" button{'\n'}
    2. Hold the back of your phone near the NFC card{'\n'}
    3. Keep steady until scan completes{'\n'}
    4. Wait for validation response
  </Text>
  <Text style={styles.note}>
    💡 Make sure NFC is enabled in your device settings
  </Text>
</View>
```

### 4. Visual Feedback During Scan

```typescript
{isScanning && (
  <View style={styles.scanningIndicator}>
    <ActivityIndicator size="large" color="#FF9500" />
    <Text style={styles.scanningText}>
      Scanning for NFC cards...
    </Text>
    <Text style={styles.scanningSubtext}>
      Hold your device near the card
    </Text>
  </View>
)}
```

### 5. Platform-Specific Considerations

```typescript
import {Platform} from 'react-native';

const handleScan = async () => {
  if (Platform.OS === 'ios') {
    // iOS NFC scanning is modal and blocks UI
    Alert.alert('Info', 'Hold your iPhone near the card');
  } else {
    // Android NFC scanning runs in background
    Alert.alert('Info', 'Keep your phone steady near the card');
  }

  await startScanning();
};
```

## Testing

### Testing Without NFC Hardware

For testing on devices without NFC:

```typescript
const USE_MOCK_NFC = __DEV__ && !REAL_DEVICE;

if (USE_MOCK_NFC) {
  // Mock NFC scanning for testing
  setTimeout(() => {
    const mockEntrance = {
      id: 'mock-entrance-123',
      userId: user.id,
      branchId: 'mock-branch',
      type: 'entry',
      timestamp: new Date().toISOString(),
      nfcCardId: 'MOCK-NFC-CARD-12345',
    };

    onSuccess?.(mockEntrance);
  }, 2000);
} else {
  await startScanning();
}
```

### Mock NFC Card IDs

Use test card IDs provided by your backend team:

```typescript
const TEST_NFC_CARDS = {
  valid: 'TEST-NFC-VALID-12345',
  expired: 'TEST-NFC-EXPIRED-12345',
  invalid: 'TEST-NFC-INVALID-12345',
  noAccess: 'TEST-NFC-NO-ACCESS-12345',
};
```

## Troubleshooting

### Issue: NFC not working on Android

**Solutions:**
1. Enable NFC in device settings
2. Check AndroidManifest.xml has NFC permissions
3. Ensure device has NFC hardware
4. Try rebooting the device

### Issue: NFC session timeout on iOS

**Solutions:**
1. Hold device steady during scan
2. Ensure card is directly against phone back
3. Remove phone case if it's thick
4. Card might be damaged - try different card

### Issue: "NFC is busy" error

**Solution:** Another app might be using NFC. Stop scanning and try again:

```typescript
try {
  await stopScanning();
  await new Promise(resolve => setTimeout(resolve, 500));
  await startScanning();
} catch (error) {
  Alert.alert('Error', 'NFC is currently busy');
}
```

## Next Steps

- [QR Scanner](./qr-scanner.md) - QR code alternative to NFC
- [Check-In](./check-in.md) - Location-based check-in
- [Error Handling](../error-handling.md) - Comprehensive error handling
- [Examples](../examples.md) - More complete examples
