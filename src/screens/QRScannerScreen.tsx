import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator} from 'react-native';
import {usePassgageQRScanner} from '@passgage/sdk-react-native';

export default function QRScannerScreen() {
  const [qrCode, setQrCode] = useState('');
  const {scan, isLoading} = usePassgageQRScanner();

  const handleScan = async () => {
    if (!qrCode.trim()) {
      Alert.alert('Error', 'Please enter a QR code');
      return;
    }

    try {
      await scan(qrCode.trim());
      Alert.alert('Success', 'QR code validated successfully!');
      setQrCode('');
    } catch (error: any) {
      Alert.alert('Failed', error.message || 'QR validation failed');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>📱</Text>
        <Text style={styles.title}>QR Code Scanner</Text>
        <Text style={styles.description}>
          Enter a QR code to validate access
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter QR code"
            value={qrCode}
            onChangeText={setQrCode}
            autoCapitalize="none"
            editable={!isLoading}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleScan}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Validate QR Code</Text>
          )}
        </TouchableOpacity>

        <View style={styles.info}>
          <Text style={styles.infoText}>
            💡 In a real app, you would use react-native-vision-camera to scan QR codes with the camera
          </Text>
        </View>
      </View>
    </View>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#e8f4ff',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#007AFF',
    textAlign: 'center',
  },
});
