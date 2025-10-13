import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, FlatList} from 'react-native';
import {usePassgageCheckIn, usePassgageAuth} from 'passgage-access-sdk-react-native';

export default function CheckInScreen() {
  const {user} = usePassgageAuth();
  const {getNearbyBranches, checkInEntry, checkInExit, isLoading} = usePassgageCheckIn();
  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    setLoadingBranches(true);
    const result = await getNearbyBranches({
      radius: 5000, // 5km
    });

    if (result.success) {
      setBranches(result.data);
    } else {
      Alert.alert('Error', 'Could not load nearby branches');
    }
    setLoadingBranches(false);
  };

  const handleCheckIn = async (branchId: string, branchName: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    const result = await checkInEntry({
      branchId,
      userId: user.id,
    });

    if (result.success) {
      Alert.alert('Success', `Checked in to ${branchName}`);
    } else {
      Alert.alert('Failed', result.error);
    }
  };

  const handleCheckOut = async (branchId: string, branchName: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    const result = await checkInExit({
      branchId,
      userId: user.id,
    });

    if (result.success) {
      Alert.alert('Success', `Checked out from ${branchName}`);
    } else {
      Alert.alert('Failed', result.error);
    }
  };

  const renderBranch = ({item}: {item: any}) => (
    <View style={styles.branchCard}>
      <View style={styles.branchInfo}>
        <Text style={styles.branchName}>{item.title}</Text>
        <Text style={styles.branchAddress}>{item.address}</Text>
        {item.distance && (
          <Text style={styles.branchDistance}>
            📍 {Math.round(item.distance)}m away
          </Text>
        )}
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.checkInButton]}
          onPress={() => handleCheckIn(item.id, item.title)}
          disabled={isLoading}>
          <Text style={styles.actionButtonText}>Check In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.checkOutButton]}
          onPress={() => handleCheckOut(item.id, item.title)}
          disabled={isLoading}>
          <Text style={styles.actionButtonText}>Check Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>📍</Text>
        <Text style={styles.title}>Location-Based Check-In</Text>
        <Text style={styles.description}>
          Check in or out from nearby branches
        </Text>
      </View>

      {loadingBranches ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#34C759" />
          <Text style={styles.loadingText}>Loading nearby branches...</Text>
        </View>
      ) : branches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No nearby branches found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadBranches}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={branches}
          renderItem={renderBranch}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={loadingBranches}
          onRefresh={loadBranches}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  icon: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  listContainer: {
    padding: 15,
  },
  branchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  branchInfo: {
    marginBottom: 12,
  },
  branchName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  branchAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  branchDistance: {
    fontSize: 13,
    color: '#34C759',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkInButton: {
    backgroundColor: '#34C759',
  },
  checkOutButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#34C759',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
