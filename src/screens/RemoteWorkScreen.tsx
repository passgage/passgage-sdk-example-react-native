import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView} from 'react-native';
import {usePassgageRemoteWork, usePassgageAuth} from '@passgage-sdk/react-native';

export default function RemoteWorkScreen() {
  const {user} = usePassgageAuth();
  const {logEntry, logExit, isLoading} = usePassgageRemoteWork();
  const [description, setDescription] = useState('');

  const handleLogEntry = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    const result = await logEntry({
      userId: user.id,
      description: description.trim() || undefined,
    });

    if (result.success) {
      Alert.alert('Success', 'Work entry logged successfully');
      setDescription('');
    } else {
      Alert.alert('Failed', result.error);
    }
  };

  const handleLogExit = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    const result = await logExit({
      userId: user.id,
      description: description.trim() || undefined,
    });

    if (result.success) {
      Alert.alert('Success', 'Work exit logged successfully');
      setDescription('');
    } else {
      Alert.alert('Failed', result.error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>🏠</Text>
        <Text style={styles.title}>Remote Work Logging</Text>
        <Text style={styles.description}>
          Log your remote work entry and exit times
        </Text>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Working from home"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              editable={!isLoading}
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.entryButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogEntry}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.buttonIcon}>▶️</Text>
                  <Text style={styles.buttonText}>Start Work</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.exitButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogExit}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.buttonIcon}>⏸️</Text>
                  <Text style={styles.buttonText}>End Work</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>ℹ️ How it works</Text>
            <Text style={styles.infoText}>
              • <Text style={styles.infoBold}>Start Work:</Text> Log when you begin working remotely
            </Text>
            <Text style={styles.infoText}>
              • <Text style={styles.infoBold}>End Work:</Text> Log when you finish working
            </Text>
            <Text style={styles.infoText}>
              • Timestamps are recorded automatically
            </Text>
            <Text style={styles.infoText}>
              • Description is optional but recommended
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  icon: {
    fontSize: 80,
    marginTop: 20,
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
  },
  formContainer: {
    width: '100%',
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
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  actionButton: {
    flex: 1,
    height: 100,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  entryButton: {
    backgroundColor: '#34C759',
  },
  exitButton: {
    backgroundColor: '#FF3B30',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#e8f4ff',
    borderRadius: 12,
    padding: 15,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: '600',
  },
});
