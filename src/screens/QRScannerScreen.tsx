import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { usePassgageQRScanner } from '@passgage/sdk-react-native';

export default function QRScannerScreen() {
  const [qrCode, setQrCode] = useState('c70fc3a2-fbfb-4ca6-adcb-71ac0b796836');
  const [lastScanResult, setLastScanResult] = useState<string | null>(null);

  const { scan, isLoading } = usePassgageQRScanner({
    options: { skipLocationCheck: false, skipRepetitiveCheck: false },
    onSuccess: entrance => {
      const message = `Access granted!\nEntrance ID: ${entrance?.id || 'N/A'}`;
      setLastScanResult(message);
      Alert.alert('Success', message);
    },
    onError: error => {
      const errorMessage = error.message || 'QR validation failed';
      setLastScanResult(`Error: ${errorMessage}`);
      Alert.alert('Failed', errorMessage);
    },
  });

  const handleScan = async () => {
    if (!qrCode.trim()) {
      Alert.alert('Error', 'Please enter a QR code');
      return;
    }

    setLastScanResult(null);

    try {
      await scan(qrCode.trim());
    } catch (error: any) {
      // Error already handled by onError callback
      console.error('QR scan error:', error);
    }
  };

  const handleClear = () => {
    setQrCode('');
    setLastScanResult(null);
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
            returnKeyType="done"
            onSubmitEditing={handleScan}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.scanButton,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleScan}
            disabled={isLoading || !qrCode.trim()}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Validate QR Code</Text>
            )}
          </TouchableOpacity>

          {qrCode.trim() && !isLoading && (
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={handleClear}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {lastScanResult && (
          <View
            style={[
              styles.resultContainer,
              lastScanResult.startsWith('Error')
                ? styles.errorResult
                : styles.successResult,
            ]}
          >
            <Text
              style={[
                styles.resultText,
                lastScanResult.startsWith('Error')
                  ? styles.errorText
                  : styles.successText,
              ]}
            >
              {lastScanResult}
            </Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.infoText}>
            💡 In a real app, you would use react-native-vision-camera to scan
            QR codes with the camera
          </Text>
          <Text style={styles.infoText}>
            {'\n'}For testing, you can enter any QR code value manually
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
  buttonContainer: {
    width: '100%',
    gap: 10,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButton: {
    backgroundColor: '#007AFF',
  },
  clearButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    width: '100%',
    marginTop: 20,
    padding: 15,
    borderRadius: 8,
  },
  successResult: {
    backgroundColor: '#d4edda',
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  errorResult: {
    backgroundColor: '#f8d7da',
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  resultText: {
    fontSize: 14,
    textAlign: 'center',
  },
  successText: {
    color: '#155724',
  },
  errorText: {
    color: '#721c24',
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
