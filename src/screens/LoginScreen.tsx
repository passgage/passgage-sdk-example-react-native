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
  TextInput,
} from 'react-native';
import { useAuthStore } from '@passgage/sdk-react-native';
import { authorize } from 'react-native-app-auth';

/**
 * Two ways to sign in. Use the one your company is set up for:
 * - Email or phone number + password: useAuthStore().login
 * - Azure AD: get an id_token (here with react-native-app-auth) and pass it
 *   to useAuthStore().loginWithAzure, or to the provider as msalToken.
 *
 * Either way the session is stored on the device and restored on the next
 * start, so the user signs in once.
 */
const LoginScreen = () => {
  const { loading, error, login, loginWithAzure, clearError } = useAuthStore();
  const [userLogin, setUserLogin] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Do not show the error of an earlier attempt
    clearError();
  }, [clearError]);

  const handlePasswordLogin = () => {
    login(
      { login: userLogin.trim(), password },
      // On success authStatus becomes true and App.tsx shows the home screen
      () => setPassword(''),
      // The message the API sent, for example for a wrong password.
      // It is also in useAuthStore().error, shown below.
      message => console.log('Login failed:', message),
    );
  };

  const handleAzureLogin = async () => {
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
        loginWithAzure(
          { id_token: result.idToken },
          undefined,
          message => console.log('Azure login failed:', message),
        );
      } else {
        Alert.alert('Login Failed', 'No ID token received');
      }
    } catch (authError) {
      // The user closed the Microsoft sign-in page, or it failed
      console.log('Azure sign-in was not completed:', authError);
    }
  };

  const canSubmit = userLogin.trim().length > 0 && password.length > 0;

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

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email or phone number</Text>
            <TextInput
              style={styles.input}
              value={userLogin}
              onChangeText={setUserLogin}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="username"
              editable={!loading}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              editable={!loading}
              onSubmitEditing={canSubmit ? handlePasswordLogin : undefined}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              (loading || !canSubmit) && styles.buttonDisabled,
            ]}
            onPress={handlePasswordLogin}
            disabled={loading || !canSubmit}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.separator}>or</Text>

          <TouchableOpacity
            style={[
              styles.button,
              styles.azureButton,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleAzureLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Sign in with Microsoft</Text>
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
  azureButton: {
    backgroundColor: '#2F2F2F',
  },
  separator: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 12,
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
