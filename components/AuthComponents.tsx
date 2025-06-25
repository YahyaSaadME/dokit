import React from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

interface AuthInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export const AuthInput = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
}: AuthInputProps) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#E1E1E1', dark: '#2A2A2A' }, 'background');

  return (
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={useThemeColor({ light: '#888', dark: '#666' }, 'text')}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      style={[
        styles.input,
        {
          backgroundColor,
          color: textColor,
          borderColor: borderColor,
        },
      ]}
    />
  );
};

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  type?: 'primary' | 'secondary';
}

export const AuthButton = ({
  title,
  onPress,
  isLoading = false,
  disabled = false,
  type = 'primary',
}: AuthButtonProps) => {
  const primaryColor = useThemeColor({ light: '#0a7ea4', dark: '#0a7ea4' }, 'tint');
  const secondaryColor = useThemeColor({ light: '#E1E1E1', dark: '#2A2A2A' }, 'background');
  
  const backgroundColor = type === 'primary' ? primaryColor : secondaryColor;
  const textColor = type === 'primary' ? '#fff' : useThemeColor({}, 'text');

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: backgroundColor, opacity: disabled ? 0.6 : 1 },
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <ThemedText style={[styles.buttonText, { color: textColor }]}>{title}</ThemedText>
      )}
    </TouchableOpacity>
  );
};

export const AuthError = ({ message }: { message: string | null }) => {
  if (!message) return null;
  
  return (
    <View style={styles.errorContainer}>
      <ThemedText style={styles.errorText}>{message}</ThemedText>
    </View>
  );
};

export const AuthSeparator = ({ text }: { text: string }) => {
  return (
    <View style={styles.separatorContainer}>
      <View style={styles.separatorLine} />
      <ThemedText style={styles.separatorText}>{text}</ThemedText>
      <View style={styles.separatorLine} />
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E1E1E1',
  },
  separatorText: {
    marginHorizontal: 10,
    fontSize: 14,
    color: '#888',
  },
});
