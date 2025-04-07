import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { authService } from '../services/auth.service';

export const GoogleSignInButton: React.FC<{
  onSuccess?: (user: any) => void;
  onError?: (error: any) => void;
}> = ({ onSuccess, onError }) => {
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const user = await authService.googleSignIn(tokenResponse.access_token);
        onSuccess?.(user);
      } catch (error) {
        onError?.(error);
      }
    },
    onError: (error) => {
      console.error('Google login error:', error);
      onError?.(error);
    },
  });

  return (
    <TouchableOpacity style={styles.button} onPress={() => login()}>
      <Text style={styles.buttonText}>Sign in with Google</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4285F4',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 