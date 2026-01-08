/**
 * Passgage Access SDK - Example App
 *
 * This is a demonstration app showing how to integrate and use the Passgage Access SDK
 * in your React Native application.
 */

import React from 'react';
import { NavigationContainer, useLocale } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Alert, ActivityIndicator, View, StyleSheet, Text } from 'react-native';
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

const origLog = console.log;
console.log = (...args) => {
  origLog(...args);
};

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
  const authStore = useAuthStore();
  const { authStatus, loading } = authStore;

  // Show loading while checking authentication
  if (loading) {
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

  // ✅ TEST: SDK başarıyla import edildi!
  console.log('🚀 Passgage SDK Example App Started!');
  console.log('📦 SDK Provider initialized with baseURL:', API_BASE_URL);
  const { location } = locationStore();
  return (
    <PassgageAccessProvider
      // msalToken={`eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlBjWDk4R1g0MjBUMVg2c0JEa3poUW1xZ3dNVSJ9.eyJhdWQiOiI1ZjEzYWZjYy05NGEzLTRhZDUtOWUxOC0zODU0ZGU5YTNjYmIiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vNGE5OWZmMzItMDM3OC00Y2U0LWI3ZDctMDRlZjFmMzZjYWY5L3YyLjAiLCJpYXQiOjE3Njc2NDExNzIsIm5iZiI6MTc2NzY0MTE3MiwiZXhwIjoxNzY3NjQ1MDcyLCJhaW8iOiJBWVFBZS84YUFBQUFqeTNvWlN5ZndWSGlPZ0xIRENjY3pMM2FiWGdDMHpqQWROVU5CZXIyRmFac2gyQjdYRDhBajZJNXdreElWakJpYXFqc2JFb3ZlRTNZRXBNQVNYQ2QweUFnM3dJSVR1VW8yOGo1S3gyakEzUlo4UGg4cFNrd1ZjWmp1NEJLT3B3Q0lrN2djQlZDSlRPTEt0ZHYyMytEWndnZlE5MXM1YW5WaVgvYVI0ejlSbk09IiwibmFtZSI6IlRlc3QgVXNlciAyIiwib2lkIjoiMmQ3NWNkNTEtMTY0NC00N2YyLTgxMDUtMTk4ZWM4ZjdjNTY1IiwicHJlZmVycmVkX3VzZXJuYW1lIjoidGVzdDJAcGFzc2dhZ2UuY29tIiwicmgiOiIxLkFhNEFNdi1aU25nRDVFeTMxd1R2SHpiSy1jeXZFMS1qbE5WS25oZzRWTjZhUEx1ckFGaXVBQS4iLCJzaWQiOiIwMDBmZTY2YS1hNGM5LWQ4NTctNmFiYS04ZDIzOTE5NGM0ZGQiLCJzdWIiOiJGaHk3TVBsbnVMcDQwSkwwZzlZZzJfelVSVjN2eTZ1WFFPWFlGb2FRMEZVIiwidGlkIjoiNGE5OWZmMzItMDM3OC00Y2U0LWI3ZDctMDRlZjFmMzZjYWY5IiwidXRpIjoiR1o4c3pMb3VEVU8yZ1R2cE5neE9BZyIsInZlciI6IjIuMCJ9.G-MgPS_SGYfoEGkgn-7_AtPIsVrnMISpRqac-WQCAf9PeTf2n9wpgE1LslXCocMUIuqADmpaNJbvv5mOFqXVQ6VaDpMvefbshPlK1cJEOClhSf0MIUn1rSKkes5zJqJfoCupHlqwqij_JjK4BkPE8jjIXsFkWKyaK3RBWRtRyhhqW3QlBXAoQmUfmwQZ7Vc67SjhAG9u8RMUaqL3G5qpLMFFx_Iarls5dxBYiCviaAc73LXCmO9WtIsCj2Gk6hmaMNh37We5rLpGaHceS_OwWfo7IBHGqKu7CiRa3jlzhLlXMP94HXdoKsmRPTYfNr3X1a-SwSln4uKiGzuRGzc-Rg`}
      baseURL={API_BASE_URL}
      rememberUser={false}
      onUnauthorized={() => {
        // Handle unauthorized access
        // This will be called if token refresh fails
        console.log('⚠️ Session Expired - Token refresh failed');
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
        );
      }}
      msalToken={
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IlBjWDk4R1g0MjBUMVg2c0JEa3poUW1xZ3dNVSJ9.eyJhdWQiOiI1ZjEzYWZjYy05NGEzLTRhZDUtOWUxOC0zODU0ZGU5YTNjYmIiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vNGE5OWZmMzItMDM3OC00Y2U0LWI3ZDctMDRlZjFmMzZjYWY5L3YyLjAiLCJpYXQiOjE3Njc4MjQ3MjgsIm5iZiI6MTc2NzgyNDcyOCwiZXhwIjoxNzY3ODI4NjI4LCJhaW8iOiJBVlFBcS84YUFBQUE3ZlFyMXlYK1ROK0xCSmFXSlRKaWk3b1VsTzdXWGdGcE1ZUTd2cG5scWtGdUcwRnF0dW9PcDNod1RvdWUxRHRzbFVEU3A4SDB0V214d1FYaVp5MkRZSzhLNXpWenIrTUhEa1d3REppY09LYz0iLCJuYW1lIjoiVGVzdCBVc2VyIDIiLCJub25jZSI6IktDaUJ3RFV3ZXFORVdfSHMwM0tGU0swSlpVdVBOcnJtcXMxaXNnOVlBOHciLCJvaWQiOiIyZDc1Y2Q1MS0xNjQ0LTQ3ZjItODEwNS0xOThlYzhmN2M1NjUiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJ0ZXN0MkBwYXNzZ2FnZS5jb20iLCJyaCI6IjEuQWE0QU12LVpTbmdENUV5MzF3VHZIemJLLWN5dkUxLWpsTlZLbmhnNFZONmFQTHVyQUZpdUFBLiIsInNpZCI6IjAwMTA1YjlhLTBkMzYtODU1Yi01MzJhLTIxNDFjNTQ3ZThjMyIsInN1YiI6IkZoeTdNUGxudUxwNDBKTDBnOVlnMl96VVJWM3Z5NnVYUU9YWUZvYVEwRlUiLCJ0aWQiOiI0YTk5ZmYzMi0wMzc4LTRjZTQtYjdkNy0wNGVmMWYzNmNhZjkiLCJ1dGkiOiJwSkFreGdkSjdFbVJDQWFfV3h2NUFnIiwidmVyIjoiMi4wIn0.SrqF8o6MZDTV3oRA0SqSQqThyMtHqNgO73bjV_rp757pA4zCJMstIsx52QVJ1ejYCmSd4gwALqDSHxiXLK2MuJ21C3oRw4FEuoox0i1b-3KE-fuwDphRmEu8nXbmAXQ6jzL0iJJQx1v0pa3BQqOrxJ4NUkQDCPW1hhKRC2c7_dtKbnoYLRKbD5OlazdaxCMdzPYIgj4iWo4c27iMouFPaf-OOaOd2w-GR6GYil7o_34Ba7P06OMgcwzLcPCUJSEZplHunav8pH8HcJMpqRlq8dzA1_Mx7zNgVZFFNHnllwiTcpaIt6dUFUlRZ4YUq9IkZPIdRCiO2O-VxZ59j__D4g'
      }
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
