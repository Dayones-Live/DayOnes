import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image, Platform } from 'react-native';
import { handleAppleSignIn } from '../assets/services/auth.service';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { useNavigation } from '@react-navigation/native';
import { check, PERMISSIONS, RESULTS } from 'react-native-permissions';

export const AppleSignInButton: React.FC<{
  onSuccess?: (user: any) => void;
  onError?: (error: any) => void;
}> = ({ onSuccess, onError }) => {
  const [isSupported, setIsSupported] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    // Check if Apple Sign-in is supported on the device
    const checkSupport = async () => {
      if (Platform.OS === 'ios') {
        const supported = await appleAuth.isSupported;
        setIsSupported(supported);
      }
    };
    checkSupport();
  }, []);

  const checkAllPermissions = async () => {
    try {
      const location = await check(
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
      );
      return location === RESULTS.GRANTED;
    } catch (error) {
      console.log('Error checking permissions:', error);
      return false;
    }
  };

  const handlePress = async () => {
    try {
      if (!isSupported) {
        throw new Error('Apple Sign-in is not supported on this device');
      }
      const result = await handleAppleSignIn();
      
      // Check permissions and navigate
      const permissionsGranted = await checkAllPermissions();
      if (permissionsGranted) {
        if (result.user.role === 'ARTIST') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'ArtistStack' }],
          });
        } else if (result.user.role === 'USER') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'FanStack' }],
          });
        }
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'PermissionsScreen' }],
        });
      }
      
      onSuccess?.(result.user);
    } catch (error) {
      onError?.(error);
    }
  };

  // Don't render the button if Apple Sign-in is not supported
  if (!isSupported) {
    return null;
  }

  return (
    <TouchableOpacity style={styles.button} onPress={handlePress}>
      <View style={styles.buttonContent}>
        <Image
          source={require('../assets/images/icons8-apple-logo-50.png')}
          style={styles.appleLogo}
        />
        <Text style={styles.buttonText}>Continue with Apple</Text>
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
  appleLogo: {
    width: 30,
    height: 30,
    marginRight: 12,
    tintColor: '#000000',
  },
  buttonText: {
    color: '#757575',
    fontSize: 16,
    fontWeight: '500',
  },
}); 