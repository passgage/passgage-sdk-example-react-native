import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator} from 'react-native';
import {usePassgageNFCScanner} from '@passgage/sdk-react-native';

export default function NFCScannerScreen() {
  const [nfcCode, setNfcCode] = useState('');
  const {validateNFC, isLoading} = usePassgageNFCScanner();

  const handleScan = async () => {
    if (!nfcCode.trim()) {
      Alert.alert('Error', 'Please enter an NFC code');
      return;
    }

    const result = await validateNFC({
      nfcCode: nfcCode.trim(),
      device: {
        id: 'demo-device',
        name: 'Demo Device',
      },
    });

    if (result.success) {
      Alert.alert('Success', `Access granted! Entrance ID: ${result.data.entrance.id}`);
      setNfcCode('');
    } else {
      Alert.alert('Failed', result.error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>💳</Text>
        <Text style={styles.title}>NFC Card Scanner</Text>
        <Text style={styles.description}>
          Enter an NFC card code to validate access
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter NFC code"
            value={nfcCode}
            onChangeText={setNfcCode}
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
            <Text style={styles.buttonText}>Validate NFC Card</Text>
          )}
        </TouchableOpacity>

        <View style={styles.info}>
          <Text style={styles.infoText}>
            💡 In a real app, you would use react-native-nfc-manager to scan NFC cards
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
    backgroundColor: '#FF9500',
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
    backgroundColor: '#fff3e0',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#FF9500',
    textAlign: 'center',
  },
});
