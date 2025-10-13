import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator} from 'react-native';
import {usePassgageNFCScanner} from '@passgage/sdk-react-native';

export default function NFCScannerScreen() {
  const [lastScanResult, setLastScanResult] = useState<string | null>(null);

  const {startScanning, stopScanning, isScanning, error} = usePassgageNFCScanner({
    onSuccess: (entrance) => {
      const message = `Access granted!\nEntrance ID: ${entrance?.id || 'N/A'}`;
      setLastScanResult(message);
      Alert.alert('Success', message);
    },
    onError: (error) => {
      const errorMessage = error.message || 'NFC validation failed';
      setLastScanResult(`Error: ${errorMessage}`);
      Alert.alert('Failed', errorMessage);
    },
  });

  const handleStartScan = async () => {
    setLastScanResult(null);
    try {
      await startScanning();
    } catch (error: any) {
      console.error('NFC scan error:', error);
    }
  };

  const handleStopScan = async () => {
    try {
      await stopScanning();
    } catch (error: any) {
      console.error('Stop NFC scan error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>💳</Text>
        <Text style={styles.title}>NFC Card Scanner</Text>
        <Text style={styles.description}>
          {isScanning
            ? 'Hold your device near an NFC card'
            : 'Tap the button below to start scanning'}
        </Text>

        <View style={styles.scanStatus}>
          {isScanning ? (
            <>
              <ActivityIndicator size="large" color="#FF9500" />
              <Text style={styles.statusText}>Scanning for NFC cards...</Text>
            </>
          ) : (
            <View style={styles.readyIndicator}>
              <Text style={styles.readyText}>Ready to scan</Text>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          {!isScanning ? (
            <TouchableOpacity
              style={[styles.button, styles.scanButton]}
              onPress={handleStartScan}>
              <Text style={styles.buttonText}>Start NFC Scan</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={handleStopScan}>
              <Text style={styles.buttonText}>Stop Scanning</Text>
            </TouchableOpacity>
          )}
        </View>

        {lastScanResult && (
          <View style={[
            styles.resultContainer,
            lastScanResult.startsWith('Error') ? styles.errorResult : styles.successResult
          ]}>
            <Text style={[
              styles.resultText,
              lastScanResult.startsWith('Error') ? styles.errorText : styles.successText
            ]}>
              {lastScanResult}
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {error.message}
            </Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <Text style={styles.infoText}>
            1. Tap "Start NFC Scan" button{'\n'}
            2. Hold your device near an NFC card{'\n'}
            3. Wait for validation response{'\n'}
            4. Access will be granted if authorized
          </Text>
          <Text style={styles.infoNote}>
            {'\n'}💡 Make sure NFC is enabled in your device settings
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
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  scanStatus: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FF9500',
    borderStyle: 'dashed',
  },
  statusText: {
    marginTop: 15,
    fontSize: 16,
    color: '#FF9500',
    fontWeight: '600',
  },
  readyIndicator: {
    padding: 20,
  },
  readyText: {
    fontSize: 18,
    color: '#999',
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButton: {
    backgroundColor: '#FF9500',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    width: '100%',
    marginBottom: 20,
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
  errorContainer: {
    width: '100%',
    padding: 12,
    backgroundColor: '#fee',
    borderRadius: 8,
    marginBottom: 20,
  },
  info: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF9500',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  infoNote: {
    fontSize: 13,
    color: '#FF9500',
    fontStyle: 'italic',
  },
});
