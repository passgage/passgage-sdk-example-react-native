# Remote Work Logging

The Remote Work feature allows employees to log their work start and end times when working remotely.

## Table of Contents

- [Overview](#overview)
- [usePassgageRemoteWork Hook](#usepassgageremotework-hook)
- [Basic Usage](#basic-usage)
- [Advanced Examples](#advanced-examples)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Overview

The Remote Work feature enables:

1. Logging work entry (start time) when beginning remote work
2. Logging work exit (end time) when finishing remote work
3. Optional descriptions for each log entry
4. Automatic timestamp recording
5. Integration with company attendance tracking

```
User → Log Entry/Exit → Backend Validates → Record Created → Time Tracked
```

## usePassgageRemoteWork Hook

### API Reference

```typescript
interface UsePassgageRemoteWorkReturn {
  logEntry: (params: RemoteWorkEntryParams) => Promise<RemoteWorkResult>;
  logExit: (params: RemoteWorkExitParams) => Promise<RemoteWorkResult>;
  isLoading: boolean;
  error: Error | null;
}

interface RemoteWorkEntryParams {
  userId: string;
  description?: string;
}

interface RemoteWorkExitParams {
  userId: string;
  description?: string;
}

interface RemoteWorkResult {
  success: boolean;
  data?: RemoteWorkRecord;
  error?: string;
}

interface RemoteWorkRecord {
  id: string;
  userId: string;
  type: 'entry' | 'exit';
  timestamp: string;
  description?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}
```

### Return Values

- `logEntry(params)`: Log start of remote work
- `logExit(params)`: Log end of remote work
- `isLoading`: Whether an operation is in progress
- `error`: Any error that occurred

## Basic Usage

### Simple Remote Work Logger

```typescript
import React, {useState} from 'react';
import {View, Button, Text, Alert} from 'react-native';
import {usePassgageRemoteWork, usePassgageAuth} from '@passgage/sdk-react-native';

export default function RemoteWorkScreen() {
  const {user} = usePassgageAuth();
  const {logEntry, logExit, isLoading} = usePassgageRemoteWork();

  const handleStartWork = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please login first');
      return;
    }

    const result = await logEntry({
      userId: user.id,
    });

    if (result.success) {
      Alert.alert('Success', 'Work entry logged');
    } else {
      Alert.alert('Error', result.error || 'Failed to log entry');
    }
  };

  const handleEndWork = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please login first');
      return;
    }

    const result = await logExit({
      userId: user.id,
    });

    if (result.success) {
      Alert.alert('Success', 'Work exit logged');
    } else {
      Alert.alert('Error', result.error || 'Failed to log exit');
    }
  };

  return (
    <View style={{padding: 20}}>
      <Text style={{fontSize: 24, marginBottom: 20}}>
        Remote Work
      </Text>

      <Button
        title={isLoading ? 'Logging...' : 'Start Work'}
        onPress={handleStartWork}
        disabled={isLoading}
      />

      <View style={{height: 20}} />

      <Button
        title={isLoading ? 'Logging...' : 'End Work'}
        onPress={handleEndWork}
        disabled={isLoading}
      />
    </View>
  );
}
```

### With Description Field

```typescript
import React, {useState} from 'react';
import {View, TextInput, Button, Text, Alert} from 'react-native';
import {usePassgageRemoteWork, usePassgageAuth} from '@passgage/sdk-react-native';

export default function RemoteWorkScreen() {
  const {user} = usePassgageAuth();
  const {logEntry, logExit, isLoading} = usePassgageRemoteWork();
  const [description, setDescription] = useState('');

  const handleStartWork = async () => {
    const result = await logEntry({
      userId: user.id,
      description: description.trim() || undefined,
    });

    if (result.success) {
      Alert.alert('Success', 'Work started');
      setDescription(''); // Clear description
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleEndWork = async () => {
    const result = await logExit({
      userId: user.id,
      description: description.trim() || undefined,
    });

    if (result.success) {
      Alert.alert('Success', 'Work ended');
      setDescription(''); // Clear description
    } else {
      Alert.alert('Error', result.error);
    }
  };

  return (
    <View style={{padding: 20}}>
      <Text style={{fontSize: 18, marginBottom: 10}}>
        Description (Optional)
      </Text>

      <TextInput
        style={{
          height: 80,
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 8,
          padding: 10,
          marginBottom: 20,
        }}
        placeholder="e.g., Working from home"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        editable={!isLoading}
      />

      <Button
        title="Start Work"
        onPress={handleStartWork}
        disabled={isLoading}
      />

      <View style={{height: 10}} />

      <Button
        title="End Work"
        onPress={handleEndWork}
        disabled={isLoading}
      />
    </View>
  );
}
```

## Advanced Examples

### With Status Display

```typescript
import React, {useState} from 'react';
import {View, Button, Text, StyleSheet} from 'react-native';
import {usePassgageRemoteWork, usePassgageAuth} from '@passgage/sdk-react-native';

type WorkStatus = 'idle' | 'working' | 'finished';

export default function RemoteWorkScreen() {
  const {user} = usePassgageAuth();
  const {logEntry, logExit, isLoading} = usePassgageRemoteWork();
  const [status, setStatus] = useState<WorkStatus>('idle');
  const [startTime, setStartTime] = useState<Date | null>(null);

  const handleStartWork = async () => {
    const result = await logEntry({userId: user.id});

    if (result.success) {
      setStatus('working');
      setStartTime(new Date());
      Alert.alert('Success', 'Work started');
    }
  };

  const handleEndWork = async () => {
    const result = await logExit({userId: user.id});

    if (result.success) {
      setStatus('finished');
      Alert.alert('Success', 'Work ended');

      // Reset after showing status
      setTimeout(() => {
        setStatus('idle');
        setStartTime(null);
      }, 3000);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.statusCard,
        status === 'working' && styles.workingStatus,
        status === 'finished' && styles.finishedStatus,
      ]}>
        <Text style={styles.statusText}>
          {status === 'idle' && 'Not Working'}
          {status === 'working' && '🟢 Working...'}
          {status === 'finished' && '✅ Work Completed'}
        </Text>

        {status === 'working' && startTime && (
          <Text style={styles.timeText}>
            Started at {startTime.toLocaleTimeString()}
          </Text>
        )}
      </View>

      <View style={styles.buttons}>
        <Button
          title="▶️ Start Work"
          onPress={handleStartWork}
          disabled={isLoading || status === 'working'}
        />

        <View style={{height: 15}} />

        <Button
          title="⏸️ End Work"
          onPress={handleEndWork}
          disabled={isLoading || status !== 'working'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    marginBottom: 30,
  },
  workingStatus: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
  },
  finishedStatus: {
    backgroundColor: '#d1ecf1',
    borderColor: '#bee5eb',
    borderWidth: 1,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  buttons: {
    flex: 1,
    justifyContent: 'center',
  },
});
```

### With Timer Display

```typescript
const [isWorking, setIsWorking] = useState(false);
const [startTime, setStartTime] = useState<Date | null>(null);
const [elapsedTime, setElapsedTime] = useState('00:00:00');

useEffect(() => {
  let interval: NodeJS.Timeout;

  if (isWorking && startTime) {
    interval = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - startTime.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setElapsedTime(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }, 1000);
  }

  return () => {
    if (interval) clearInterval(interval);
  };
}, [isWorking, startTime]);

const handleStartWork = async () => {
  const result = await logEntry({userId: user.id});

  if (result.success) {
    setIsWorking(true);
    setStartTime(new Date());
  }
};

const handleEndWork = async () => {
  const result = await logExit({userId: user.id});

  if (result.success) {
    setIsWorking(false);
    Alert.alert('Work Complete', `Total time: ${elapsedTime}`);
    setStartTime(null);
    setElapsedTime('00:00:00');
  }
};

// In render:
{isWorking && (
  <View style={styles.timerContainer}>
    <Text style={styles.timerLabel}>Time Worked</Text>
    <Text style={styles.timerValue}>{elapsedTime}</Text>
  </View>
)}
```

### With Confirmation Dialogs

```typescript
const handleStartWork = () => {
  Alert.alert(
    'Start Work',
    'Log your work entry now?',
    [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Start',
        onPress: async () => {
          const result = await logEntry({userId: user.id});
          if (result.success) {
            Alert.alert('Success', 'Work started');
          }
        },
      },
    ]
  );
};

const handleEndWork = () => {
  Alert.alert(
    'End Work',
    'Log your work exit now?',
    [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'End',
        style: 'destructive',
        onPress: async () => {
          const result = await logExit({userId: user.id});
          if (result.success) {
            Alert.alert('Success', 'Work ended');
          }
        },
      },
    ]
  );
};
```

### With Work History

```typescript
interface WorkLog {
  id: string;
  type: 'entry' | 'exit';
  timestamp: string;
  description?: string;
}

const [workHistory, setWorkHistory] = useState<WorkLog[]>([]);

const handleStartWork = async () => {
  const result = await logEntry({
    userId: user.id,
    description: description.trim() || undefined,
  });

  if (result.success && result.data) {
    // Add to local history
    setWorkHistory([
      {
        id: result.data.id,
        type: 'entry',
        timestamp: result.data.timestamp,
        description: description.trim(),
      },
      ...workHistory,
    ]);

    Alert.alert('Success', 'Work started');
  }
};

// Display history
<FlatList
  data={workHistory}
  renderItem={({item}) => (
    <View style={styles.historyItem}>
      <Text style={styles.historyType}>
        {item.type === 'entry' ? '▶️ Started' : '⏸️ Ended'}
      </Text>
      <Text style={styles.historyTime}>
        {new Date(item.timestamp).toLocaleString()}
      </Text>
      {item.description && (
        <Text style={styles.historyDescription}>
          {item.description}
        </Text>
      )}
    </View>
  )}
  keyExtractor={(item) => item.id}
  ListHeaderComponent={<Text style={styles.historyTitle}>Today's Logs</Text>}
/>
```

## Error Handling

### Common Error Scenarios

```typescript
const handleStartWork = async () => {
  try {
    const result = await logEntry({userId: user.id});

    if (!result.success) {
      switch (result.error) {
        case 'Already working':
          Alert.alert(
            'Error',
            'You already have an active work session'
          );
          break;

        case 'Outside working hours':
          Alert.alert(
            'Error',
            'Remote work logging is only allowed during working hours'
          );
          break;

        case 'Remote work not enabled':
          Alert.alert(
            'Error',
            'Your account does not have remote work enabled. Please contact HR.'
          );
          break;

        case 'Overlapping session':
          Alert.alert(
            'Error',
            'You have another work session at this time'
          );
          break;

        default:
          Alert.alert('Error', result.error || 'Failed to log entry');
      }
    }
  } catch (error: any) {
    Alert.alert('Error', error.message || 'An error occurred');
  }
};
```

### Network Error Handling

```typescript
import NetInfo from '@react-native-community/netinfo';

const handleStartWork = async () => {
  // Check network connectivity
  const netInfo = await NetInfo.fetch();

  if (!netInfo.isConnected) {
    Alert.alert(
      'No Internet',
      'Remote work logging requires an internet connection'
    );
    return;
  }

  const result = await logEntry({userId: user.id});

  if (result.success) {
    Alert.alert('Success', 'Work started');
  } else {
    Alert.alert('Error', result.error);
  }
};
```

## Best Practices

### 1. User Validation

Always validate user authentication before logging:

```typescript
const {user} = usePassgageAuth();

const handleStartWork = async () => {
  if (!user?.id) {
    Alert.alert('Error', 'Please login first');
    navigation.navigate('Login');
    return;
  }

  await logEntry({userId: user.id});
};
```

### 2. Prevent Double Logging

Prevent multiple simultaneous log attempts:

```typescript
const {isLoading} = usePassgageRemoteWork();

const handleStartWork = async () => {
  if (isLoading) {
    console.log('Operation already in progress');
    return;
  }

  await logEntry({userId: user.id});
};

// In render:
<Button
  title="Start Work"
  onPress={handleStartWork}
  disabled={isLoading}
/>
```

### 3. Provide Clear Feedback

```typescript
const [lastAction, setLastAction] = useState<{
  type: 'entry' | 'exit';
  time: string;
} | null>(null);

const handleStartWork = async () => {
  const result = await logEntry({userId: user.id});

  if (result.success) {
    const now = new Date().toLocaleTimeString();
    setLastAction({type: 'entry', time: now});
    Alert.alert('Success', 'Work entry logged successfully');
  }
};

// Display last action
{lastAction && (
  <View style={styles.lastAction}>
    <Text>Last Action:</Text>
    <Text>
      {lastAction.type === 'entry' ? '▶️ Started' : '⏸️ Ended'}
      {' at '}
      {lastAction.time}
    </Text>
  </View>
)}
```

### 4. Log Entry Details

Log actions for debugging and audit:

```typescript
const handleStartWork = async () => {
  console.log('[RemoteWork] Logging entry:', {
    userId: user.id,
    timestamp: new Date().toISOString(),
  });

  const result = await logEntry({userId: user.id});

  if (result.success) {
    console.log('[RemoteWork] Entry logged:', result.data);
  } else {
    console.error('[RemoteWork] Entry failed:', result.error);
  }
};
```

### 5. Persist Work State

Save work state locally to survive app restarts:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const WORK_STATE_KEY = '@work_state';

const saveWorkState = async (isWorking: boolean, startTime?: Date) => {
  await AsyncStorage.setItem(
    WORK_STATE_KEY,
    JSON.stringify({isWorking, startTime: startTime?.toISOString()})
  );
};

const loadWorkState = async () => {
  const state = await AsyncStorage.getItem(WORK_STATE_KEY);
  if (state) {
    const {isWorking, startTime} = JSON.parse(state);
    setIsWorking(isWorking);
    if (startTime) {
      setStartTime(new Date(startTime));
    }
  }
};

// Load on mount
useEffect(() => {
  loadWorkState();
}, []);

// Save on state change
useEffect(() => {
  if (isWorking) {
    saveWorkState(true, startTime);
  } else {
    saveWorkState(false);
  }
}, [isWorking, startTime]);
```

## Integration Examples

### With Daily Summary

```typescript
interface DailySummary {
  date: string;
  totalHours: number;
  entries: number;
  exits: number;
}

const [todaySummary, setTodaySummary] = useState<DailySummary>({
  date: new Date().toLocaleDateString(),
  totalHours: 0,
  entries: 0,
  exits: 0,
});

const updateSummary = (type: 'entry' | 'exit') => {
  setTodaySummary(prev => ({
    ...prev,
    entries: type === 'entry' ? prev.entries + 1 : prev.entries,
    exits: type === 'exit' ? prev.exits + 1 : prev.exits,
  }));
};

// In render:
<View style={styles.summary}>
  <Text style={styles.summaryTitle}>Today's Summary</Text>
  <Text>Entries: {todaySummary.entries}</Text>
  <Text>Exits: {todaySummary.exits}</Text>
  <Text>Total Hours: {todaySummary.totalHours.toFixed(2)}</Text>
</View>
```

### With Notifications

```typescript
import PushNotification from 'react-native-push-notification';

const scheduleEndWorkReminder = () => {
  PushNotification.localNotificationSchedule({
    message: 'Don't forget to log your work exit',
    date: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
  });
};

const handleStartWork = async () => {
  const result = await logEntry({userId: user.id});

  if (result.success) {
    scheduleEndWorkReminder();
    Alert.alert('Success', 'Work started');
  }
};
```

## Next Steps

- [Check-In](./check-in.md) - Location-based attendance
- [Authentication](../authentication.md) - User authentication details
- [Error Handling](../error-handling.md) - Comprehensive error handling
- [Examples](../examples.md) - More complete examples
