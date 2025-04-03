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
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

const { width } = Dimensions.get('window');

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleGoogleSignIn = async () => {
    try {
      console.log('[GoogleSignIn] Starting Google Sign-In process');
      
      // Check if play services are available
      const playServicesAvailable = await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      console.log('[GoogleSignIn] Play services available:', playServicesAvailable);
      
      // Attempt sign in
      console.log('[GoogleSignIn] Attempting to sign in...');
      const userInfo = await GoogleSignin.signIn();
      console.log('[GoogleSignIn] Sign-in successful:', userInfo);
      
      // Here you would typically send this to your backend
      const { idToken, user } = userInfo;
      console.log('[GoogleSignIn] ID Token:', idToken);
      console.log('[GoogleSignIn] User:', user);
      
      Alert.alert('Success', 'Google Sign-In successful!');
    } catch (error) {
      console.log('[GoogleSignIn] Error object:', error);
      console.log('[GoogleSignIn] Error code:', error.code);
      console.log('[GoogleSignIn] Error message:', error.message);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('[GoogleSignIn] User cancelled the sign-in flow');
        Alert.alert('Cancelled', 'Sign-in was cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('[GoogleSignIn] Sign-in is already in progress');
        Alert.alert('In Progress', 'Sign-in is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('[GoogleSignIn] Play services not available');
        Alert.alert('Error', 'Play services not available');
      } else {
        console.log('[GoogleSignIn] Other error:', error);
        Alert.alert('Error', 'Failed to sign in with Google. Please try again.');
      }
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
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#888"
              value={username}
              onChangeText={setUsername}
              editable={!isLoading}
              textContentType="oneTimeCode"
            />
          </View>

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
              <Text style={styles.buttonText}>{isLoading ? 'Logging in...' : 'Login'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleGoogleSignIn}
            style={[styles.fullButtonContainer, { marginTop: 10 }]}
            disabled={isLoading}
          >
            <View style={[styles.loginButton, { backgroundColor: '#fff' }]}>
              <Text style={[styles.buttonText, { color: '#000' }]}>Sign in with Google</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.signupText}>
          Are you an Artist?{' '}
          <Text
            onPress={() =>
              Alert.alert(
                'Artists!',
                'Email DayOnesMedia@gmail.com for more information on how to partner with DayOnes.'
              )
            }
            style={styles.signupLink}
          >
            Contact Us!
          </Text>
        </Text>

        <View style={styles.bottomSection}>
          <Text style={styles.artistQuestionText}>Don't have an account?</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('RegFanPage')}
            style={styles.fullButtonContainer}
          >
            <LinearGradient colors={['#ffcc00', '#ff8800']} style={styles.signupArtistButton}>
              <Text style={styles.signupArtistText}>Signup</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;
