import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { View, TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
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
      // Log the error silently or handle it without UI feedback
      console.log('Google login error:', error);
    },
  });

  return (
    <TouchableOpacity style={styles.button} onPress={() => login()}>
      <View style={styles.buttonContent}>
        <Image
          source={require('../assets/images/7123025_logo_google_g_icon-2.png')}
          style={styles.googleLogo}
        />
        <Text style={styles.buttonText}>Sign in with Google</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogo: {
    width: 30,
    height: 30,
    marginRight: 12,
  },
  buttonText: {
    color: '#757575',
    fontSize: 16,
    fontWeight: '500',
  },
}); 