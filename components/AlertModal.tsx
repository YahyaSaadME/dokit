import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';

interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: 'error' | 'success' | 'warning' | 'info';
}

export const AlertModal = ({
  visible,
  title,
  message,
  onClose,
  type = 'error',
}: AlertModalProps) => {
  const backgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#1C1C1E' }, 'background');

  // Colors based on alert type
  const getColors = () => {
    switch (type) {
      case 'success':
        return { title: '#2E7D32', bg: '#E8F5E9' };
      case 'warning':
        return { title: '#F57C00', bg: '#FFF3E0' };
      case 'info':
        return { title: '#0288D1', bg: '#E1F5FE' };
      case 'error':
      default:
        return { title: '#C62828', bg: '#FFEBEE' };
    }
  };

  const { title: titleColor, bg: bgColor } = getColors();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ThemedView style={[styles.modalContent, { backgroundColor }]}>
          <View style={[styles.titleContainer, { backgroundColor: bgColor }]}>
            <ThemedText style={[styles.title, { color: titleColor }]}>{title}</ThemedText>
          </View>
          
          <ThemedText style={styles.message}>{message}</ThemedText>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: bgColor }]} 
            onPress={onClose}
          >
            <ThemedText style={[styles.buttonText, { color: titleColor }]}>OK</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 10,
    width: '90%',
    maxWidth: 400,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  titleContainer: {
    padding: 15,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    padding: 20,
    textAlign: 'center',
  },
  button: {
    padding: 12,
    margin: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  }
});
