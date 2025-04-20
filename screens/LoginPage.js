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
  Keyboard,
  Platform,
  Pressable
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import useLogin from '../assets/hooks/useLogin';
import { check, PERMISSIONS, RESULTS } from 'react-native-permissions';
import styles from './sharedStyles/LoginPageStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { handleGoogleSignIn } from '../assets/services/auth.service';
import { setAccessToken, setUserProfile } from '../assets/redux/actions';
import { AppleSignInButton } from '../components/AppleSignInButton';
import { handleAppleSignIn } from '../assets/services/auth.service';

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
  const dispatch = useDispatch();

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

  const handleLogin = () => {
    console.log('🔑 [LoginPage] Starting login process...');
    if (!username || !password) {
      console.error('❌ [LoginPage] Validation Error: Missing username or password');
      Alert.alert('Validation Error', 'Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    console.log('🔄 [LoginPage] Calling login mutation...');
    loginUser(
      { email: username, password },
      {
        onSuccess: async (data) => {
          console.log('✅ [LoginPage] Login mutation successful');
          setIsLoading(false);
          const userRole = data?.userProfile?.role || userProfile?.data?.role;
          console.log('👤 [LoginPage] User role:', userRole);

          if (data?.token) {
            console.log('🔄 [LoginPage] Navigating to appropriate stack...');
            if (userRole === 'ARTIST') {
              console.log('🎨 [LoginPage] Navigating to ArtistStack');
              navigation.reset({
                index: 0,
                routes: [{ name: 'ArtistStack' }],
              });
            } else if (userRole === 'USER') {
              console.log('👤 [LoginPage] Navigating to FanStack');
              navigation.reset({
                index: 0,
                routes: [{ name: 'FanStack' }],
              });
            }
          } else {
            console.error('❌ [LoginPage] Token missing in response');
            Alert.alert('Error', 'Token missing in response.');
          }
        },
        onError: (error) => {
          console.error('❌ [LoginPage] Login mutation error:', error);
          setIsLoading(false);
          Alert.alert('Error', error.message || 'Login failed. Please try again.');
        },
      }
    );
  };

  const handleGoogleLogin = async () => {
    console.log('🔑 [LoginPage] Starting Google login process...');
    try {
      setIsGoogleLoading(true);
      console.log('🔄 [LoginPage] Calling Google sign-in...');
      const result = await handleGoogleSignIn();
      console.log('✅ [LoginPage] Google sign-in result:', JSON.stringify(result, null, 2));

      if (result?.token) {
        console.log('💾 [LoginPage] Storing Google auth data in AsyncStorage...');
        await AsyncStorage.multiSet([
          ['authToken', result.token],
          ['refreshToken', result.refreshToken],
          ['tokenExpiry', (Date.now() + result.expiresIn * 1000).toString()],
          ['userRole', result.user.role],
          ['userData', JSON.stringify(result.user)]
        ]);
        console.log('✅ [LoginPage] Google auth data stored successfully');

        console.log('🔄 [LoginPage] Updating Redux store...');
        dispatch(setAccessToken(result.token));
        dispatch(setUserProfile({
          data: result.user,
          role: result.user.role
        }));
        console.log('✅ [LoginPage] Redux store updated successfully');

        console.log('🔄 [LoginPage] Navigating to appropriate stack...');
        if (result.user.role === 'ARTIST') {
          console.log('🎨 [LoginPage] Navigating to ArtistStack');
          navigation.navigate('ArtistStack');
        } else if (result.user.role === 'USER') {
          console.log('👤 [LoginPage] Navigating to FanStack');
          navigation.navigate('FanStack');
        }
      } else {
        console.error('❌ [LoginPage] Token missing in Google sign-in result');
        Alert.alert('Error', 'Failed to get authentication token from Google sign-in.');
      }
    } catch (error) {
      console.error('❌ [LoginPage] Google sign-in error:', error);
      Alert.alert('Error', 'Google sign-in failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    console.log('🔑 [LoginPage] Starting Apple login process...');
    try {
      setIsGoogleLoading(true);
      console.log('🔄 [LoginPage] Calling Apple sign-in...');
      const result = await handleAppleSignIn();
      console.log('✅ [LoginPage] Apple sign-in result:', JSON.stringify(result, null, 2));

      if (result?.token) {
        console.log('💾 [LoginPage] Storing Apple auth data in AsyncStorage...');
        await AsyncStorage.multiSet([
          ['authToken', result.token],
          ['refreshToken', result.refreshToken],
          ['tokenExpiry', (Date.now() + result.expiresIn * 1000).toString()],
          ['userRole', result.user.role],
          ['userData', JSON.stringify(result.user)]
        ]);
        console.log('✅ [LoginPage] Apple auth data stored successfully');

        console.log('🔄 [LoginPage] Updating Redux store...');
        dispatch(setAccessToken(result.token));
        dispatch(setUserProfile({
          data: result.user,
          role: result.user.role
        }));
        console.log('✅ [LoginPage] Redux store updated successfully');

        // Check permissions and navigate
        const permissionsGranted = await checkAllPermissions();
        if (permissionsGranted) {
          if (result.user.role === 'ARTIST') {
            console.log('🎨 [LoginPage] Navigating to ArtistStack');
            navigation.reset({
              index: 0,
              routes: [{ name: 'ArtistStack' }],
            });
          } else if (result.user.role === 'USER') {
            console.log('👤 [LoginPage] Navigating to FanStack');
            navigation.reset({
              index: 0,
              routes: [{ name: 'FanStack' }],
            });
          }
        } else {
          console.log('🔒 [LoginPage] Navigating to PermissionsScreen');
          navigation.reset({
            index: 0,
            routes: [{ name: 'PermissionsScreen' }],
          });
        }
      } else {
        console.error('❌ [LoginPage] Token missing in Apple sign-in result');
        Alert.alert('Error', 'Failed to get authentication token from Apple sign-in.');
      }
    } catch (error) {
      console.error('❌ [LoginPage] Apple sign-in error:', error);
      Alert.alert('Error', 'Apple sign-in failed. Please try again.');
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
              style={[styles.input, { color: '#000' }]}
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
              style={[styles.passwordInput, { color: '#000' }]}
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

          {Platform.OS === 'ios' && (
            <AppleSignInButton
              onSuccess={() => {
                console.log('Apple sign-in completed successfully');
              }}
              onError={(error) => {
                console.error('Apple sign-in error:', error);
                Alert.alert('Error', 'Apple sign-in failed. Please try again.');
              }}
            />
          )}

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
        </View>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <Pressable 
            onPressIn={() => console.log('Signup button pressed in')}
            onPressOut={() => console.log('Signup button pressed out')}
            onPress={() => {
              console.log('Signup button pressed - attempting navigation');
              try {
                navigation.navigate('RegFanPage');
                console.log('Navigation successful');
              } catch (error) {
                console.error('Navigation error:', error);
              }
            }}
            style={({ pressed }) => [
              styles.signupButton,
              { opacity: pressed ? 0.7 : 1 }
            ]}
            hitSlop={20}
          >
            <Text style={[styles.signupText, styles.signupLink]}>Sign Up</Text>
          </Pressable>
        </View>

        <View style={styles.bottomPlaceholder} />
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;
