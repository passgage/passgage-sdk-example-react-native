/**
 * Passgage Access SDK - Example App
 *
 * This is a demonstration app showing how to integrate and use the Passgage Access SDK
 * in your React Native application.
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import RNShake from 'react-native-shake';
import NetworkLogger from 'react-native-network-logger';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
import NFCScannerScreen from './src/screens/NFCScannerScreen';

import { QRScannerCameraScreen } from './src/screens/QRScannerCameraScreen';
import {
  locationStore,
  PassgageAccessProvider,
  useAuthStore,
} from '@passgage/sdk-react-native';

// Types
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  QRScanner: undefined;
  QRScannerCamera: undefined;
  NFCScanner: undefined;
  CheckIn: undefined;
  RemoteWork: undefined;
  NetworkLogger: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const rootNavigationRef = React.createRef<any>();

// Configuration - Replace with your actual Passgage API URL
// const API_BASE_URL = 'https://portal.passgage.com';
const API_BASE_URL = 'https://andromeda.passgage.com';

/**
 * Main navigation component with auth check
 */
const AppNavigator = () => {
  const { authStatus, initialized } = useAuthStore();

  // Until the stored session has been looked up, show a splash screen.
  // Gating on `loading` instead would also hide the login screen while a
  // login request is running.
  if (!initialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={rootNavigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {!authStatus ? (
          // Auth Stack - Show login screen
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{
                headerShown: false,
                animationTypeForReplace: 'pop',
              }}
            />
            <Stack.Screen name="NetworkLogger" component={NetworkLogger} />
          </>
        ) : (
          // App Stack - Show main app screens
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: 'Passgage SDK Demo' }}
            />
            <Stack.Screen
              name="QRScanner"
              component={QRScannerScreen}
              options={{ title: 'QR Scanner' }}
            />
            <Stack.Screen
              name="QRScannerCamera"
              component={QRScannerCameraScreen}
              options={{ title: 'QR Scanner' }}
            />
            <Stack.Screen
              name="NFCScanner"
              component={NFCScannerScreen}
              options={{ title: 'NFC Scanner' }}
            />

            <Stack.Screen name="NetworkLogger" component={NetworkLogger} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

/**
 * Root App component with SDK provider
 */
const App = () => {
  React.useEffect(() => {
    const subscription = RNShake.addListener(() => {
      rootNavigationRef.current.navigate('NetworkLogger');
    });

    return () => {
      // Your code here...
      subscription.remove();
    };
  }, []);

  const { location } = locationStore();
  return (
    <PassgageAccessProvider
      baseURL={API_BASE_URL}
      // Azure AD: pass the id_token here (read once, when the provider
      // mounts), or call loginWithAzure yourself as LoginScreen does.
      // msalToken={idToken}
      onUnauthorized={error => {
        // Called when there is no stored session at startup, when the Azure
        // login of the provider fails, and when a session could not be
        // refreshed. The navigator already shows the login screen then
        // (authStatus is false); this is the place for a message.
        console.log('Unauthorized:', error.message);
      }}
      getLocationErrorCallback={error => {
        // error.code === 1: the location permission was not granted
        console.log('Location error:', error);
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 60,
          right: 10,
          backgroundColor: 'red',
          zIndex: 1000,
        }}
      >
        <Text>{`LONG:${location?.longitude} \n LAT:${location?.latitude}`}</Text>
      </View>
      <AppNavigator />
    </PassgageAccessProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default App;
