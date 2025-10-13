import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {usePassgageAuth} from '@passgage/sdk-react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {user, logout} = usePassgageAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  const features = [
    {
      title: 'QR Scanner',
      description: 'Scan QR codes for access control',
      icon: '📱',
      screen: 'QRScanner' as const,
      color: '#007AFF',
    },
    {
      title: 'NFC Scanner',
      description: 'Scan NFC cards for access control',
      icon: '💳',
      screen: 'NFCScanner' as const,
      color: '#FF9500',
    },
    {
      title: 'Check-In',
      description: 'Location-based attendance tracking',
      icon: '📍',
      screen: 'CheckIn' as const,
      color: '#34C759',
    },
    {
      title: 'Remote Work',
      description: 'Log remote work entries and exits',
      icon: '🏠',
      screen: 'RemoteWork' as const,
      color: '#AF52DE',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome!</Text>
        <Text style={styles.userName}>{user?.fullName || user?.email}</Text>
        {user?.company?.name && (
          <Text style={styles.company}>{user.company.name}</Text>
        )}
      </View>

      <View style={styles.userDetails}>
        <View style={styles.userDetailRow}>
          <Text style={styles.detailLabel}>Email:</Text>
          <Text style={styles.detailValue}>{user?.email || 'N/A'}</Text>
        </View>
        {user?.gsm && (
          <View style={styles.userDetailRow}>
            <Text style={styles.detailLabel}>Phone:</Text>
            <Text style={styles.detailValue}>{user.gsm}</Text>
          </View>
        )}
        {user?.jobTitle && (
          <View style={styles.userDetailRow}>
            <Text style={styles.detailLabel}>Job Title:</Text>
            <Text style={styles.detailValue}>{user.jobTitle}</Text>
          </View>
        )}
        <View style={styles.tokenIndicator}>
          <Text style={styles.tokenIcon}>🔐</Text>
          <Text style={styles.tokenText}>JWT Token Active</Text>
        </View>
      </View>

      <View style={styles.featuresContainer}>
        <Text style={styles.sectionTitle}>Features</Text>
        <Text style={styles.sectionSubtitle}>
          All requests automatically include your authentication token
        </Text>

        {features.map((feature, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.featureCard, {borderLeftColor: feature.color}]}
            onPress={() => navigation.navigate(feature.screen)}>
            <View style={styles.featureIcon}>
              <Text style={styles.iconText}>{feature.icon}</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>🔒 Security</Text>
        <Text style={styles.infoText}>
          • Your JWT token is securely stored{'\n'}
          • All API requests are encrypted (TLS 1.2+){'\n'}
          • Tokens auto-refresh when expired{'\n'}
          • User info is cached locally
        </Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Passgage SDK v1.0.4{'\n'}
          @passgage/sdk-react-native
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 30,
    paddingBottom: 30,
  },
  welcome: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 5,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  company: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  userDetails: {
    backgroundColor: '#fff',
    margin: 15,
    marginBottom: 10,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  userDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  tokenIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  tokenIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  tokenText: {
    fontSize: 13,
    color: '#34C759',
    fontWeight: '600',
  },
  featuresContainer: {
    padding: 15,
    paddingTop: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 15,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  iconText: {
    fontSize: 24,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: '#666',
  },
  arrow: {
    fontSize: 24,
    color: '#ccc',
    marginLeft: 10,
  },
  infoSection: {
    margin: 15,
    marginTop: 5,
    padding: 15,
    backgroundColor: '#e8f4ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cce5ff',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
  },
  logoutButton: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 10,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
