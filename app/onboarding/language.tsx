import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const languages = [
  { id: 'en', name: 'English', nativeName: 'English' },
  { id: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { id: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { id: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { id: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { id: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { id: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { id: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { id: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { id: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
];

export default function LanguageScreen() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const router = useRouter();

  const selectLanguage = (languageId: string) => {
    setSelectedLanguage(languageId);
  };

  const handleContinue = () => {
    if (selectedLanguage) {
      // Store selected language and navigate to next screen
      router.push({
        pathname: '/onboarding/category' as any,
        params: { language: selectedLanguage }
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '33%' }]} />
          </View>
          <Text style={styles.progressText}>1 of 3</Text>
        </View>
        
        <Text style={styles.title}>Choose Your Language</Text>
        <Text style={styles.subtitle}>
          Select the language you'd like to read news in
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.languageGrid}>
          {languages.map((language) => (
            <TouchableOpacity
              key={language.id}
              style={[
                styles.languageCard,
                selectedLanguage === language.id && styles.selectedCard,
              ]}
              onPress={() => selectLanguage(language.id)}
            >
              <View style={styles.languageContent}>
                <Text style={[
                  styles.languageName,
                  selectedLanguage === language.id && styles.selectedText,
                ]}>
                  {language.name}
                </Text>
                <Text style={[
                  styles.nativeName,
                  selectedLanguage === language.id && styles.selectedText,
                ]}>
                  {language.nativeName}
                </Text>
              </View>
              {selectedLanguage === language.id && (
                <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedLanguage && styles.disabledButton,
          ]}
          onPress={handleContinue}
          disabled={!selectedLanguage}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
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
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  languageCard: {
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
  languageContent: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  nativeName: {
    fontSize: 14,
    color: '#666',
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
  continueButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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