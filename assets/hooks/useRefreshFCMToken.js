import { useEffect, useRef, useCallback } from 'react';
import messaging from '@react-native-firebase/messaging';
import { Platform, AppState } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { setFcmToken } from '../redux/actions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../../utils/axiosConfig';

const useRefreshFCMToken = () => {
  const dispatch = useDispatch();
  const isRefreshing = useRef(false);
  const lastRefreshTime = useRef(0);
  const refreshAttempts = useRef(0);
  const appState = useRef(AppState.currentState);
  
  // Safely access user from Redux state with default value
  const user = useSelector(state => state?.auth?.user || null);

  // Constants
  const REFRESH_COOLDOWN = 10000; // 10 seconds cooldown
  const MAX_REFRESH_ATTEMPTS = 3;
  const REFRESH_ATTEMPT_RESET_TIME = 60000; // 1 minute
  const MAX_VERIFICATION_ATTEMPTS = 3;
  const TOKEN_VALIDATION_INTERVAL = 300000; // 5 minutes

  const resetRefreshAttempts = useCallback(() => {
    setTimeout(() => {
      refreshAttempts.current = 0;
    }, REFRESH_ATTEMPT_RESET_TIME);
  }, []);

  const clearToken = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('fcmToken');
      dispatch(setFcmToken(null));
      console.log('🗑️ Token cleared from storage');
    } catch (error) {
      console.error('❌ Error clearing token:', error);
    }
  }, [dispatch]);

  const requestNotificationPermission = useCallback(async () => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('✅ Notification permission granted');
        return true;
      } else {
        console.log('⚠️ Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return false;
    }
  }, []);

  const validateToken = useCallback(async (token) => {
    if (!token) return false;
    
    try {
      // Check if we have permission to receive notifications
      const authStatus = await messaging().hasPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('⚠️ Notifications not authorized');
        return false;
      }

      // Try to send a test notification to verify token
      const response = await axiosInstance.post('/api/v1/user-notification/test', {
        token
      });
      return response.data?.success === true;
    } catch (error) {
      console.error('❌ Error validating token:', error);
      return false;
    }
  }, []);

  const refreshFCMToken = useCallback(async () => {
    // Prevent multiple simultaneous refreshes
    if (isRefreshing.current) {
      console.log('🔄 Token refresh already in progress, skipping...');
      return;
    }

    // Check cooldown period
    const now = Date.now();
    if (now - lastRefreshTime.current < REFRESH_COOLDOWN) {
      console.log('⏳ Token refresh on cooldown, skipping...');
      return;
    }

    // Check refresh attempts
    if (refreshAttempts.current >= MAX_REFRESH_ATTEMPTS) {
      console.log('⚠️ Max refresh attempts reached, waiting for reset...');
      return;
    }

    // Check if user is logged in
    if (!user?.id) {
      console.log('⚠️ User not logged in, skipping token refresh');
      return;
    }

    try {
      isRefreshing.current = true;
      lastRefreshTime.current = now;
      refreshAttempts.current += 1;
      console.log(`🔄 Starting FCM token refresh process (attempt ${refreshAttempts.current}/${MAX_REFRESH_ATTEMPTS})...`);

      // Request notification permission if not granted
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        throw new Error('Notification permission not granted');
      }

      // Clear existing token first
      await clearToken();

      // Delete the old token from Firebase
      try {
        await messaging().deleteToken();
        console.log('🗑️ Old FCM token deleted from Firebase');
      } catch (error) {
        console.log('⚠️ Error deleting old token from Firebase:', error);
      }

      // Register for remote messages (required for Android)
      if (Platform.OS === 'android') {
        try {
          await messaging().registerDeviceForRemoteMessages();
          console.log('📱 Device registered for remote messages');
        } catch (error) {
          console.error('❌ Error registering device for remote messages:', error);
          throw error;
        }
      }

      // Get new token
      const fcmToken = await messaging().getToken();
      console.log('🔔 New FCM Token:', fcmToken);
      console.log('📱 Device Platform:', Platform.OS);
      console.log('🔄 FCM Token Length:', fcmToken.length);

      // Store in Redux
      dispatch(setFcmToken(fcmToken));
      console.log('✅ FCM Token stored in Redux');

      // Store in AsyncStorage
      await AsyncStorage.setItem('fcmToken', fcmToken);
      console.log('✅ FCM Token stored in AsyncStorage');

      // Send to backend and verify
      let verificationAttempts = 0;
      let isTokenVerified = false;

      while (verificationAttempts < MAX_VERIFICATION_ATTEMPTS && !isTokenVerified) {
        try {
          // First, ensure we have a valid user ID
          if (!user?.id) {
            throw new Error('User ID is required to register notification token');
          }

          console.log('🔄 Registering FCM token for user:', user.id);
          console.log('📱 Device Platform:', Platform.OS);
          console.log('🔑 Token:', fcmToken);

          // Send token to backend with user ID and platform info
          const response = await axiosInstance.post('/api/v1/user-notification/token', 
            new URLSearchParams({
              notificationToken: fcmToken,
              userId: user.id,
              platform: Platform.OS,
              deviceId: await messaging().getDeviceToken?.() || 'unknown'
            }).toString(),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              }
            }
          );
          console.log('✅ FCM Token registration response:', response.data);

          // Wait a bit before verifying to allow backend to process
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Verify token with backend
          console.log('🔍 Verifying token with backend...');
          const verifyResponse = await axiosInstance.get('/api/v1/user-notification/token/verify', {
            params: { 
              token: fcmToken,
              userId: user.id
            }
          });

          if (verifyResponse.data?.isValid) {
            console.log('✅ Token verified with backend');
            isTokenVerified = true;
            break;
          } else {
            console.log('⚠️ Token verification failed:', verifyResponse.data);
            verificationAttempts++;
            
            // If verification fails, try to re-register the token
            if (verificationAttempts < MAX_VERIFICATION_ATTEMPTS) {
              console.log('🔄 Attempting to re-register token...');
              await new Promise(resolve => setTimeout(resolve, 2000));
              continue;
            }
          }
        } catch (error) {
          console.error('❌ Error in token registration/verification:', error);
          console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
          });
          
          verificationAttempts++;
          
          if (error.response?.data?.error === 'messaging/mismatched-credential' || 
              error.response?.data?.error === 'SenderId mismatch' ||
              error.response?.data?.error === 'messaging/registration-token-not-registered') {
            console.log('⚠️ Token registration issue detected, will retry token refresh...');
            await clearToken();
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Retry the refresh if we haven't hit the max attempts
            if (refreshAttempts.current < MAX_REFRESH_ATTEMPTS) {
              return refreshFCMToken();
            }
          }
          throw error;
        }
      }

      if (!isTokenVerified) {
        throw new Error('Failed to verify token with backend after multiple attempts');
      }

      // Reset refresh attempts on success
      refreshAttempts.current = 0;
      return fcmToken;
    } catch (error) {
      console.error('❌ Error in FCM token refresh:', error);
      await clearToken();
      throw error;
    } finally {
      isRefreshing.current = false;
      // Start the reset timer for refresh attempts
      resetRefreshAttempts();
    }
  }, [user, dispatch, clearToken, requestNotificationPermission, validateToken, resetRefreshAttempts]);

  // Set up token refresh listener
  useEffect(() => {
    const unsubscribe = messaging().onTokenRefresh(async (fcmToken) => {
      console.log('🔄 FCM token refreshed automatically');
      try {
        await refreshFCMToken();
      } catch (error) {
        console.error('❌ Error handling token refresh:', error);
      }
    });

    // Set up message handler for token registration errors
    const messageHandler = messaging().onMessage(async remoteMessage => {
      console.log('📱 FCM message received:', remoteMessage);
      
      // Check for token registration errors
      if (remoteMessage.data?.error === 'messaging/registration-token-not-registered' ||
          remoteMessage.data?.error === 'messaging/mismatched-credential' ||
          remoteMessage.data?.error === 'SenderId mismatch') {
        console.log('⚠️ Token registration issue detected in message, refreshing token...');
        await refreshFCMToken();
      }
    });

    // Set up periodic token validation
    const validationInterval = setInterval(async () => {
      const currentToken = await AsyncStorage.getItem('fcmToken');
      if (currentToken) {
        const isValid = await validateToken(currentToken);
        if (!isValid) {
          console.log('⚠️ Token validation failed during periodic check, refreshing...');
          await refreshFCMToken();
        }
      }
    }, TOKEN_VALIDATION_INTERVAL);

    // Initial token registration after login
    const initialTokenRegistration = async () => {
      if (user?.id) {
        console.log('👤 User logged in, attempting initial token registration...');
        try {
          // Wait for authentication to be fully complete
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const hasPermission = await requestNotificationPermission();
          if (hasPermission) {
            // Try to register token multiple times if needed
            let registrationAttempts = 0;
            const MAX_REGISTRATION_ATTEMPTS = 3;
            
            while (registrationAttempts < MAX_REGISTRATION_ATTEMPTS) {
              try {
                console.log(`🔄 Attempting token registration (attempt ${registrationAttempts + 1}/${MAX_REGISTRATION_ATTEMPTS})...`);
                
                // Clear any existing token first
                await clearToken();
                
                // Get new token
                const fcmToken = await messaging().getToken();
                console.log('🔔 New FCM Token:', fcmToken);
                console.log('📱 Device Platform:', Platform.OS);
                console.log('👤 User ID:', user.id);
                
                // Store in Redux and AsyncStorage
                dispatch(setFcmToken(fcmToken));
                await AsyncStorage.setItem('fcmToken', fcmToken);
                
                // Send to backend with retry
                let backendAttempts = 0;
                const MAX_BACKEND_ATTEMPTS = 3;
                
                while (backendAttempts < MAX_BACKEND_ATTEMPTS) {
                  try {
                    console.log(`🔄 Sending token to backend (attempt ${backendAttempts + 1}/${MAX_BACKEND_ATTEMPTS})...`);
                    
                    // First, ensure we have a valid user ID
                    if (!user?.id) {
                      throw new Error('User ID is required to register notification token');
                    }

                    const response = await axiosInstance.post('/api/v1/user-notification/token', 
                      new URLSearchParams({
                        notificationToken: fcmToken,
                        userId: user.id,
                        platform: Platform.OS,
                        deviceId: await messaging().getDeviceToken?.() || 'unknown'
                      }).toString(),
                      {
                        headers: {
                          'Content-Type': 'application/x-www-form-urlencoded',
                        }
                      }
                    );
                    
                    console.log('✅ Token sent to backend:', response.data);
                    
                    // Wait a bit before verifying to allow backend to process
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Verify token was registered
                    const verifyResponse = await axiosInstance.get('/api/v1/user-notification/token/verify', {
                      params: { 
                        token: fcmToken,
                        userId: user.id
                      }
                    });
                    
                    if (verifyResponse.data?.isValid) {
                      console.log('✅ Token verified with backend');
                      return true;
                    }
                    
                    throw new Error('Token verification failed');
                  } catch (error) {
                    console.error('❌ Error sending token to backend:', error);
                    console.error('Error details:', {
                      message: error.message,
                      response: error.response?.data,
                      status: error.response?.status
                    });
                    
                    backendAttempts++;
                    
                    if (backendAttempts < MAX_BACKEND_ATTEMPTS) {
                      console.log('⚠️ Retrying backend registration...');
                      await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                  }
                }
                
                registrationAttempts++;
                if (registrationAttempts < MAX_REGISTRATION_ATTEMPTS) {
                  console.log('⚠️ Token registration not verified, retrying...');
                  await new Promise(resolve => setTimeout(resolve, 2000));
                }
              } catch (error) {
                console.error('❌ Error in token registration attempt:', error);
                registrationAttempts++;
                if (registrationAttempts < MAX_REGISTRATION_ATTEMPTS) {
                  await new Promise(resolve => setTimeout(resolve, 2000));
                }
              }
            }
            
            if (registrationAttempts >= MAX_REGISTRATION_ATTEMPTS) {
              console.error('❌ Failed to register token after multiple attempts');
            }
          }
        } catch (error) {
          console.error('❌ Error in initial token registration:', error);
        }
      }
    };

    // Run initial registration when user changes
    initialTokenRegistration();

    return () => {
      unsubscribe();
      messageHandler();
      clearInterval(validationInterval);
    };
  }, [refreshFCMToken, validateToken, user]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('🔄 App has come to the foreground');
        if (user?.id) {
          refreshFCMToken();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [refreshFCMToken, user]);

  return { refreshFCMToken, requestNotificationPermission };
};

export default useRefreshFCMToken; 