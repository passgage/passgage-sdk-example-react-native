# Error Handling

Comprehensive guide to handling errors in the Passgage SDK.

## Table of Contents

- [Overview](#overview)
- [Error Types](#error-types)
- [Handling Errors](#handling-errors)
- [Common Error Scenarios](#common-error-scenarios)
- [Best Practices](#best-practices)
- [Error Recovery](#error-recovery)

## Overview

The Passgage SDK provides comprehensive error handling through:

- ✅ Callback-based error handlers
- ✅ Promise rejection handling
- ✅ Error state in hooks
- ✅ Descriptive error messages
- ✅ Error codes for programmatic handling

## Error Types

### Authentication Errors

```typescript
interface AuthError extends Error {
  code: string;
  message: string;
}
```

Common authentication error codes:
- `INVALID_CREDENTIALS`: Wrong username or password
- `USER_NOT_FOUND`: User does not exist
- `ACCOUNT_DISABLED`: User account is disabled
- `TOKEN_EXPIRED`: Access token has expired
- `INVALID_TOKEN`: Token is malformed or invalid
- `NETWORK_ERROR`: Network connection failed

### API Errors

```typescript
interface ApiError extends Error {
  code: string;
  message: string;
  status: number;    // HTTP status code
  details?: any;     // Additional error details
}
```

Common API error codes:
- `VALIDATION_ERROR`: Request data validation failed
- `AUTHORIZATION_ERROR`: User not authorized for action
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT`: Too many requests
- `SERVER_ERROR`: Internal server error

### Feature-Specific Errors

**QR Scanner:**
- `INVALID_QR_CODE`: QR code format is invalid
- `QR_EXPIRED`: QR code has expired
- `ACCESS_DENIED`: User not authorized for location
- `OUTSIDE_GEOFENCE`: User too far from location

**NFC Scanner:**
- `NFC_NOT_SUPPORTED`: Device doesn't have NFC
- `NFC_DISABLED`: NFC is turned off
- `INVALID_NFC_CARD`: Card not recognized
- `NFC_READ_ERROR`: Failed to read NFC tag

**Check-In:**
- `LOCATION_UNAVAILABLE`: Cannot get device location
- `NO_BRANCHES_FOUND`: No branches within radius
- `ALREADY_CHECKED_IN`: User already checked in
- `TOO_FAR_FROM_BRANCH`: Outside check-in radius

**Remote Work:**
- `ALREADY_WORKING`: Active work session exists
- `NO_ACTIVE_SESSION`: No session to end
- `OUTSIDE_WORKING_HOURS`: Not allowed at this time

## Handling Errors

### Using Callbacks

Most hooks accept `onError` callback:

```typescript
const {login} = usePassgageAuth({
  onLoginError: (error) => {
    // Handle error
    console.error('Login failed:', error);
    Alert.alert('Login Failed', error.message);
  },
});
```

### Using Error State

Hooks provide error state:

```typescript
const {login, error, isLoading} = usePassgageAuth();

// Display error in UI
{error && (
  <Text style={{color: 'red'}}>
    {error.message}
  </Text>
)}
```

### Using Try-Catch

Handle errors with try-catch:

```typescript
const {login} = usePassgageAuth();

try {
  const result = await login({username, password});

  if (!result.success) {
    // Handle failed login
    Alert.alert('Error', result.error);
  }
} catch (error: any) {
  // Handle exception
  Alert.alert('Error', error.message);
}
```

### Combined Approach

Best practice - use all three:

```typescript
const {login, error, isLoading} = usePassgageAuth({
  onLoginError: (error) => {
    // Callback for immediate handling
    logError('login_failed', error);
  },
});

const handleLogin = async () => {
  try {
    const result = await login({username, password});

    if (!result.success) {
      // Check result for business logic errors
      switch (result.error) {
        case 'INVALID_CREDENTIALS':
          Alert.alert('Error', 'Invalid username or password');
          break;
        case 'ACCOUNT_DISABLED':
          Alert.alert('Error', 'Your account has been disabled');
          break;
        default:
          Alert.alert('Error', result.error || 'Login failed');
      }
    } else {
      // Success
      navigation.navigate('Home');
    }
  } catch (error: any) {
    // Catch unexpected errors
    Alert.alert('Error', 'An unexpected error occurred');
    console.error('Login error:', error);
  }
};

// Display error state in UI
{error && (
  <Text style={styles.errorText}>{error.message}</Text>
)}
```

## Common Error Scenarios

### Network Errors

```typescript
import NetInfo from '@react-native-community/netinfo';

const {login} = usePassgageAuth({
  onLoginError: async (error) => {
    // Check if it's a network error
    if (error.message.includes('Network') || error.message.includes('timeout')) {
      const netInfo = await NetInfo.fetch();

      if (!netInfo.isConnected) {
        Alert.alert(
          'No Internet Connection',
          'Please check your internet connection and try again'
        );
      } else {
        Alert.alert(
          'Connection Error',
          'Unable to reach the server. Please try again later.'
        );
      }
    } else {
      Alert.alert('Error', error.message);
    }
  },
});
```

### Validation Errors

```typescript
const handleLogin = async () => {
  // Client-side validation
  if (!username.trim()) {
    Alert.alert('Error', 'Please enter your username');
    return;
  }

  if (!password.trim()) {
    Alert.alert('Error', 'Please enter your password');
    return;
  }

  if (password.length < 6) {
    Alert.alert('Error', 'Password must be at least 6 characters');
    return;
  }

  // Attempt login
  try {
    const result = await login({username, password});

    if (!result.success) {
      // Server-side validation errors
      Alert.alert('Error', result.error);
    }
  } catch (error: any) {
    Alert.alert('Error', error.message);
  }
};
```

### Permission Errors

```typescript
const {getNearbyBranches} = usePassgageCheckIn();

const loadBranches = async () => {
  try {
    const result = await getNearbyBranches();

    if (!result.success) {
      switch (result.error) {
        case 'LOCATION_UNAVAILABLE':
          Alert.alert(
            'Location Required',
            'Please enable location services to find nearby branches',
            [
              {text: 'Cancel'},
              {text: 'Open Settings', onPress: () => Linking.openSettings()}
            ]
          );
          break;

        case 'LOCATION_PERMISSION_DENIED':
          Alert.alert(
            'Permission Denied',
            'Location permission is required for check-in'
          );
          break;

        default:
          Alert.alert('Error', result.error);
      }
    }
  } catch (error: any) {
    Alert.alert('Error', error.message);
  }
};
```

### Timeout Errors

```typescript
const {scan, isLoading} = usePassgageQRScanner({
  onError: (error) => {
    if (error.message.includes('timeout')) {
      Alert.alert(
        'Request Timeout',
        'The request took too long. Please check your connection and try again.'
      );
    } else {
      Alert.alert('Error', error.message);
    }
  },
});

// Or implement custom timeout
const scanWithTimeout = async (qrCode: string) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), 10000);
  });

  try {
    await Promise.race([
      scan(qrCode),
      timeoutPromise
    ]);
  } catch (error: any) {
    Alert.alert('Error', error.message);
  }
};
```

## Best Practices

### 1. Always Handle Errors

```typescript
// ❌ Bad - no error handling
const handleScan = async (qrCode: string) => {
  await scan(qrCode);
};

// ✅ Good - comprehensive error handling
const handleScan = async (qrCode: string) => {
  try {
    const result = await scan(qrCode);

    if (!result.success) {
      Alert.alert('Scan Failed', result.error);
    } else {
      Alert.alert('Success', 'Access granted');
    }
  } catch (error: any) {
    Alert.alert('Error', error.message);
    console.error('Scan error:', error);
  }
};
```

### 2. Provide User-Friendly Messages

```typescript
// ❌ Bad - technical error message
Alert.alert('Error', 'ERR_CONNECTION_REFUSED');

// ✅ Good - user-friendly message
const getUserFriendlyMessage = (error: Error): string => {
  const message = error.message.toLowerCase();

  if (message.includes('network')) {
    return 'Please check your internet connection';
  }

  if (message.includes('timeout')) {
    return 'Request took too long. Please try again';
  }

  if (message.includes('denied')) {
    return 'You do not have permission for this action';
  }

  return 'An error occurred. Please try again';
};

Alert.alert('Error', getUserFriendlyMessage(error));
```

### 3. Log Errors for Debugging

```typescript
const logError = (context: string, error: Error) => {
  console.error(`[${context}]`, {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });

  // Send to error tracking service in production
  if (!__DEV__) {
    Sentry.captureException(error, {
      tags: {context},
    });
  }
};

const {login} = usePassgageAuth({
  onLoginError: (error) => {
    logError('login', error);
    Alert.alert('Login Failed', error.message);
  },
});
```

### 4. Handle Specific Error Cases

```typescript
const handleCheckIn = async (branchId: string) => {
  try {
    const result = await checkInEntry({branchId, userId: user.id});

    if (!result.success) {
      // Handle specific error cases
      switch (result.error) {
        case 'ALREADY_CHECKED_IN':
          Alert.alert(
            'Already Checked In',
            'You are already checked in. Would you like to check out?',
            [
              {text: 'No'},
              {text: 'Check Out', onPress: () => handleCheckOut(branchId)}
            ]
          );
          break;

        case 'TOO_FAR_FROM_BRANCH':
          Alert.alert(
            'Too Far',
            'You must be within 100m of the branch to check in'
          );
          break;

        case 'OUTSIDE_WORKING_HOURS':
          Alert.alert(
            'Outside Hours',
            'Check-in is only allowed during working hours'
          );
          break;

        default:
          Alert.alert('Check-In Failed', result.error);
      }
    }
  } catch (error: any) {
    Alert.alert('Error', 'Failed to check in. Please try again.');
  }
};
```

### 5. Implement Error Boundaries

For catching React errors:

```typescript
import React, {Component, ReactNode} from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {hasError: false};
  }

  static getDerivedStateFromError(error: Error): State {
    return {hasError: true, error};
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Log to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message}
          </Text>
          <Button
            title="Restart"
            onPress={() => this.setState({hasError: false})}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

## Error Recovery

### Retry Logic

```typescript
const retryOperation = async <T,>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.log(`Attempt ${i + 1} failed, retrying...`);

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }

  throw lastError!;
};

// Usage
const handleCheckIn = async (branchId: string) => {
  try {
    await retryOperation(
      () => checkInEntry({branchId, userId: user.id}),
      3, // Max 3 retries
      1000 // 1 second delay
    );

    Alert.alert('Success', 'Checked in successfully');
  } catch (error: any) {
    Alert.alert('Error', 'Failed after 3 attempts');
  }
};
```

### Fallback Strategies

```typescript
// Try multiple approaches
const loadBranches = async () => {
  try {
    // Try with GPS location
    const result = await getNearbyBranches({radius: 5000});

    if (result.success) {
      setBranches(result.data || []);
    }
  } catch (error) {
    console.error('Failed with GPS, trying manual location');

    try {
      // Fallback: Use last known location
      const lastLocation = await getLastKnownLocation();
      const result = await getNearbyBranches({
        latitude: lastLocation.latitude,
        longitude: lastLocation.longitude,
        radius: 10000, // Larger radius
      });

      setBranches(result.data || []);
    } catch (fallbackError) {
      Alert.alert(
        'Error',
        'Unable to load branches. Please enable location services.'
      );
    }
  }
};
```

### Offline Support

```typescript
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const loadBranchesWithCache = async () => {
  const netInfo = await NetInfo.fetch();

  if (netInfo.isConnected) {
    // Online: Fetch fresh data
    try {
      const result = await getNearbyBranches();

      if (result.success && result.data) {
        // Cache for offline use
        await AsyncStorage.setItem(
          'cached_branches',
          JSON.stringify(result.data)
        );

        setBranches(result.data);
      }
    } catch (error) {
      console.error('Failed to load branches online');
      // Fall through to offline mode
    }
  } else {
    // Offline: Use cached data
    try {
      const cached = await AsyncStorage.getItem('cached_branches');

      if (cached) {
        setBranches(JSON.parse(cached));
        Alert.alert('Offline Mode', 'Showing cached data');
      } else {
        Alert.alert('No Internet', 'Please connect to the internet');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to load cached data');
    }
  }
};
```

## Next Steps

- [Authentication](./authentication.md) - Authentication errors
- [Troubleshooting](./troubleshooting.md) - Common issues
- [FAQ](./faq.md) - Error-related questions
- [Best Practices](./best-practices.md) - Error handling patterns
