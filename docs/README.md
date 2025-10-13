# Passgage SDK Documentation

Welcome to the comprehensive developer documentation for the Passgage SDK. This documentation provides everything you need to integrate Passgage's access control and time tracking features into your React Native applications.

## Table of Contents

### Getting Started
- [Installation & Setup](./getting-started.md)
- [Quick Start Guide](./getting-started.md#quick-start)
- [Project Structure](./getting-started.md#project-structure)

### Core Concepts
- [Authentication Flow](./authentication.md)
- [Token Management](./token-management.md)
- [Error Handling](./error-handling.md)

### Features
- [QR Code Scanner](./features/qr-scanner.md)
- [NFC Card Scanner](./features/nfc-scanner.md)
- [Location-Based Check-In](./features/check-in.md)
- [Remote Work Logging](./features/remote-work.md)

### Advanced Topics
- [API Reference](./api-reference.md)
- [Best Practices](./best-practices.md)
- [Performance Optimization](./performance.md)
- [Security Guidelines](./security.md)

### Help & Support
- [FAQ](./faq.md)
- [Troubleshooting](./troubleshooting.md)
- [Migration Guides](./migration-guides.md)
- [Examples](./examples.md)

## Overview

The Passgage SDK (@passgage/sdk-react-native) is a comprehensive React Native library that provides:

- **JWT-based Authentication**: Secure login with automatic token management
- **QR Code Access Control**: Validate QR codes for access entry/exit
- **NFC Card Scanning**: Read and validate NFC cards for access control
- **Location-Based Check-In**: Check in/out from nearby company branches
- **Remote Work Tracking**: Log remote work entries and exits

### Key Features

- ✅ **Automatic Token Management**: JWT tokens are automatically stored, injected, and refreshed
- ✅ **Secure Storage**: Credentials stored using react-native-keychain
- ✅ **Type-Safe**: Full TypeScript support with comprehensive type definitions
- ✅ **React Hooks API**: Easy-to-use custom hooks for all features
- ✅ **Error Handling**: Comprehensive error handling with user-friendly messages
- ✅ **Location Services**: Automatic location detection and management
- ✅ **Production Ready**: Battle-tested in enterprise environments

## Quick Links

- [NPM Package](https://www.npmjs.com/package/@passgage/sdk-react-native)
- [Example Application](../examples/passgage-sdk-example-react-native)
- [GitHub Repository](https://github.com/passgage)

## Installation

```bash
npm install @passgage/sdk-react-native
# or
yarn add @passgage/sdk-react-native
```

### Peer Dependencies

```bash
npm install @react-native-community/geolocation react-native-keychain
# Optional (based on features you use)
npm install react-native-nfc-manager react-native-vision-camera
```

## Minimal Setup

```typescript
import {PassgageAccessProvider} from '@passgage/sdk-react-native';

function App() {
  return (
    <PassgageAccessProvider
      apiUrl="https://your-api.passgage.com"
      apiKey="your-api-key"
    >
      <YourApp />
    </PassgageAccessProvider>
  );
}
```

## Basic Usage

```typescript
import {usePassgageAuth} from '@passgage/sdk-react-native';

function LoginScreen() {
  const {login, isLoading, user} = usePassgageAuth({
    onLoginSuccess: (user) => {
      console.log('Welcome:', user.fullName);
    }
  });

  const handleLogin = async () => {
    await login({
      username: 'user@example.com',
      password: 'password',
    });
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

## Architecture

The SDK follows a modular architecture with clear separation of concerns:

```
@passgage/sdk-react-native
├── Provider (PassgageAccessProvider)
├── Authentication (usePassgageAuth)
├── QR Scanner (usePassgageQRScanner)
├── NFC Scanner (usePassgageNFCScanner)
├── Check-In (usePassgageCheckIn)
├── Remote Work (usePassgageRemoteWork)
└── Location Services (useLocation)
```

Each module is accessible via React hooks that provide:
- State management
- API integration
- Error handling
- Loading states
- Callback support

## Support

For questions, issues, or feature requests:

- Check the [FAQ](./faq.md)
- Review [Troubleshooting Guide](./troubleshooting.md)
- Open an issue on GitHub
- Contact support@passgage.com

## License

Proprietary - © 2025 Passgage

---

**Next Steps**: Start with the [Getting Started Guide](./getting-started.md) to integrate the SDK into your application.
