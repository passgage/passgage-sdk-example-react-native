# Token Management

You do not need to manage tokens. The SDK stores the session, adds it to its requests, renews it, and ends it. Your app only signs the user in, logs the user out, and reacts to `initialized` and `authStatus` (see [Authentication](./authentication.md)).

This page explains what the SDK does, so you can reason about when a user stays signed in and when the login screen comes back.

- [Tokens and lifetimes](#tokens-and-lifetimes)
- [What is stored where](#what-is-stored-where)
- [Restore at startup](#restore-at-startup)
- [Renewal of older sessions](#renewal-of-older-sessions)
- [401, refresh, replay](#401-refresh-replay)
- [When the session ends](#when-the-session-ends)
- [The iOS locked-device case](#the-ios-locked-device-case)
- [Manual calls](#manual-calls)

## Tokens and lifetimes

A login (`login` or `loginWithAzure`) returns two tokens:

| Token | Use |
|-------|-----|
| Access token | Sent as `Authorization: Bearer <token>` on every SDK request. Valid for 60 days |
| Refresh token | Sent with the access token to get a new pair |

The refresh request (`POST token`) sends `{token, refresh_token}`: the current access token and the refresh token. The API accepts it only while the access token has not expired. After 60 days the session cannot be renewed and the user has to sign in again.

The API keeps one active session per user. A login or refresh elsewhere (for example in the Passgage app) invalidates the SDK's access token before its 60 days are over. The SDK then refreshes on the next 401. See [Authentication](./authentication.md#one-active-session-per-user).

## What is stored where

| Where | What | Notes |
|-------|------|-------|
| Memory | The tokens of the active session | Every refresh uses these, not the Keychain copy. Gone when the app process ends |
| HTTP client | `Authorization: Bearer <access token>` header | Set on login, restore and refresh; removed on logout |
| Keychain / Keystore, service `passgage_auth_tokens` | Access token, refresh token, and `savedAt` (time of writing, in ms) | Written on login and on every successful refresh |
| Keychain / Keystore, service `passgage_user_info` | The `User` record | A cache: a session without it is still restored |

Both Keychain records are written with `WHEN_UNLOCKED` accessibility: they can be read only while the device is unlocked.

What gets written:

| Sign-in | Written to the Keychain |
|---------|-------------------------|
| `login({login, password})` | Yes |
| `login({login, password, rememberUser: false})` | No. A record of an earlier login is removed. Refreshed tokens are not written either |
| `loginWithAzure(...)`, also through the `msalToken` prop | Yes |

The SDK does not export its storage functions. There is no public API to read the tokens, and you do not need one: every SDK service and hook uses the session automatically.

## Restore at startup

Without `msalToken`, and with `rememberUser` left at `true`, the provider calls `restoreSession()` when it mounts:

1. Reads the tokens from the Keychain. If there are none, the result is `'none'`.
2. Reads the stored user (may be missing), puts the access token on the HTTP client, and sets `authStatus` to `true`.
3. If the session is older than 30 days, or has no `savedAt` (stored by an SDK version before 1.0.21), renews it first. See the next section.
4. Sets `initialized` to `true` and loads the device lists in the background.
5. Loads the current user from the API, and stores it.

| Result of `restoreSession()` | Meaning | What the provider does |
|------------------------------|---------|------------------------|
| `'restored'` | A session is active | Nothing more |
| `'none'` | No session: nothing stored, the stored session was refused at renewal, or the Keychain could not be read while the app was in the foreground | Calls `onUnauthorized` with `No active session. Login is required` |
| `'unavailable'` | The Keychain could not be read while the app was in the background | Waits for the app to come to the foreground, then tries again. Does not call `onUnauthorized` |

With `msalToken` set, the provider does not restore: it signs in with Azure instead. With `rememberUser={false}`, it logs out instead.

## Renewal of older sessions

An access token cannot be renewed after its 60 days. So when a stored session is restored and it was written more than 30 days ago, the SDK refreshes it before it reports `initialized`. Every refresh writes a new `savedAt`.

The result: a user who opens the app at least once every 60 days stays signed in. After 60 days without the app, the user signs in again.

| Renewal outcome | Effect |
|-----------------|--------|
| Success | New tokens in memory, on the HTTP client and in the Keychain. Result `'restored'` |
| Refused by the API | The session ends (`logout()`). Result `'none'`, and the provider calls `onUnauthorized` |
| No answer (offline, timeout), HTTP 429, or 5xx | The stored session is kept. Result `'restored'`. The next 401 will try again |

Renewal happens at restore, so it needs the provider to mount without `msalToken`. A refresh after a 401 also writes a new `savedAt`.

## 401, refresh, replay

When an SDK request gets HTTP 401:

1. If the token on the HTTP client already changed while the request was running (another request refreshed it, or a login finished), the request is repeated with the current token. No refresh is made.
2. Otherwise the SDK refreshes the session. Requests that get 401 while a refresh is running wait for that same refresh: one refresh call is made.
3. If the refresh succeeds, each waiting request is repeated once with the new token.
4. If the refresh fails, each waiting request fails with its original 401 (in scan results this is `UNAUTHORIZED`; see [Error Handling](./error-handling.md)).

Each request is repeated at most once. Requests to the endpoints that issue tokens (`users/sign_in`, `auth/azure`, `token`) never trigger a refresh.

Why a refresh fails decides what happens to the session:

| Refresh outcome | Session |
|-----------------|---------|
| Refused by the API: HTTP 4xx other than 429, or an answer without tokens | Ended: `logout()` runs and the provider calls `onUnauthorized` with `Session expired. Login is required` (once) |
| No answer (offline, timeout), HTTP 429, or 5xx | Kept. The next 401 tries again |
| The user logged out or signed in again while the refresh was running | The refresh result is dropped |

## When the session ends

A session ends only in these cases:

- You call `logout()`.
- A refresh is refused by the API (after a 401, at the renewal on restore, or when you call `refreshToken()` yourself).
- `login` or `loginWithAzure` is refused by the API while a session is active. See [Authentication](./authentication.md#a-failed-login-and-the-existing-session).
- The provider mounts with `rememberUser={false}` (and no `msalToken`).
- The app restarts after `login({..., rememberUser: false})`: that session was never stored.

A network failure never ends the session.

When the session ends, the SDK clears the session in memory, the `Authorization` header, the device lists and the Keychain records, and sets `authStatus` to `false`.

## The iOS locked-device case

The session is stored with `WHEN_UNLOCKED` accessibility. iOS refuses to read it while the device is locked, for example when the app is started in the background.

Before 1.0.21 this was treated as "no session" and the user was sent to the login screen. Now:

- `restoreSession()` resolves `'unavailable'` when the read fails and the app is not in the foreground. `error` is set to the storage error message.
- The provider does not call `onUnauthorized`, and `initialized` stays `false`.
- When the app comes to the foreground, the provider restores again.

Keep showing your splash screen while `initialized` is `false`, and this case needs no code in your app.

## Manual calls

You normally do not call these. They are on `useAuthStore` for special cases.

### `refreshToken()`

```ts
const ok = await useAuthStore.getState().refreshToken();
```

Resolves `true` when a new access token was obtained and stored. Resolves `false` when:

- there is no session in this run,
- the API refused the refresh: the session is ended with `logout()`, but `onUnauthorized` is not called (watch `authStatus`),
- the refresh failed on the network: the session is kept,
- the user logged out or signed in again while it was running.

Calls made while a refresh is running share that refresh.

### `restoreSession()` and `restoreAuth()`

```ts
const result = await useAuthStore.getState().restoreSession();
// 'restored' | 'none' | 'unavailable'

const restored = await useAuthStore.getState().restoreAuth();
// true when result is 'restored'
```

The provider calls `restoreSession()` at startup and handles `'unavailable'` for you. Call it yourself only if you need to restore outside the provider's startup. `restoreAuth()` is the same call, resolving a boolean.
