# Token Management

Understanding how the Passgage SDK handles JWT tokens automatically.

## Table of Contents

- [Overview](#overview)
- [Token Flow](#token-flow)
- [Automatic Token Injection](#automatic-token-injection)
- [Automatic Token Refresh](#automatic-token-refresh)
- [Token Storage](#token-storage)
- [Security](#security)
- [Advanced Usage](#advanced-usage)

## Overview

The Passgage SDK uses JWT (JSON Web Tokens) for authentication. The SDK handles all token management automatically:

- ✅ Secure storage
- ✅ Automatic injection into requests
- ✅ Automatic refresh when expired
- ✅ Automatic retry of failed requests
- ✅ Persistent sessions across app restarts

**You never need to manually handle tokens!**

## Token Flow

### Complete Authentication Flow

```
1. User Login
   ↓
2. Backend Returns Tokens
   - Access Token (short-lived, ~1 hour)
   - Refresh Token (long-lived, ~30 days)
   ↓
3. SDK Stores Tokens Securely
   - iOS: Keychain Services
   - Android: Keystore System
   ↓
4. SDK Injects Access Token into All Requests
   Authorization: Bearer <access-token>
   ↓
5. Access Token Expires?
   ├─ No → Continue using token
   └─ Yes → Use Refresh Token
              ↓
          Get New Access Token
              ↓
          Store New Tokens
              ↓
          Retry Original Request
```

### Login Flow

```typescript
import {usePassgageAuth} from '@passgage/sdk-react-native';

function LoginScreen() {
  const {login} = usePassgageAuth();

  const handleLogin = async () => {
    // 1. Send credentials to backend
    const result = await login({
      username: 'user@example.com',
      password: 'password123',
    });

    if (result.success) {
      // 2. Tokens automatically stored
      // 3. User object available via usePassgageAuth().user
      // 4. All future API calls will include token
      console.log('Logged in!', result.user);
    }
  };

  return <Button onPress={handleLogin} title="Login" />;
}
```

### What Happens Behind the Scenes

```typescript
// When you call login():

1. SDK sends credentials to /auth/login
2. Backend validates and returns:
   {
     "accessToken": "eyJhbGciOiJIUzI1NiIs...",
     "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
     "expiresAt": 1640000000,
     "user": {...}
   }
3. SDK stores in secure storage:
   await Keychain.setGenericPassword(
     'passgage_auth',
     JSON.stringify({accessToken, refreshToken, expiresAt})
   );
4. SDK configures API client:
   axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
5. User object is cached in context
```

## Automatic Token Injection

Once logged in, **all SDK API calls automatically include your token**.

### You Don't Need To:

```typescript
// ❌ You DON'T need to do this
const token = await getToken();
fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// ✅ SDK does it automatically
const {scan} = usePassgageQRScanner();
await scan(qrCode); // Token automatically included!
```

### How It Works

The SDK uses an Axios interceptor to add tokens:

```typescript
// This happens automatically inside the SDK
axios.interceptors.request.use(async (config) => {
  const token = await getStoredToken();

  if (token?.accessToken) {
    config.headers['Authorization'] = `Bearer ${token.accessToken}`;
  }

  return config;
});
```

### All These Requests Include Token Automatically

```typescript
const {scan} = usePassgageQRScanner();
await scan(qrCode); // ✅ Token included

const {checkInEntry} = usePassgageCheckIn();
await checkInEntry({branchId, userId}); // ✅ Token included

const {logEntry} = usePassgageRemoteWork();
await logEntry({userId}); // ✅ Token included

const {startScanning} = usePassgageNFCScanner();
await startScanning(); // ✅ Token included
```

## Automatic Token Refresh

When an access token expires, the SDK automatically refreshes it.

### The Process

```
1. API Request
   ↓
2. Backend Returns 401 Unauthorized
   ↓
3. SDK Detects Expired Token
   ↓
4. SDK Uses Refresh Token
   ↓
5. Backend Returns New Access Token
   ↓
6. SDK Stores New Tokens
   ↓
7. SDK Retries Original Request
   ↓
8. Request Succeeds
```

### You Don't See Any of This

```typescript
// Your code
const {checkInEntry} = usePassgageCheckIn();
await checkInEntry({branchId, userId});

// Behind the scenes if token expired:
// 1. Request fails with 401
// 2. SDK automatically refreshes token
// 3. Request is retried with new token
// 4. checkInEntry() returns successfully
```

### Implementation

The SDK uses a response interceptor:

```typescript
// This happens automatically inside the SDK
axios.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Use refresh token to get new access token
        const newToken = await refreshAccessToken();

        // Update authorization header
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

        // Retry original request
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh failed, user needs to re-login
        await logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### When Refresh Fails

If the refresh token is also expired or invalid:

1. User is automatically logged out
2. Tokens are cleared
3. App navigates to login screen (if configured)

```typescript
const {user, isLoading} = usePassgageAuth();

// This pattern handles automatic logout
if (isLoading) {
  return <LoadingScreen />;
}

if (!user) {
  return <LoginScreen />; // User logged out
}

return <AuthenticatedApp />;
```

## Token Storage

### Secure Storage

Tokens are stored using `react-native-keychain`:

**iOS:**
- Uses iOS Keychain Services
- Hardware-encrypted (on devices with Secure Enclave)
- Protected by device passcode/biometrics
- Isolated from other apps

**Android:**
- Uses Android Keystore System
- Hardware-backed security (when available)
- Encrypted with device lock credentials
- App-specific storage

### What's Stored

```typescript
interface StoredToken {
  accessToken: string;    // JWT access token
  refreshToken: string;   // JWT refresh token
  expiresAt: number;      // Unix timestamp
}
```

### Storage Keys

```typescript
const KEYCHAIN_SERVICE = 'com.passgage.auth';
const KEYCHAIN_USERNAME = 'passgage_user_tokens';
```

### Manual Token Access (Advanced)

In rare cases where you need direct token access:

```typescript
import {getStoredToken, clearStoredToken} from '@passgage/sdk-react-native';

// Get current token
const token = await getStoredToken();
console.log('Access token:', token?.accessToken);
console.log('Expires at:', new Date(token?.expiresAt || 0));

// Clear tokens (logout)
await clearStoredToken();
```

## Security

### Best Practices

✅ **DO:**
- Let SDK handle tokens automatically
- Use HTTPS endpoints only
- Keep refresh tokens secret
- Clear tokens on logout
- Use secure storage (provided by SDK)

❌ **DON'T:**
- Store tokens in AsyncStorage
- Store tokens in app state/Redux
- Log tokens to console in production
- Share tokens between apps
- Hardcode tokens

### Token Security Features

1. **Secure Storage:**
   Hardware-backed encryption when available

2. **HTTPS Only:**
   Tokens only sent over encrypted connections

3. **Automatic Expiration:**
   Access tokens expire after short time

4. **Refresh Token Rotation:**
   Refresh tokens may rotate on each use

5. **Token Scope:**
   Tokens limited to specific permissions

### Common Security Mistakes

**❌ Storing in AsyncStorage:**
```typescript
// NEVER DO THIS
await AsyncStorage.setItem('token', accessToken);
```

**❌ Exposing in Logs:**
```typescript
// NEVER DO THIS IN PRODUCTION
console.log('Token:', accessToken);
```

**❌ Storing in Redux:**
```typescript
// AVOID THIS
const initialState = {
  token: '', // Don't store tokens in Redux
};
```

**✅ Let SDK Handle It:**
```typescript
// DO THIS
const {user} = usePassgageAuth();
// Token is automatically managed securely
```

## Advanced Usage

### Custom API Calls with Token

If you need to make custom API calls:

```typescript
import axios from 'axios';
import {getStoredToken} from '@passgage/sdk-react-native';

const customApiCall = async () => {
  const token = await getStoredToken();

  const response = await axios.get(
    'https://api.passgage.com/custom-endpoint',
    {
      headers: {
        'Authorization': `Bearer ${token?.accessToken}`,
      },
    }
  );

  return response.data;
};
```

### Token Expiration Handling

Check if token is about to expire:

```typescript
const token = await getStoredToken();

if (token) {
  const now = Date.now();
  const expiresIn = token.expiresAt - now;

  if (expiresIn < 5 * 60 * 1000) {
    console.log('Token expires in less than 5 minutes');
    // Optionally pre-emptively refresh
  }
}
```

### Manual Token Refresh

Force token refresh (rarely needed):

```typescript
import {refreshAccessToken} from '@passgage/sdk-react-native';

try {
  const newToken = await refreshAccessToken();
  console.log('Token refreshed');
} catch (error) {
  console.error('Refresh failed:', error);
  // User needs to re-login
}
```

### Token Debugging

Debug token issues:

```typescript
import {getStoredToken} from '@passgage/sdk-react-native';

const debugToken = async () => {
  const token = await getStoredToken();

  if (!token) {
    console.log('No token stored');
    return;
  }

  console.log('Token info:');
  console.log('- Has access token:', !!token.accessToken);
  console.log('- Has refresh token:', !!token.refreshToken);
  console.log('- Expires at:', new Date(token.expiresAt));
  console.log('- Time until expiry:', Math.floor((token.expiresAt - Date.now()) / 1000 / 60), 'minutes');

  // Decode JWT (for debugging only - don't use for security)
  try {
    const payload = JSON.parse(
      atob(token.accessToken.split('.')[1])
    );
    console.log('- User ID:', payload.userId);
    console.log('- Issued at:', new Date(payload.iat * 1000));
  } catch (error) {
    console.error('Failed to decode token:', error);
  }
};
```

### Token Persistence

Tokens persist across:
- ✅ App restarts
- ✅ Device restarts
- ✅ App updates
- ❌ App uninstall (tokens are cleared)
- ❌ Device reset (tokens are cleared)

### Token Synchronization

If your app supports multiple devices:

```typescript
// Tokens are device-specific
// Each device has its own token pair
// Backend should support multiple active sessions per user

const {user} = usePassgageAuth();
console.log('Logged in on this device');
// Other devices may have different tokens for the same user
```

## Summary

The Passgage SDK provides complete token management:

1. **Automatic Storage:** Secure, encrypted storage
2. **Automatic Injection:** Added to all API requests
3. **Automatic Refresh:** Seamless token renewal
4. **Automatic Retry:** Failed requests are retried
5. **Persistent Sessions:** Survive app restarts
6. **Security:** Hardware-backed encryption

**You never need to handle tokens manually!**

## Next Steps

- [Authentication Guide](./authentication.md) - Complete authentication flow
- [Security Best Practices](./security.md) - Security guidelines
- [Error Handling](./error-handling.md) - Handle auth errors
- [FAQ](./faq.md) - Common token questions
