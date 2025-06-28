import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const categories = [
  { id: 'politics', name: 'Politics', icon: 'flag-outline' },
  { id: 'business', name: 'Business', icon: 'business-outline' },
  { id: 'technology', name: 'Technology', icon: 'laptop-outline' },
  { id: 'sports', name: 'Sports', icon: 'football-outline' },
  { id: 'entertainment', name: 'Entertainment', icon: 'film-outline' },
  { id: 'health', name: 'Health', icon: 'medical-outline' },
  { id: 'science', name: 'Science', icon: 'flask-outline' },
  { id: 'education', name: 'Education', icon: 'school-outline' },
  { id: 'environment', name: 'Environment', icon: 'leaf-outline' },
  { id: 'international', name: 'International', icon: 'globe-outline' },
  { id: 'crime', name: 'Crime', icon: 'shield-outline' },
  { id: 'weather', name: 'Weather', icon: 'partly-sunny-outline' },
];

export default function CategoryScreen() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Get language from previous screen
  const language = params.language as string || 'en';

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleContinue = () => {
    if (selectedCategories.length > 0) {
      // Store selected categories and navigate to next screen
      router.push({
        pathname: '/onboarding/location' as any,
        params: { 
          language: language,
          categories: selectedCategories.join(',')
        }
      });
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
            <View style={[styles.progressFill, { width: '66%' }]} />
          </View>
          <Text style={styles.progressText}>2 of 3</Text>
        </View>
        
        <Text style={styles.title}>Select News Categories</Text>
        <Text style={styles.subtitle}>
          Choose the topics you're interested in
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.categoryGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                selectedCategories.includes(category.id) && styles.selectedCard,
              ]}
              onPress={() => toggleCategory(category.id)}
            >
              <View style={styles.categoryContent}>
                <Ionicons
                  name={category.icon as any}
                  size={24}
                  color={selectedCategories.includes(category.id) ? '#007AFF' : '#666'}
                  style={styles.categoryIcon}
                />
                <Text style={[
                  styles.categoryName,
                  selectedCategories.includes(category.id) && styles.selectedText,
                ]}>
                  {category.name}
                </Text>
              </View>
              {selectedCategories.includes(category.id) && (
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
              styles.continueButton,
              selectedCategories.length === 0 && styles.disabledButton,
            ]}
            onPress={handleContinue}
            disabled={selectedCategories.length === 0}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
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
  categoryContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedText: {
    color: '#007AFF',
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
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
}); 