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
  Linking,
  Animated
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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [role, setRole] = useState(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const buttonAnim = React.useRef(new Animated.Value(1)).current; // opacity/translateY for buttons
  const formAnim = React.useRef(new Animated.Value(0)).current;   // opacity/translateY for form
  const logoAnim = React.useRef(new Animated.Value(0)).current;   // 0: default, 1: moved up/faded
  const formFieldAnims = [
    React.useRef(new Animated.Value(0)).current, // email
    React.useRef(new Animated.Value(0)).current, // password
    React.useRef(new Animated.Value(0)).current, // login
    React.useRef(new Animated.Value(0)).current, // back
  ];

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

  const animateToForm = () => {
    Animated.parallel([
      Animated.timing(buttonAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowEmailForm(true);
      formAnim.setValue(0);
      formFieldAnims.forEach(anim => anim.setValue(0));
      Animated.sequence([
        Animated.timing(formAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.stagger(80, formFieldAnims.map(anim =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          })
        )),
      ]).start();
    });
  };

  const animateToButtons = () => {
    Animated.parallel([
      Animated.stagger(60, formFieldAnims.slice().reverse().map(anim =>
        Animated.timing(anim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        })
      )),
      Animated.timing(formAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(logoAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowEmailForm(false);
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <ImageBackground
      source={require('../assets/images/LOGINIMAGE.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>
        {/* Logo and App Name at the top, always visible */}
        <Animated.View
          style={[
            styles.centerContent,
            {
              transform: [
                {
                  translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -80] })
                },
                {
                  scale: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.95] })
                }
              ],
              opacity: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.8] })
            },
          ]}
        >
          <Image
            source={require('../assets/images/1024.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>DayOnes</Text>
        </Animated.View>
        {/* Animated content area below logo */}
        <View style={styles.animatedContentArea}>
          {/* Button Group - always rendered, absolutely positioned within this area */}
          <Animated.View
            pointerEvents={showEmailForm ? 'none' : 'auto'}
            style={[
              styles.buttonGroup,
              {
                position: 'absolute',
                left: 0,
                right: 0,
                opacity: buttonAnim,
                transform: [{ translateY: buttonAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
              },
            ]}
          >
            {Platform.OS === 'ios' && (
              <TouchableOpacity style={styles.whiteButton} onPress={handleAppleLogin}>
                <FontAwesome name="apple" size={22} color="#111" style={{ marginRight: 10 }} />
                <Text style={styles.whiteButtonText}>Continue with Apple</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.whiteButton} onPress={handleGoogleLogin}>
              <Image source={require('../assets/images/7123025_logo_google_g_icon-2.png')} style={styles.buttonIcon} />
              <Text style={styles.whiteButtonText}>Continue with Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.darkButton} onPress={animateToForm}>
              <Text style={styles.darkButtonText}>Continue with email</Text>
            </TouchableOpacity>
          </Animated.View>
          {/* Email Form - always rendered, absolutely positioned within this area */}
          <Animated.View
            pointerEvents={showEmailForm ? 'auto' : 'none'}
            style={[
              styles.emailFormContainer,
              {
                position: 'absolute',
                left: 0,
                right: 0,
                opacity: formAnim,
                transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
              },
            ]}
          >
            <Animated.View style={{ width: '100%', opacity: formFieldAnims[0], transform: [{ translateY: formFieldAnims[0].interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }}>
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
            </Animated.View>
            <Animated.View style={{ width: '100%', opacity: formFieldAnims[1], transform: [{ translateY: formFieldAnims[1].interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }}>
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
            </Animated.View>
            <Animated.View style={{ width: '100%', opacity: formFieldAnims[2], transform: [{ translateY: formFieldAnims[2].interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }}>
              <TouchableOpacity
                onPress={handleLogin}
                style={styles.fullButtonContainer}
                disabled={isLoading}
              >
                <LinearGradient colors={['#ff00ff', '#7000ff']} style={styles.loginButton}>
                  <Text style={[styles.buttonText, styles.loginButtonText]}>{isLoading ? 'Logging in...' : 'LOG IN'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
            <Animated.View style={{ opacity: formFieldAnims[3], transform: [{ translateY: formFieldAnims[3].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
              <TouchableOpacity style={styles.backButton} onPress={animateToButtons}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.signupLinkButton} onPress={() => navigation.navigate('RegFanPage')}>
                <Text style={styles.signupLinkButtonText}>Sign up</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>
        <View style={styles.bottomLinks}>
          <TouchableOpacity onPress={() => Linking.openURL('https://dayones.live/privacy-policy-2/')}>
            <Text style={styles.bottomLinkText}>Privacy policy</Text>
          </TouchableOpacity>
          <Text style={styles.bottomLinkText}>  </Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://dayones.live/safety-standards/')}>
            <Text style={styles.bottomLinkText}>Terms of service</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

export default LoginScreen;
