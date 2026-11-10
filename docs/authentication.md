# Authentication

The SDK signs a user in to the Passgage API and keeps that session. Everything else (QR, NFC, device lists) uses this session. All sign-in state lives in `useAuthStore`.

- [Sign-in methods](#sign-in-methods)
- [The auth store](#the-auth-store)
- [Azure AD](#azure-ad)
- [Email / phone and password](#email--phone-and-password)
- [Gating on startup](#gating-on-startup)
- [When onUnauthorized is called](#when-onunauthorized-is-called)
- [Logout](#logout)
- [A failed login and the existing session](#a-failed-login-and-the-existing-session)
- [One active session per user](#one-active-session-per-user)

## Sign-in methods

| Method | How | Session at the next app start |
|--------|-----|-------------------------------|
| Azure AD, through the provider | Pass the `id_token` as the `msalToken` prop | The provider signs in again with `msalToken`. The stored session is not restored |
| Azure AD, yourself | Call `loginWithAzure({id_token}, resolve, reject)` | Restored from the Keychain (no `msalToken` prop) |
| Email or phone number + password | Call `login({login, password}, resolve, reject)` | Restored from the Keychain, unless `rememberUser: false` |

## The auth store

`useAuthStore` is a zustand hook. Use it in components; outside React, read it with `useAuthStore.getState()`.

| State | Type | Description |
|-------|------|-------------|
| `user` | `User \| null` | The signed-in user. Can be `null` while `authStatus` is `true` (the user record could not be loaded) |
| `authStatus` | `boolean` | `true` while a user is signed in |
| `initialized` | `boolean` | `false` until it is known whether there is a session |
| `loading` | `boolean` | `true` during a login, a logout, or the restore at startup |
| `error` | `string \| null` | Message of the last failed login, logout or restore |

| Method | Signature |
|--------|-----------|
| `login` | `(credentials: LoginCredentials, resolve?: (user?: User) => void, reject?: (error: string) => void) => void` |
| `loginWithAzure` | `(credentials: AzureLoginCredentials, resolve?: (user?: User) => void, reject?: (error: string) => void) => void` |
| `logout` | `(resolve?: () => void) => Promise<void>` |
| `restoreSession` | `() => Promise<'restored' \| 'none' \| 'unavailable'>` |
| `restoreAuth` | `() => Promise<boolean>` |
| `refreshToken` | `() => Promise<boolean>` |
| `clearError` | `() => void` |

`login` and `loginWithAzure` do not return the result. It arrives in the `resolve` / `reject` callbacks, and in the store (`authStatus`, `user`, `error`). `restoreSession`, `restoreAuth` and `refreshToken` are covered in [Token Management](./token-management.md); the provider calls them for you.

### The `User` object

| Field | Type |
|-------|------|
| `id` | `string` |
| `email` | `string` |
| `firstName` | `string` |
| `lastName` | `string` |
| `company` | `{id: string; name: string}` |
| `fullName` | `string` (optional) |
| `gsm` | `string` (optional), phone number |
| `avatar` | `string \| null` (optional), URL |
| `jobTitle` | `string \| null` (optional) |
| `birthDate` | `string \| null` (optional) |
| `cardNo` | `string \| null` (optional) |

## Azure AD

The SDK does not talk to Microsoft. Your app gets an Azure AD `id_token` (for example with `react-native-app-auth`) and hands it to the SDK, which exchanges it for a Passgage session.

### Option 1: the `msalToken` prop

```tsx
<PassgageAccessProvider
  baseURL="https://your-api.passgage.com"
  msalToken={idToken}
  onUnauthorized={error => {
    // The Azure login failed: error.message is "Azure login failed: <reason>"
  }}>
  <Root />
</PassgageAccessProvider>
```

- The provider reads `msalToken` once, when it mounts, and calls `loginWithAzure` with it. A token passed later is ignored. To sign in with a new token, call `loginWithAzure` yourself (Option 2).
- The provider sends `device_type` from `Platform.OS` (`'ios'` or `'android'`).
- With `msalToken` the provider does not restore the stored session. It signs in again on every mount.
- `rememberUser` has no effect on this path.
- If the login fails, the provider calls `onUnauthorized` with the message `Azure login failed: <reason>`. `initialized` becomes `true` when the login has finished, so your splash screen ends either way.

Use this option when your app already has a fresh `id_token` every time it starts.

### Option 2: call `loginWithAzure` yourself

Leave `msalToken` out. Get the token, then call `loginWithAzure`:

```ts
loginWithAzure(
  {id_token: idToken, device_type: Platform.OS === 'ios' ? 'ios' : 'android'},
  user => console.log('Signed in', user?.fullName),
  message => console.log('Azure login failed', message),
);
```

| Field of `AzureLoginCredentials` | Type | Required | Notes |
|----------------------------------|------|----------|-------|
| `id_token` | `string` | Yes | Azure AD `id_token` |
| `device_type` | `'android' \| 'ios'` | No | When omitted the SDK sends `'android'`. Pass it explicitly on iOS |

The session is stored in the Keychain. Because there is no `msalToken`, the provider restores it at the next start, and the user does not have to go through Azure again. Show your Azure login screen only when there is no session (`initialized && !authStatus`).

#### Where the error message comes from

The `reject` callback and `error` get a string:

1. The `message` the API sent, when it sent one (a refused Azure token is answered with HTTP 401 and a message).
2. Otherwise the error text of the HTTP client (for example a timeout or a network error).
3. Otherwise `An error occurred during Azure login`, or `Azure login failed` when the API answered without tokens.

A 401 on the Azure login never triggers a token refresh.

#### Login screen with `react-native-app-auth`

```tsx
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {authorize} from 'react-native-app-auth';
import {useAuthStore} from '@passgage/sdk-react-native';

const TENANT_ID = '<your-tenant-id>';

const azureConfig = {
  clientId: '<your-client-id>',
  redirectUrl:
    Platform.OS === 'android'
      ? 'msauth://<your.package>/<signature-hash>'
      : 'msauth.<your.bundle.id>://auth/',
  scopes: ['openid', 'profile', 'offline_access'],
  serviceConfiguration: {
    authorizationEndpoint: `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize`,
    tokenEndpoint: `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
  },
  additionalParameters: {prompt: 'select_account' as const},
};

export default function AzureLoginScreen() {
  const {loading, error, loginWithAzure, clearError} = useAuthStore();

  const handleLogin = async () => {
    clearError();

    let idToken: string | undefined;
    try {
      const result = await authorize(azureConfig);
      idToken = result.idToken;
    } catch (e) {
      // The user cancelled, or Azure refused: the SDK was not involved
      return;
    }

    if (!idToken) {
      Alert.alert('Login failed', 'No ID token received');
      return;
    }

    loginWithAzure(
      {id_token: idToken, device_type: Platform.OS === 'ios' ? 'ios' : 'android'},
      () => {
        // authStatus is now true: your navigator switches to the app
      },
      message => Alert.alert('Login failed', message),
    );
  };

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity
        style={[styles.button, loading && styles.disabled]}
        onPress={handleLogin}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign in with Microsoft</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', padding: 24},
  error: {color: '#c00', marginBottom: 12},
  button: {
    height: 50,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {opacity: 0.6},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
});
```

## Email / phone and password

Leave `msalToken` out of the provider and call `login`:

```ts
login(
  {login: 'user@example.com', password: 'secret'}, // email or phone number
  user => console.log('Signed in', user?.fullName),
  message => console.log('Login failed', message),
);
```

| Field of `LoginCredentials` | Type | Required | Notes |
|-----------------------------|------|----------|-------|
| `login` | `string` | Yes | Email address or phone number |
| `password` | `string` | Yes | |
| `rememberUser` | `boolean` | No | Default `true`. `false` keeps the session in memory only |

With `rememberUser: false`:

- The session is not written to the Keychain, and a session stored by an earlier login is removed.
- Refreshed tokens are not written either.
- After an app restart there is no session, and the user signs in again.

The `reject` message is the `message` the API sent (a wrong password is answered with HTTP 422 and a message), otherwise the error text of the HTTP client, otherwise `An error occurred during login` (or `Login failed` when the API answered without tokens).

### Login screen

```tsx
import React, {useState} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useAuthStore} from '@passgage/sdk-react-native';

export default function PasswordLoginScreen() {
  const {login, loading, error, clearError} = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberUser, setRememberUser] = useState(true);

  const onChange = (setter: (value: string) => void) => (value: string) => {
    if (error) {
      clearError();
    }
    setter(value);
  };

  const handleLogin = () => {
    if (!username.trim() || !password) {
      return;
    }
    login({login: username.trim(), password, rememberUser});
    // Success sets authStatus to true; a failure sets error
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Email or phone number"
        autoCapitalize="none"
        keyboardType="email-address"
        value={username}
        onChangeText={onChange(setUsername)}
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={onChange(setPassword)}
        editable={!loading}
        onSubmitEditing={handleLogin}
      />
      <View style={styles.row}>
        <Text>Keep me signed in</Text>
        <Switch value={rememberUser} onValueChange={setRememberUser} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, loading && styles.disabled]}
        onPress={handleLogin}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign in</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', padding: 24},
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  error: {color: '#c00', marginBottom: 12},
  button: {
    height: 50,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {opacity: 0.6},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
});
```

## Gating on startup

Show a splash screen until `initialized` is `true`, then choose on `authStatus`:

```tsx
function Root() {
  const {initialized, authStatus} = useAuthStore();

  if (!initialized) {
    return <Splash />;
  }
  return authStatus ? <AppStack /> : <LoginScreen />;
}
```

`initialized` becomes `true` once the stored session has been looked up, a login attempt has finished, or the user has logged out. It stays `true` after that. Do not gate on `loading`: it is also `true` during each login and logout. See [Getting Started](./getting-started.md#a-minimal-app).

## When onUnauthorized is called

The provider calls `onUnauthorized(error)` in these cases only:

| Case | `error.message` |
|------|-----------------|
| `msalToken` is set and the provider's Azure login failed | `Azure login failed: <reason>` |
| No `msalToken`, and no session could be restored at startup (none stored, or the stored one could no longer be renewed) | `No active session. Login is required` |
| No `msalToken` and `rememberUser={false}` (every startup) | `No active session. Login is required` |
| A request got 401, the refresh was refused, and that ended the session | `Session expired. Login is required` |

It is not called:

- when your own call to `login` or `loginWithAzure` fails (use `reject` or `error`),
- when you call `logout()`,
- when you call `refreshToken()` yourself and it ends the session (watch `authStatus`),
- while the Keychain cannot be read on a locked iOS device (the provider waits for the foreground and tries again),
- when a refresh fails on the network: the session is kept.

When a session ends it is called once. The provider always calls the latest `onUnauthorized` you passed.

If your navigator already switches on `authStatus`, `onUnauthorized` is optional. Use it for side effects such as telling the user that the session has expired, or resetting your own navigation state.

## Logout

```ts
const {logout} = useAuthStore();

await logout();
// or
logout(() => navigation.reset({index: 0, routes: [{name: 'Login'}]}));
```

`logout(resolve?)` returns a `Promise<void>`. It:

- drops the session held in memory,
- removes the `Authorization` header from the HTTP client,
- empties the device lists (`qrScannerStore.reset()`),
- forgets the recent reads used by the 30-second repeated-read check,
- removes the tokens and the user record from the Keychain,
- sets `authStatus` to `false`, `user` to `null` and `initialized` to `true`.

It does not call the API, and it does not call `onUnauthorized`.

Call `logout()` when your own user signs out of your app. The stored session belongs to whoever signed in last on the device, so a shared device keeps the previous user's session until you log out.

## A failed login and the existing session

A failed `login` or `loginWithAzure` can end a session that was active before it, depending on why it failed:

| Why it failed | Existing session |
|---------------|------------------|
| The API refused it: an HTTP 4xx answer other than 429 (wrong password, refused Azure token), or an answer without tokens | Ended. The SDK calls `logout()`: the Keychain is cleared and `authStatus` becomes `false` |
| No answer (offline, timeout), HTTP 429, or HTTP 5xx | Kept. `authStatus` and the stored session do not change |

In both cases `reject` is called with the message, `error` is set, and `loading` returns to `false`.

## One active session per user

The Passgage API keeps one active session per user. A login (or a token refresh) anywhere else invalidates the token the SDK holds, and the other way round. This applies across apps: if the same user also uses the Passgage app, signing in through the SDK ends that user's session in the Passgage app, and signing in to the Passgage app ends the SDK's session.

What this means for the SDK:

- After the other app has signed in, the SDK's next request gets HTTP 401. The SDK refreshes its token once and repeats the request. The user does not see this. See [Token Management](./token-management.md#401-refresh-replay).
- The refresh in turn invalidates the other app's token. How that app recovers is up to that app.
- With the `msalToken` prop, the provider creates a new session on every mount, which invalidates the other app's session at every start of your app.
- If the refresh is refused (for example, the SDK's access token has passed its 60 days), the session ends and `onUnauthorized` is called.
