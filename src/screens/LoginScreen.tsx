import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '@passgage/sdk-react-native';
import { authorize } from 'react-native-app-auth';

const LoginScreen = () => {
  const { loading, error, loginWithAzure } = useAuthStore();

  const handleLogin = async () => {
    try {
      const result = await authorize({
        additionalParameters: { prompt: 'select_account' },
        serviceConfiguration: {
          authorizationEndpoint: `https://login.microsoftonline.com/4a99ff32-0378-4ce4-b7d7-04ef1f36caf9/oauth2/v2.0/authorize`,
          tokenEndpoint: `https://login.microsoftonline.com/4a99ff32-0378-4ce4-b7d7-04ef1f36caf9/oauth2/v2.0/token`,
        },
        clientId: '5f13afcc-94a3-4ad5-9e18-3854de9a3cbb',
        redirectUrl:
          Platform.OS === 'android'
            ? 'msauth://com.passgagesdkexample/7S3BCp7Q9Sa1Em%2FLqQ13AjoP5Lw%3D'
            : 'msauth.com.passgage.sdkexample://auth/',
        scopes: ['openid', 'profile', 'offline_access', 'User.Read'],
        iosPrefersEphemeralSession: true,
      });
      if (result?.idToken) {
        loginWithAzure({ id_token: result.idToken });
      } else {
        Alert.alert('Login Failed', 'No ID token received');
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🔐</Text>
          <Text style={styles.title}>Passgage SDK Demo</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <View style={styles.formContainer}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This is a demo app for Passgage Access SDK
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
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
  errorContainer: {
    backgroundColor: '#fee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorText: {
    color: '#c00',
    fontSize: 14,
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
  },
});
