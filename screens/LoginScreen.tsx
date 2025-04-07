import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { useAuth } from '../contexts/AuthContext';

export const LoginScreen: React.FC = () => {
  const { user, login } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    if (user) {
      navigation.navigate('Home');
    }
  }, [user, navigation]);

  const handleGoogleSuccess = (userData: any) => {
    login(userData);
  };

  const handleGoogleError = (error: any) => {
    console.error('Google sign-in error:', error);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to DayOnes</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>
      <GoogleSignInButton
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
}); 