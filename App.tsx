/**
 * Passgage Access SDK - Example App
 *
 * This is a demonstration app showing how to integrate and use the Passgage Access SDK
 * in your React Native application.
 */

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {PassgageAccessProvider, usePassgageAuth} from '@passgage-sdk/react-native';
import {Alert, ActivityIndicator, View, StyleSheet} from 'react-native';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
import NFCScannerScreen from './src/screens/NFCScannerScreen';
import CheckInScreen from './src/screens/CheckInScreen';
import RemoteWorkScreen from './src/screens/RemoteWorkScreen';

// Types
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  QRScanner: undefined;
  NFCScanner: undefined;
  CheckIn: undefined;
  RemoteWork: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Configuration - Replace with your actual Passgage API URL
const API_BASE_URL = process.env.PASSGAGE_API_URL || 'https://api.passgage.com';

/**
 * Main navigation component with auth check
 */
function AppNavigator() {
  const {isAuthenticated, isLoading} = usePassgageAuth({
    autoRestore: true, // Automatically restore authentication on app start
  });

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}>
        {!isAuthenticated ? (
          // Auth Stack - Show login screen
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              headerShown: false,
              animationTypeForReplace: 'pop',
            }}
          />
        ) : (
          // App Stack - Show main app screens
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{title: 'Passgage SDK Demo'}}
            />
            <Stack.Screen
              name="QRScanner"
              component={QRScannerScreen}
              options={{title: 'QR Scanner'}}
            />
            <Stack.Screen
              name="NFCScanner"
              component={NFCScannerScreen}
              options={{title: 'NFC Scanner'}}
            />
            <Stack.Screen
              name="CheckIn"
              component={CheckInScreen}
              options={{title: 'Check-In'}}
            />
            <Stack.Screen
              name="RemoteWork"
              component={RemoteWorkScreen}
              options={{title: 'Remote Work'}}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/**
 * Root App component with SDK provider
 */
function App(): JSX.Element {
  return (
    <PassgageAccessProvider
      baseURL={API_BASE_URL}
      onUnauthorized={() => {
        // Handle unauthorized access
        // This will be called if token refresh fails
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
        );
      }}
      onError={error => {
        // Handle global SDK errors
        console.error('Passgage SDK Error:', error);
      }}>
      <AppNavigator />
    </PassgageAccessProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default App;
