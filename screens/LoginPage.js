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
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  ImageBackground,
  Linking
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
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const { width } = Dimensions.get('window');

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [role, setRole] = useState(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);

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
    const unsubscribe = navigation.addListener('focus', async () => {
      // Only reset role if user is not logged in
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        setRole(null);
      }
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

  const handleContinueWithEmail = () => {
    if (!email) {
      Alert.alert('Validation Error', 'Please enter your email address.');
      return;
    }
    setShowPasswordField(true);
  };

  const handleLogin = () => {
    console.log('🔑 [LoginPage] Starting login process...');
    if (!email || !password) {
      console.error('❌ [LoginPage] Validation Error: Missing email or password');
      Alert.alert('Validation Error', 'Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    console.log('🔄 [LoginPage] Calling login mutation...');
    loginUser(
      { email: email, password },
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
            } else if (userRole === 'SUPER_ADMIN') {
              console.log('👑 [LoginPage] Navigating to SuperAdminDashboard');
              navigation.reset({
                index: 0,
                routes: [{ name: 'SuperAdminDashboard' }],
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
        } else if (result.user.role === 'SUPER_ADMIN') {
          console.log('👑 [LoginPage] Navigating to SuperAdminDashboard');
          navigation.navigate('SuperAdminDashboard');
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
          } else if (result.user.role === 'SUPER_ADMIN') {
            console.log('👑 [LoginPage] Navigating to SuperAdminDashboard');
            navigation.reset({
              index: 0,
              routes: [{ name: 'SuperAdminDashboard' }],
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
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/images/welcome-background.jpg')}
        style={styles.backgroundImageStyle}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)', '#000']}
          locations={[0, 0.5, 0.75, 1]}
          style={styles.bottomGradient}
        />
      </ImageBackground>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Main Content Area */}
            <View style={styles.contentContainer}>
              {/* Title */}
              <Text style={styles.title}>Continue with Email</Text>
              <Text style={styles.subtitle}>Enter your email address to get started</Text>

              {/* Email Input Field */}
              <View style={styles.emailInputContainer}>
                <Feather name="mail" size={20} color="#FFFFFF" style={styles.emailIcon} />
                <TextInput
                  style={styles.emailInput}
                  placeholder="Email"
                  placeholderTextColor="#FFFFFF"
                  value={email}
                  onChangeText={setEmail}
                  editable={!isLoading}
                  textContentType="emailAddress"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Continue with Email Button */}
              {!showPasswordField ? (
                <TouchableOpacity
                  onPress={handleContinueWithEmail}
                  style={styles.continueButton}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient 
                    colors={['#00D9FF', '#7000FF']} 
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.continueButtonGradient}
                  >
                    <Text style={styles.continueButtonText}>Continue with email</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <>
                  {/* Password Input Field */}
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={styles.passwordInputField}
                      placeholder="Password"
                      placeholderTextColor="#FFFFFF"
                      value={password}
                      onChangeText={setPassword}
                      editable={!isLoading}
                      secureTextEntry={!isPasswordVisible}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIconContainer}>
                      <Feather
                        name={isPasswordVisible ? 'eye' : 'eye-off'}
                        size={20}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Login Button */}
                  <TouchableOpacity
                    onPress={handleLogin}
                    style={styles.continueButton}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient 
                      colors={['#00D9FF', '#7000FF']} 
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.continueButtonGradient}
                    >
                      <Text style={styles.continueButtonText}>
                        {isLoading ? 'Logging in...' : 'Continue with email'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Back Button */}
                  <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => {
                      setShowPasswordField(false);
                      setPassword('');
                    }}
                  >
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>

                  {/* Sign Up Link */}
                  <TouchableOpacity 
                    style={styles.signupLinkButton} 
                    onPress={() => navigation.navigate('RegFanPage')}
                  >
                    <Text style={styles.signupLinkButtonText}>Sign up</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Separator */}
              {!showPasswordField && (
                <View style={styles.separatorContainer}>
                  <View style={styles.separatorLine} />
                  <Text style={styles.separatorText}>OR sign with</Text>
                  <View style={styles.separatorLine} />
                </View>
              )}

              {/* Social Login Buttons - Side by Side */}
              {!showPasswordField && (
                <View style={styles.socialButtonsContainer}>
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity 
                      style={styles.socialButton} 
                      onPress={handleAppleLogin}
                      disabled={isGoogleLoading}
                      activeOpacity={0.8}
                    >
                      <FontAwesome name="apple" size={22} color="#000000" style={styles.appleIcon} />
                      <Text style={styles.socialButtonText}>Apple</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={styles.socialButton} 
                    onPress={handleGoogleLogin}
                    disabled={isGoogleLoading}
                    activeOpacity={0.8}
                  >
                    <Image 
                      source={require('../assets/images/7123025_logo_google_g_icon-2.png')} 
                      style={styles.socialButtonIcon} 
                    />
                    <Text style={styles.socialButtonText}>Google</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer Links */}
          <View style={styles.bottomLinks}>
            <TouchableOpacity onPress={() => Linking.openURL('https://dayones.live/privacy-policy-2/')}>
              <Text style={styles.bottomLinkText}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.bottomLinkSeparator}> | </Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://dayones.live/safety-standards/')}>
              <Text style={styles.bottomLinkText}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default LoginScreen;
