# Authentication Flow

This document explains how authentication works in the Passgage SDK, including login, token management, and user session handling.

## Table of Contents

- [Overview](#overview)
- [Login Flow](#login-flow)
- [Token Management](#token-management)
- [User Session](#user-session)
- [Logout](#logout)
- [usePassgageAuth Hook](#usepassgageauth-hook)
- [Examples](#examples)

## Overview

The Passgage SDK uses JWT (JSON Web Token) based authentication with automatic token management. Once a user logs in:

1. JWT tokens (access + refresh) are securely stored
2. Tokens are automatically injected into all API requests
3. Expired tokens are automatically refreshed
4. User information is cached for offline access

```
┌─────────────┐
│   Login     │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  JWT Tokens Stored  │
│  (Secure Storage)   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  User Authenticated │
│  API Calls Work     │
└─────────────────────┘
```

## Login Flow

### Basic Login

```typescript
import {usePassgageAuth} from '@passgage/sdk-react-native';

function LoginScreen() {
  const {login, isLoading, error} = usePassgageAuth();

  const handleLogin = async () => {
    const result = await login({
      username: 'user@example.com',
      password: 'password123',
    });

    if (result.success) {
      console.log('Logged in:', result.user);
      // Navigate to home screen
    }
  };

  return (
    <Button
      onPress={handleLogin}
      disabled={isLoading}
      title="Login"
    />
  );
}
```

### Login with Callbacks

For better UX, use callbacks to handle success and error cases:

```typescript
const {login, isLoading} = usePassgageAuth({
  onLoginSuccess: (user) => {
    Alert.alert('Welcome', `Hello ${user.fullName}!`);
    navigation.replace('Home');
  },
  onLoginError: (error) => {
    Alert.alert('Login Failed', error.message);
  },
});

const handleLogin = async () => {
  await login({username, password});
  // Callbacks will be triggered automatically
};
```

### Login Parameters

```typescript
interface LoginParams {
  username: string;   // Email or username
  password: string;   // User password
}

interface LoginResult {
  success: boolean;   // Whether login succeeded
  user?: User;        // User object if successful
  error?: string;     // Error message if failed
}
```

## Token Management

### Automatic Token Injection

After successful login, all API requests automatically include the JWT token:

```typescript
const {checkInEntry} = usePassgageCheckIn();

// This request automatically includes:
// Authorization: Bearer <your-jwt-token>
await checkInEntry({
  branchId: 'branch-123',
  userId: user.id,
});
```

You never need to manually handle tokens!

### Token Storage

Tokens are stored securely using `react-native-keychain`:

```typescript
// Stored automatically after login:
{
  accessToken: "eyJhbGciOiJIUzI1NiIs...",  // Short-lived (1 hour)
  refreshToken: "eyJhbGciOiJIUzI1NiIs...", // Long-lived (30 days)
  expiresAt: 1640000000                    // Timestamp
}
```

### Automatic Token Refresh

When an access token expires, the SDK automatically:

1. Detects the 401 Unauthorized response
2. Uses the refresh token to get a new access token
3. Retries the original request with the new token
4. Updates stored tokens

This happens transparently - your code doesn't need to handle it:

```typescript
// Even if token expires during this request,
// it will automatically refresh and retry
const result = await getNearbyBranches();
```

### Token Refresh Flow

```
API Request → Token Expired? → Yes → Use Refresh Token
                  ↓                        ↓
                  No                  New Access Token
                  ↓                        ↓
            Use Access Token    ← ─ ─ ─ ─ ┘
                  ↓
            API Response
```

### Manual Token Access (Advanced)

In rare cases where you need direct token access:

```typescript
import {getStoredToken} from '@passgage/sdk-react-native';

async function getToken() {
  const token = await getStoredToken();
  console.log('Current token:', token?.accessToken);
}
```

## User Session

### Accessing User Information

After login, user information is available throughout your app:

```typescript
const {user, isLoading} = usePassgageAuth();

if (isLoading) {
  return <LoadingScreen />;
}

if (!user) {
  return <LoginScreen />;
}

return (
  <View>
    <Text>Welcome, {user.fullName}!</Text>
    <Text>Email: {user.email}</Text>
    <Text>Company: {user.company?.name}</Text>
    <Text>Role: {user.role}</Text>
  </View>
);
```

### User Object Structure

```typescript
interface User {
  id: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  gsm?: string;          // Phone number
  jobTitle?: string;
  role?: string;
  company?: {
    id: string;
    name: string;
    logo?: string;
  };
  profilePicture?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Checking Authentication Status

```typescript
const {user, isAuthenticated} = usePassgageAuth();

// Method 1: Check user object
if (user) {
  console.log('User is authenticated');
}

// Method 2: Use isAuthenticated helper
if (isAuthenticated) {
  console.log('User is authenticated');
}
```

### Persistent Sessions

User sessions persist across app restarts:

```typescript
// On app launch
function App() {
  const {user, isLoading} = usePassgageAuth();

  if (isLoading) {
    // Checking if user was previously logged in
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {user ? <AuthenticatedApp /> : <LoginScreen />}
    </NavigationContainer>
  );
}
```

## Logout

### Basic Logout

```typescript
const {logout} = usePassgageAuth();

const handleLogout = async () => {
  await logout();
  // User is now logged out
  // Tokens are cleared
  // Navigation to login screen happens automatically
};
```

### Logout with Confirmation

```typescript
const {logout} = usePassgageAuth();

const handleLogout = () => {
  Alert.alert(
    'Logout',
    'Are you sure you want to logout?',
    [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.replace('Login');
        },
      },
    ]
  );
};
```

### What Happens on Logout?

1. JWT tokens are removed from secure storage
2. User object is cleared from memory
3. API client authorization header is removed
4. Cached user data is cleared
5. App navigates to login screen (if configured)

## usePassgageAuth Hook

### Complete API Reference

```typescript
interface UsePassgageAuthOptions {
  onLoginSuccess?: (user: User) => void;
  onLoginError?: (error: Error) => void;
  onLogout?: () => void;
}

interface UsePassgageAuthReturn {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;

  // Actions
  login: (params: LoginParams) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
```

### Hook Usage Examples

#### Example 1: Simple Login/Logout

```typescript
function AuthButton() {
  const {user, login, logout, isLoading} = usePassgageAuth();

  if (user) {
    return (
      <Button
        title="Logout"
        onPress={logout}
        disabled={isLoading}
      />
    );
  }

  return (
    <Button
      title="Login"
      onPress={() => login({username: '...', password: '...'})}
      disabled={isLoading}
    />
  );
}
```

#### Example 2: Protected Component

```typescript
function ProtectedScreen() {
  const {user, isLoading} = usePassgageAuth();

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (!user) {
    return (
      <View>
        <Text>Please login to access this feature</Text>
        <Button title="Login" onPress={() => navigation.navigate('Login')} />
      </View>
    );
  }

  return <SecureContent user={user} />;
}
```

#### Example 3: User Profile Display

```typescript
function ProfileScreen() {
  const {user, logout, refreshUser, isLoading} = usePassgageAuth();

  return (
    <ScrollView>
      <Image source={{uri: user?.profilePicture}} />
      <Text style={styles.name}>{user?.fullName}</Text>
      <Text style={styles.email}>{user?.email}</Text>

      {user?.company && (
        <View style={styles.company}>
          <Text>{user.company.name}</Text>
        </View>
      )}

      <Button
        title="Refresh Profile"
        onPress={refreshUser}
        disabled={isLoading}
      />

      <Button
        title="Logout"
        onPress={logout}
      />
    </ScrollView>
  );
}
```

#### Example 4: Conditional Features Based on User Role

```typescript
function HomeScreen() {
  const {user} = usePassgageAuth();

  return (
    <View>
      <Button title="QR Scanner" onPress={...} />
      <Button title="Check In" onPress={...} />

      {user?.role === 'admin' && (
        <Button title="Admin Panel" onPress={...} />
      )}

      {user?.company?.features?.includes('remote_work') && (
        <Button title="Remote Work" onPress={...} />
      )}
    </View>
  );
}
```

## Examples

### Complete Login Screen Example

```typescript
import React, {useState} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {usePassgageAuth} from '@passgage/sdk-react-native';

export default function LoginScreen({navigation}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const {login, isLoading} = usePassgageAuth({
    onLoginSuccess: (user) => {
      Alert.alert('Success', `Welcome back, ${user.fullName}!`);
      navigation.replace('Home');
    },
    onLoginError: (error) => {
      Alert.alert('Login Failed', error.message);
    },
  });

  const handleLogin = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter your username or email');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    await login({
      username: username.trim(),
      password: password.trim(),
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Passgage</Text>
        <Text style={styles.subtitle}>Access Control System</Text>

        <TextInput
          style={styles.input}
          placeholder="Username or Email"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
          returnKeyType="next"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={() => Alert.alert('Info', 'Contact your admin')}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  button: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    marginTop: 20,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: 14,
  },
});
```

## Security Best Practices

1. **Never Store Passwords**: Only send passwords during login, never store them
2. **Use HTTPS**: Always use HTTPS API endpoints
3. **Validate Input**: Validate username/password before sending to API
4. **Handle Errors**: Display user-friendly error messages
5. **Secure Storage**: SDK uses react-native-keychain for secure token storage
6. **Auto-Logout**: Consider implementing auto-logout on extended inactivity

## Next Steps

- [Token Management](./token-management.md) - Deep dive into token handling
- [Error Handling](./error-handling.md) - Handle authentication errors
- [Security Guidelines](./security.md) - Security best practices
- [FAQ](./faq.md) - Common authentication questions
