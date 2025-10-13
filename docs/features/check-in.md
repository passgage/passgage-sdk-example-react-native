# Location-Based Check-In

The Check-In feature allows users to check in and check out from nearby company branches based on their geographic location.

## Table of Contents

- [Overview](#overview)
- [usePassgageCheckIn Hook](#usepassgagecheckin-hook)
- [Basic Usage](#basic-usage)
- [Advanced Examples](#advanced-examples)
- [Location Permissions](#location-permissions)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Overview

The Check-In feature enables employees to:

1. Discover nearby company branches within a specified radius
2. Check in when arriving at a branch location
3. Check out when leaving a branch location
4. Track attendance based on location

```
Get Location → Find Nearby Branches → Select Branch → Check In/Out → Record Created
```

## usePassgageCheckIn Hook

### API Reference

```typescript
interface UsePassgageCheckInReturn {
  getNearbyBranches: (params?: GetNearbyBranchesParams) => Promise<BranchResult>;
  checkInEntry: (params: CheckInEntryParams) => Promise<CheckInResult>;
  checkInExit: (params: CheckInExitParams) => Promise<CheckInResult>;
  isLoading: boolean;
  error: Error | null;
}

interface GetNearbyBranchesParams {
  radius?: number;      // Radius in meters (default: 5000)
  latitude?: number;    // Override automatic location
  longitude?: number;   // Override automatic location
}

interface CheckInEntryParams {
  branchId: string;
  userId: string;
  notes?: string;
}

interface CheckInExitParams {
  branchId: string;
  userId: string;
  notes?: string;
}

interface Branch {
  id: string;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number;    // Distance from user in meters
  openingTime?: string;
  closingTime?: string;
  isOpen?: boolean;
}

interface BranchResult {
  success: boolean;
  data?: Branch[];
  error?: string;
}

interface CheckInResult {
  success: boolean;
  data?: CheckInRecord;
  error?: string;
}

interface CheckInRecord {
  id: string;
  userId: string;
  branchId: string;
  type: 'entry' | 'exit';
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}
```

### Return Values

- `getNearbyBranches(params?)`: Get list of branches within radius
- `checkInEntry(params)`: Record entry at a branch
- `checkInExit(params)`: Record exit from a branch
- `isLoading`: Whether an operation is in progress
- `error`: Any error that occurred

## Basic Usage

### Simple Check-In Screen

```typescript
import React, {useEffect, useState} from 'react';
import {View, Text, Button, FlatList, Alert} from 'react-native';
import {usePassgageCheckIn, usePassgageAuth} from '@passgage/sdk-react-native';

export default function CheckInScreen() {
  const {user} = usePassgageAuth();
  const {getNearbyBranches, checkInEntry, checkInExit, isLoading} = usePassgageCheckIn();
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    const result = await getNearbyBranches({
      radius: 5000, // 5km radius
    });

    if (result.success && result.data) {
      setBranches(result.data);
    } else {
      Alert.alert('Error', result.error || 'Failed to load branches');
    }
  };

  const handleCheckIn = async (branchId: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'Please login first');
      return;
    }

    const result = await checkInEntry({
      branchId,
      userId: user.id,
    });

    if (result.success) {
      Alert.alert('Success', 'Checked in successfully');
    } else {
      Alert.alert('Error', result.error || 'Check-in failed');
    }
  };

  const handleCheckOut = async (branchId: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'Please login first');
      return;
    }

    const result = await checkInExit({
      branchId,
      userId: user.id,
    });

    if (result.success) {
      Alert.alert('Success', 'Checked out successfully');
    } else {
      Alert.alert('Error', result.error || 'Check-out failed');
    }
  };

  return (
    <FlatList
      data={branches}
      renderItem={({item}) => (
        <View style={{padding: 15, borderBottomWidth: 1}}>
          <Text style={{fontSize: 18, fontWeight: 'bold'}}>
            {item.title}
          </Text>
          <Text style={{color: '#666'}}>{item.address}</Text>
          {item.distance && (
            <Text style={{color: '#34C759'}}>
              📍 {Math.round(item.distance)}m away
            </Text>
          )}

          <View style={{flexDirection: 'row', marginTop: 10}}>
            <Button
              title="Check In"
              onPress={() => handleCheckIn(item.id)}
              disabled={isLoading}
            />
            <View style={{width: 10}} />
            <Button
              title="Check Out"
              onPress={() => handleCheckOut(item.id)}
              disabled={isLoading}
            />
          </View>
        </View>
      )}
      keyExtractor={(item) => item.id}
      refreshing={isLoading}
      onRefresh={loadBranches}
      ListEmptyComponent={
        <Text style={{padding: 20, textAlign: 'center'}}>
          No branches found nearby
        </Text>
      }
    />
  );
}
```

### With Pull-to-Refresh

```typescript
const [refreshing, setRefreshing] = useState(false);

const loadBranches = async () => {
  try {
    const result = await getNearbyBranches({radius: 5000});

    if (result.success && result.data) {
      setBranches(result.data);
      if (result.data.length === 0) {
        Alert.alert('No Branches', 'No branches found within 5km radius');
      }
    } else {
      Alert.alert('Error', result.error || 'Could not load branches');
    }
  } catch (error: any) {
    Alert.alert('Error', error.message || 'Failed to load branches');
  } finally {
    setRefreshing(false);
  }
};

<FlatList
  data={branches}
  renderItem={renderBranch}
  refreshing={refreshing}
  onRefresh={() => {
    setRefreshing(true);
    loadBranches();
  }}
/>
```

## Advanced Examples

### With Custom Radius

```typescript
const [radius, setRadius] = useState(5000); // 5km default

const loadBranches = async () => {
  const result = await getNearbyBranches({
    radius: radius, // Use selected radius
  });

  if (result.success) {
    setBranches(result.data || []);
  }
};

// In render:
<View style={{flexDirection: 'row'}}>
  <Button title="5km" onPress={() => setRadius(5000)} />
  <Button title="10km" onPress={() => setRadius(10000)} />
  <Button title="20km" onPress={() => setRadius(20000)} />
</View>
```

### With Manual Location

Override automatic location detection:

```typescript
const loadBranchesAtLocation = async (lat: number, lng: number) => {
  const result = await getNearbyBranches({
    latitude: lat,
    longitude: lng,
    radius: 5000,
  });

  if (result.success) {
    setBranches(result.data || []);
  }
};

// Example: Search branches near a specific address
await loadBranchesAtLocation(40.7128, -74.0060); // New York coordinates
```

### With Check-In Notes

```typescript
const [notes, setNotes] = useState('');

const handleCheckIn = async (branchId: string) => {
  const result = await checkInEntry({
    branchId,
    userId: user.id,
    notes: notes.trim() || undefined,
  });

  if (result.success) {
    Alert.alert('Success', 'Checked in successfully');
    setNotes(''); // Clear notes after success
  }
};

// In render:
<TextInput
  placeholder="Notes (optional)"
  value={notes}
  onChangeText={setNotes}
  multiline
/>
```

### Sorted by Distance

```typescript
const [branches, setBranches] = useState<Branch[]>([]);

const loadBranches = async () => {
  const result = await getNearbyBranches({radius: 10000});

  if (result.success && result.data) {
    // Sort by distance (closest first)
    const sorted = [...result.data].sort((a, b) => {
      return (a.distance || 0) - (b.distance || 0);
    });

    setBranches(sorted);
  }
};
```

### With Operating Hours Display

```typescript
const renderBranch = ({item}: {item: Branch}) => {
  const isOpen = item.isOpen ?? true;

  return (
    <View style={styles.branchCard}>
      <Text style={styles.branchName}>{item.title}</Text>
      <Text style={styles.branchAddress}>{item.address}</Text>

      {item.openingTime && item.closingTime && (
        <Text style={[
          styles.hours,
          {color: isOpen ? '#34C759' : '#FF3B30'}
        ]}>
          {isOpen ? '🟢 Open' : '🔴 Closed'} •
          {item.openingTime} - {item.closingTime}
        </Text>
      )}

      {item.distance && (
        <Text style={styles.distance}>
          📍 {Math.round(item.distance)}m away
        </Text>
      )}

      <View style={styles.actions}>
        <Button
          title="Check In"
          onPress={() => handleCheckIn(item.id)}
          disabled={!isOpen}
        />
        <Button
          title="Check Out"
          onPress={() => handleCheckOut(item.id)}
        />
      </View>
    </View>
  );
};
```

### Map View Integration

```typescript
import MapView, {Marker} from 'react-native-maps';

const [region, setRegion] = useState({
  latitude: 0,
  longitude: 0,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
});

const loadBranches = async () => {
  const result = await getNearbyBranches({radius: 5000});

  if (result.success && result.data) {
    setBranches(result.data);

    // Center map on user location or first branch
    if (result.data.length > 0) {
      setRegion({
        ...region,
        latitude: result.data[0].latitude,
        longitude: result.data[0].longitude,
      });
    }
  }
};

return (
  <MapView
    style={{flex: 1}}
    region={region}
    showsUserLocation={true}
  >
    {branches.map((branch) => (
      <Marker
        key={branch.id}
        coordinate={{
          latitude: branch.latitude,
          longitude: branch.longitude,
        }}
        title={branch.title}
        description={branch.address}
        onCalloutPress={() => handleCheckIn(branch.id)}
      />
    ))}
  </MapView>
);
```

## Location Permissions

### Requesting Location Permission

```typescript
import {PermissionsAndroid, Platform, Alert} from 'react-native';
import Geolocation from '@react-native-community/geolocation';

const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    // iOS: Request in Info.plist
    return new Promise((resolve) => {
      Geolocation.requestAuthorization(
        () => resolve(true),   // Success
        () => resolve(false)   // Failure
      );
    });
  } else {
    // Android: Request at runtime
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location to find nearby branches',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Error requesting location permission:', err);
      return false;
    }
  }
};

// Use before loading branches
const loadBranches = async () => {
  const hasPermission = await requestLocationPermission();

  if (!hasPermission) {
    Alert.alert(
      'Permission Required',
      'Location permission is required to find nearby branches'
    );
    return;
  }

  const result = await getNearbyBranches({radius: 5000});
  // ...
};
```

### Handling Permission Denial

```typescript
useEffect(() => {
  (async () => {
    const hasPermission = await requestLocationPermission();

    if (!hasPermission) {
      Alert.alert(
        'Location Required',
        'Please enable location services to use check-in',
        [
          {text: 'Cancel'},
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings()
          }
        ]
      );
    } else {
      loadBranches();
    }
  })();
}, []);
```

## Error Handling

### Common Error Scenarios

```typescript
const loadBranches = async () => {
  try {
    const result = await getNearbyBranches({radius: 5000});

    if (!result.success) {
      switch (result.error) {
        case 'Location not available':
          Alert.alert(
            'Location Required',
            'Please enable location services'
          );
          break;

        case 'No branches found':
          Alert.alert(
            'No Branches',
            'No branches found within 5km radius. Try increasing the search radius.'
          );
          break;

        case 'Outside service area':
          Alert.alert(
            'Service Area',
            'No branches available in your current location'
          );
          break;

        default:
          Alert.alert('Error', result.error || 'Failed to load branches');
      }
    }
  } catch (error: any) {
    Alert.alert('Error', error.message || 'An error occurred');
  }
};
```

### Check-In Validation Errors

```typescript
const handleCheckIn = async (branchId: string, branchName: string) => {
  const result = await checkInEntry({
    branchId,
    userId: user.id,
  });

  if (!result.success) {
    switch (result.error) {
      case 'Already checked in':
        Alert.alert('Error', 'You are already checked in at this branch');
        break;

      case 'Too far from branch':
        Alert.alert(
          'Error',
          'You must be within 100m of the branch to check in'
        );
        break;

      case 'Outside operating hours':
        Alert.alert(
          'Error',
          `${branchName} is currently closed`
        );
        break;

      case 'Not authorized':
        Alert.alert(
          'Error',
          'You do not have permission to check in at this branch'
        );
        break;

      default:
        Alert.alert('Error', result.error || 'Check-in failed');
    }
  }
};
```

## Best Practices

### 1. Check User Authentication

```typescript
const {user} = usePassgageAuth();

const handleCheckIn = async (branchId: string) => {
  if (!user?.id) {
    Alert.alert('Error', 'Please login first');
    navigation.navigate('Login');
    return;
  }

  await checkInEntry({branchId, userId: user.id});
};
```

### 2. Show Loading States

```typescript
const [loadingBranches, setLoadingBranches] = useState(false);

const loadBranches = async () => {
  setLoadingBranches(true);
  try {
    const result = await getNearbyBranches({radius: 5000});
    // ...
  } finally {
    setLoadingBranches(false);
  }
};

// In render:
{loadingBranches ? (
  <ActivityIndicator size="large" />
) : (
  <FlatList data={branches} renderItem={renderBranch} />
)}
```

### 3. Handle Empty States

```typescript
<FlatList
  data={branches}
  renderItem={renderBranch}
  ListEmptyComponent={
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📍</Text>
      <Text style={styles.emptyTitle}>No Branches Found</Text>
      <Text style={styles.emptyText}>
        There are no branches within 5km of your location
      </Text>
      <Button
        title="Increase Radius"
        onPress={() => setRadius(10000)}
      />
    </View>
  }
/>
```

### 4. Provide User Feedback

```typescript
const handleCheckIn = async (branchId: string, branchName: string) => {
  const result = await checkInEntry({branchId, userId: user.id});

  if (result.success) {
    // Success feedback
    Alert.alert('Success', `Checked in to ${branchName}`);

    // Optional: Haptic feedback
    if (Platform.OS === 'ios') {
      ReactNativeHapticFeedback.trigger('notificationSuccess');
    }

    // Optional: Sound feedback
    // Play success sound
  } else {
    Alert.alert('Failed', result.error);
  }
};
```

### 5. Cache Branch Data

```typescript
const [branches, setBranches] = useState<Branch[]>([]);
const [lastFetch, setLastFetch] = useState<number>(0);
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const loadBranches = async (forceRefresh = false) => {
  const now = Date.now();

  if (!forceRefresh && now - lastFetch < CACHE_DURATION) {
    console.log('Using cached branch data');
    return;
  }

  const result = await getNearbyBranches({radius: 5000});

  if (result.success && result.data) {
    setBranches(result.data);
    setLastFetch(now);
  }
};
```

## Next Steps

- [Remote Work](./remote-work.md) - Track remote work hours
- [QR Scanner](./qr-scanner.md) - Alternative access control method
- [NFC Scanner](./nfc-scanner.md) - Alternative access control method
- [Error Handling](../error-handling.md) - Comprehensive error handling
- [Examples](../examples.md) - More complete examples
