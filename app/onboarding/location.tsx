import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../../components/CustomAlert';
import * as Location from 'expo-location';

const locations = [
  { id: 'delhi', name: 'Delhi', state: 'Delhi' },
  { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra' },
  { id: 'bangalore', name: 'Bangalore', state: 'Karnataka' },
  { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana' },
  { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu' },
  { id: 'kolkata', name: 'Kolkata', state: 'West Bengal' },
  { id: 'pune', name: 'Pune', state: 'Maharashtra' },
  { id: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat' },
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan' },
  { id: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh' },
  { id: 'kanpur', name: 'Kanpur', state: 'Uttar Pradesh' },
  { id: 'nagpur', name: 'Nagpur', state: 'Maharashtra' },
  { id: 'indore', name: 'Indore', state: 'Madhya Pradesh' },
  { id: 'thane', name: 'Thane', state: 'Maharashtra' },
  { id: 'bhopal', name: 'Bhopal', state: 'Madhya Pradesh' },
  { id: 'visakhapatnam', name: 'Visakhapatnam', state: 'Andhra Pradesh' },
  { id: 'patna', name: 'Patna', state: 'Bihar' },
  { id: 'vadodara', name: 'Vadodara', state: 'Gujarat' },
  { id: 'ghaziabad', name: 'Ghaziabad', state: 'Uttar Pradesh' },
  { id: 'ludhiana', name: 'Ludhiana', state: 'Punjab' },
];

export default function LocationScreen() {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [liveLocation, setLiveLocation] = useState<{ name: string; state: string; id: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info',
    onConfirm: () => {},
  });
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const { saveOnboarding } = useAuth();

  // Extract data from previous screens
  const language = params.language as string || 'en';
  const categories = (params.categories as string || '').split(',').filter(Boolean);

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info', onConfirm?: () => void) => {
    setAlertConfig({
      title,
      message,
      type,
      onConfirm: onConfirm || (() => setAlertVisible(false)),
    });
    setAlertVisible(true);
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Dokit needs access to your location to provide local news.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else {
      return true;
    }
  };

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        showAlert('Permission Denied', 'Location permission is required to get your current location.', 'error');
        setGettingLocation(false);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Denied', 'Location permission is required to get your current location.', 'error');
        setGettingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Reverse geocoding to get city name
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode.length > 0) {
        const address = geocode[0];
        const cityName = address.city || address.subregion || 'Unknown City';
        const stateName = address.region || 'Unknown State';
        
        const liveLocationData = {
          id: `live_${cityName.toLowerCase().replace(/\s+/g, '_')}`,
          name: cityName,
          state: stateName,
        };
        
        setLiveLocation(liveLocationData);
        
        // Add to selected locations if not already selected
        if (!selectedLocations.includes(liveLocationData.id)) {
          setSelectedLocations(prev => [...prev, liveLocationData.id]);
        }
        
        showAlert('Location Found', `Added ${cityName}, ${stateName} to your locations.`, 'success');
      } else {
        showAlert('Location Error', 'Could not determine your current location.', 'error');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      showAlert('Location Error', 'Failed to get your current location. Please try again.', 'error');
    } finally {
      setGettingLocation(false);
    }
  };

  const toggleLocation = (locationId: string) => {
    setSelectedLocations(prev => {
      if (prev.includes(locationId)) {
        return prev.filter(id => id !== locationId);
      } else {
        return [...prev, locationId];
      }
    });
  };

  const handleComplete = async () => {
    if (selectedLocations.length === 0) {
      showAlert('Selection Required', 'Please select at least one location', 'error');
      return;
    }

    setLoading(true);
    try {
      const onboardingData = {
        language: language,
        categories: categories,
        locations: selectedLocations,
      };

      const result = await saveOnboarding(onboardingData);
      
      if (result.success) {
        showAlert(
          'Setup Complete!',
          'Your preferences have been saved. Welcome to Dokit!',
          'success',
          () => {
            setAlertVisible(false);
            router.replace('/(tabs)' as any);
          }
        );
      } else {
        showAlert('Error', result.message || 'Failed to save preferences', 'error');
      }
    } catch (error) {
      showAlert('Error', 'Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>
          <Text style={styles.progressText}>3 of 3</Text>
        </View>
        
        <Text style={styles.title}>Select Your Locations</Text>
        <Text style={styles.subtitle}>
          Choose cities you want to get news from
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Live Location Button */}
        <TouchableOpacity
          style={[styles.liveLocationButton, gettingLocation && styles.disabledButton]}
          onPress={getCurrentLocation}
          disabled={gettingLocation}
        >
          <Ionicons 
            name={gettingLocation ? "hourglass-outline" : "location-outline"} 
            size={20} 
            color={gettingLocation ? "#999" : "#007AFF"} 
          />
          <Text style={[styles.liveLocationText, gettingLocation && styles.disabledText]}>
            {gettingLocation ? 'Getting Location...' : 'Add Current Location'}
          </Text>
        </TouchableOpacity>

        {/* Live Location Display */}
        {liveLocation && (
          <View style={styles.liveLocationCard}>
            <View style={styles.liveLocationContent}>
              <Ionicons name="location" size={20} color="#4CAF50" />
              <View style={styles.liveLocationText}>
                <Text style={styles.liveLocationName}>{liveLocation.name}</Text>
                <Text style={styles.liveLocationState}>{liveLocation.state}</Text>
              </View>
            </View>
            <Text style={styles.liveLocationBadge}>Live</Text>
          </View>
        )}

        <View style={styles.locationGrid}>
          {locations.map((location) => (
            <TouchableOpacity
              key={location.id}
              style={[
                styles.locationCard,
                selectedLocations.includes(location.id) && styles.selectedCard,
              ]}
              onPress={() => toggleLocation(location.id)}
            >
              <View style={styles.locationContent}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={selectedLocations.includes(location.id) ? '#007AFF' : '#666'}
                  style={styles.locationIcon}
                />
                <View style={styles.locationText}>
                  <Text style={[
                    styles.locationName,
                    selectedLocations.includes(location.id) && styles.selectedText,
                  ]}>
                    {location.name}
                  </Text>
                  <Text style={[
                    styles.locationState,
                    selectedLocations.includes(location.id) && styles.selectedText,
                  ]}>
                    {location.state}
                  </Text>
                </View>
              </View>
              {selectedLocations.includes(location.id) && (
                <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color="#666" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.completeButton,
              (selectedLocations.length === 0 || loading) && styles.disabledButton,
            ]}
            onPress={handleComplete}
            disabled={selectedLocations.length === 0 || loading}
          >
            <Text style={styles.completeButtonText}>
              {loading ? 'Saving...' : 'Complete Setup'}
            </Text>
            <Ionicons name="checkmark" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertVisible(false)}
        onConfirm={alertConfig.onConfirm}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
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
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  liveLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8ff',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 20,
  },
  liveLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  liveLocationCard: {
    backgroundColor: '#e8f5e8',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveLocationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  liveLocationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  liveLocationState: {
    fontSize: 14,
    color: '#666',
  },
  liveLocationBadge: {
    backgroundColor: '#4CAF50',
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  locationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  locationCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedCard: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  locationContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    marginRight: 12,
  },
  locationText: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  locationState: {
    fontSize: 14,
    color: '#666',
  },
  selectedText: {
    color: '#007AFF',
  },
  disabledText: {
    color: '#999',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    borderColor: '#ccc',
  },
}); 