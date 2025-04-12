import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
  Alert,
  Keyboard
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import useLogin from '../assets/hooks/useLogin';
import { check, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Platform } from 'react-native';
import styles from './sharedStyles/LoginPageStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { handleGoogleSignIn } from '../assets/services/auth.service';

const { width } = Dimensions.get('window');

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [role, setRole] = useState(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  const navigation = useNavigation();
  const userProfile = useSelector((state) => state.userProfile);
  const { mutate: loginUser } = useLogin();

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

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  useEffect(() => {
    if (role && !isLoading) {
      checkAllPermissions().then((permissionsGranted) => {
        setPermissionsGranted(permissionsGranted);
        if (permissionsGranted) {
          navigateToAppropriateStack();
        } else {
          navigation.navigate('PermissionsScreen');
        }
      });
    }
  }, [role, isLoading]);

  const navigateToAppropriateStack = () => {
    if (!role) return;
    if (role === 'ARTIST') {
      navigation.navigate('ArtistStack');
    } else if (role === 'USER') {
      navigation.navigate('FanStack');
    }
  };

  useEffect(() => {
    if (userProfile?.data?.role) {
      setRole(userProfile.data.role);
    }
    setIsLoading(false);
  }, [userProfile]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setRole(null);
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const saveRoleToAsyncStorage = async () => {
      if (userProfile?.data?.role) {
        try {
          await AsyncStorage.setItem('userRole', userProfile.data.role);
        } catch (error) {
          console.error('Error saving role to AsyncStorage:', error);
        }
      }
    };
    saveRoleToAsyncStorage();
  }, [userProfile]);

  useEffect(() => {
    const clearStaleData = async () => {
      try {
        await AsyncStorage.multiRemove([
          'authToken',
          'userRole',
          'loggedInUser',
          'fcmToken'
        ]);
      } catch (error) {
        console.error('Error clearing stale data:', error);
      }
    };
    
    clearStaleData();
  }, []);

  const handleLogin = () => {
    if (!username || !password) {
      Alert.alert('Validation Error', 'Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    loginUser(
      { email: username, password },
      {
        onSuccess: async (data) => {
          setIsLoading(false);
          const userRole = data?.role || userProfile?.data?.role;
          const token = data?.token;

          if (token) {
            await AsyncStorage.setItem('authToken', token);
            if (userRole) {
              await AsyncStorage.setItem('userRole', userRole);
            }
            if (userRole === 'ARTIST') navigation.navigate('ArtistStack');
            else if (userRole === 'USER') navigation.navigate('FanStack');
          } else {
            Alert.alert('Error', 'Token missing in response.');
          }
        },
        onError: (error) => {
          setIsLoading(false);
          Alert.alert('Error', 'Login failed. Please try again.');
        },
      }
    );
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      const result = await handleGoogleSignIn();
      if (result?.user?.role) {
        setRole(result.user.role);
        navigateToAppropriateStack();
      } else {
        navigation.navigate('RegFanPage', {
          userData: result.user
        });
      }
    } catch (error) {
      console.error('Google Sign-In Error in LoginPage:', error);
      Alert.alert(
        'Sign In Error',
        error.message || 'Failed to sign in with Google. Please try again.'
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.contentContainer}>
        <View style={styles.topSection}>
          <Image
            source={require('../assets/images/1024.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.middleSection}>
          <Text style={styles.pageTitle}>Log into DayOnes</Text>

          <Text style={styles.inputLabel}>EMAIL</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#888"
              value={username}
              onChangeText={setUsername}
              editable={!isLoading}
              textContentType="emailAddress"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.inputLabel}>PASSWORD</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
              secureTextEntry={!isPasswordVisible}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
              <Feather
                name={isPasswordVisible ? 'eye' : 'eye-off'}
                size={20}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            style={styles.fullButtonContainer}
            disabled={isLoading}
          >
            <LinearGradient colors={['#ff00ff', '#7000ff']} style={styles.loginButton}>
              <Text style={[styles.buttonText, styles.loginButtonText]}>{isLoading ? 'Logging in...' : 'LOG IN'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.orDividerContainer}>
            <View style={styles.orDividerLine} />
            <Text style={styles.orDividerText}>OR</Text>
            <View style={styles.orDividerLine} />
          </View>

          <TouchableOpacity
            onPress={handleGoogleLogin}
            style={styles.googleButton}
            disabled={isGoogleLoading}
          >
            <View style={styles.buttonContent}>
              <Image
                source={require('../assets/images/7123025_logo_google_g_icon-2.png')}
                style={styles.googleLogo}
              />
              <Text style={[styles.buttonText, styles.googleButtonText]}>
                {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('RegFanPage')}>
              <Text style={[styles.signupText, styles.signupLink]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

        </View>

        <View style={styles.bottomPlaceholder} />
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;
