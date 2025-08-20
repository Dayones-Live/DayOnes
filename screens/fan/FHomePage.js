import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Alert,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Geolocation from '@react-native-community/geolocation';
import { useSelector, useDispatch } from 'react-redux';
import { setInvitesEnabled } from '../../assets/redux/actions';
import { BASEURL } from '../../assets/constants';
import ProfilePictureButton from '../../assets/components/ProfilePictureButton1';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import useFetchUser from '../../assets/hooks/useFetchUser';
import styles from './fanStyles/FHomePageStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import useNotifications from '../../assets/hooks/useNotifications';
import useSetupNotificationsAndLocation from '../../assets/hooks/useSetupNotificationsAndLocation';
import { useFocusEffect } from '@react-navigation/native';

const FHomePage = ({ navigation }) => {
  const dispatch = useDispatch();
  const invitesFromRedux = useSelector((state) => state.invitesEnabled);
  const { mutate: fetchUser, isSuccess: fetchUserSuccess, isError: fetchUserError, error: fetchUserErrorData } = useFetchUser();
  const { data: notificationsData } = useNotifications();
  const userProfile = useSelector((state) => state.userProfile);
  const unreadCount = notificationsData?.data?.data?.filter(n => 
    !n.is_read && 
    n.from_user_profile?.id !== userProfile?.data?.id
  )?.length || 0;

  // Log when useFetchUser state changes
  useEffect(() => {
    console.log('🔄 useFetchUser state changed:', {
      isSuccess: fetchUserSuccess,
      isError: fetchUserError,
      error: fetchUserErrorData
    });
  }, [fetchUserSuccess, fetchUserError, fetchUserErrorData]);

  // Initialize notifications and location
  useSetupNotificationsAndLocation();

  // Add focus effect to log when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🎯 FHomePage screen focused');
      console.log('🔑 Access token present:', !!accessToken);
      console.log('👤 User profile:', userProfile);
      console.log('📋 Current invites state:', invites);
      console.log('🔄 Is polling:', isPolling);
      console.log('⏰ Countdown:', countdown);
      console.log('🔄 Is loading:', isLoading);
    }, [accessToken, userProfile, invites, isPolling, countdown, isLoading])
  );

  const [isInviteEnabled, setIsInviteEnabled] = useState(invitesFromRedux);
  const [invites, setInvites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isPolling, setIsPolling] = useState(false);
  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    console.log('🔄 FHomePage useEffect - fetchUserData called');
    const fetchUserData = async () => {
      try {
        console.log('🔍 Checking AsyncStorage for auth token...');
        const accessToken = await AsyncStorage.getItem('authToken');
        if (accessToken) {
          console.log('✅ Access token found in AsyncStorage');
          console.log('🔑 Token length:', accessToken.length);
          console.log('🔑 Token preview:', accessToken.substring(0, 20) + '...');
          console.log('👤 Calling fetchUser()...');
          fetchUser(); // Fetch user data
        } else {
          console.log('❌ No access token found in AsyncStorage, skipping user data fetch.');
        }
      } catch (error) {
        console.error('❌ Error fetching access token from AsyncStorage:', error);
      }
    };

    fetchUserData();
  }, [fetchUser]); // Include `fetchUser` in the dependency array

  const accessToken = useSelector((state) => state.accessToken);

  useEffect(() => {
    console.log('🔄 FHomePage useEffect - invitesFromRedux changed:', invitesFromRedux);
    setIsInviteEnabled(invitesFromRedux);
  }, [invitesFromRedux]);

  useEffect(() => {
    console.log('🔄 FHomePage useEffect - accessToken changed:', !!accessToken);
    console.log('🔄 FHomePage useEffect - userProfile changed:', userProfile);
  }, [accessToken, userProfile]);

  useEffect(() => {
    console.log('🔄 FHomePage useEffect - invites state changed:', invites);
    console.log('🔄 FHomePage useEffect - invites length:', invites.length);
  }, [invites]);

  useEffect(() => {
    console.log('🔄 FHomePage useEffect - isPolling state changed:', isPolling);
  }, [isPolling]);

  useEffect(() => {
    console.log('🔄 FHomePage useEffect - isLoading state changed:', isLoading);
  }, [isLoading]);

  useEffect(() => {
    console.log('🔄 FHomePage useEffect - countdown state changed:', countdown);
  }, [countdown]);

  useEffect(() => {
    console.log('🔄 FHomePage useEffect - intervalId state changed:', intervalId);
  }, [intervalId]);

  useEffect(() => {
    console.log('🔄 FHomePage useEffect - component mounted');
    
    return () => {
      console.log('🔄 FHomePage useEffect - component unmounting');
      if (intervalId) {
        console.log('🔄 Clearing interval on component unmount:', intervalId);
        clearInterval(intervalId);
      }
      setIsPolling(false); // Ensure polling state is reset
    };
  }, [intervalId]);

  const toggleInviteAndFetch = () => {
    console.log('🚀 toggleInviteAndFetch called');
    console.log('📍 Current access token:', accessToken ? 'Present' : 'Missing');
    console.log('👤 Current user profile:', userProfile);
    
    setIsLoading(true);
    setCountdown(60);
    dispatch(setInvitesEnabled(true));
    setIsInviteEnabled(true);

    console.log('📍 Getting current position...');
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('📍 Location obtained:', { latitude, longitude });
        
        try {
          console.log('📡 Updating notification status...');
          await updateNotificationStatus(latitude, longitude, true);
          console.log('✅ Notification status updated successfully');
          
          console.log('🔄 Starting invite polling...');
          startInvitePolling();
        } catch (error) {
          console.error('❌ Error updating invite status:', error);
          Alert.alert('Error', 'Failed to update invite status');
        }
      },
      (error) => {
        console.error('❌ Geolocation error:', error);
        Alert.alert('Error', 'Failed to get location');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const updateNotificationStatus = async (latitude, longitude, notificationsEnabled) => {
    console.log('📡 updateNotificationStatus called with:', { latitude, longitude, notificationsEnabled });
    try {
      const response = await fetch(`${BASEURL}/api/v1/user/update-notification-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          longitude: longitude.toString(),
          latitude: latitude.toString(),
          notificationsEnabled,
        }),
      });
      
      console.log('📡 Notification status update response status:', response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Notification status update successful:', responseData);
      } else {
        const errorData = await response.text();
        console.error('❌ Notification status update failed:', response.status, errorData);
      }
    } catch (error) {
      console.error('❌ Error in updateNotificationStatus:', error);
      throw new Error('Failed to update notification status');
    }
  };

  const startInvitePolling = () => {
    if (isPolling) {
      console.log('⚠️ Polling is already running, skipping new interval setup.');
      return;
    }

    console.log('🔄 Starting invite polling...');
    setIsPolling(true);
    const id = setInterval(async () => {
      console.log('⏰ Polling interval triggered, countdown:', countdown);
      await fetchInvites();
      setCountdown((prevCountdown) => {
        if (prevCountdown <= 1) {
          console.log('⏰ Countdown finished, stopping polling');
          clearInterval(id);
          setIsPolling(false);
          setIsLoading(false);
        }
        return prevCountdown - 1;
      });
    }, 1000); // Poll every 1 second
    setIntervalId(id);
    console.log('✅ Polling started with interval ID:', id);
  };

  const handleCancel = () => {
    console.log('🛑 handleCancel called');
    if (intervalId) {
      console.log('🔄 Clearing interval:', intervalId);
      clearInterval(intervalId);
      setIntervalId(null);
      setIsPolling(false); // Reset the polling state
    }
    setIsLoading(false); // Hide the loading modal
    setCountdown(60); // Reset the countdown timer
    console.log('✅ Polling cancelled and reset');
  };

  const fetchInvites = async () => {
    console.log('🔍 fetchInvites called');
    console.log('🔑 Access token present:', !!accessToken);
    console.log('👤 User profile:', userProfile);
    
    if (!accessToken) {
      console.error('❌ No access token available for fetching invites');
      return;
    }

    try {
      console.log('📡 Making API request to:', `${BASEURL}/api/v1/invites`);
      const response = await fetch(`${BASEURL}/api/v1/invites`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log('📡 Invites API response status:', response.status);
      console.log('📡 Invites API response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const responseData = await response.json();
        console.log('📦 Raw invites response data:', responseData);
        
        if (responseData.data && Array.isArray(responseData.data)) {
          console.log('📊 Total invites received:', responseData.data.length);
          console.log('📋 All invites:', responseData.data);
          
          const pendingInvites = responseData.data.filter((invite) => invite.status === 'PENDING');
          console.log('⏳ Pending invites found:', pendingInvites.length);
          console.log('⏳ Pending invite details:', pendingInvites);

          // Sort invites by expiration time - closest to expiration first
          const sortedInvites = pendingInvites.sort((a, b) => {
            const timeA = new Date(a.valid_till).getTime();
            const timeB = new Date(b.valid_till).getTime();
            return timeA - timeB; // Ascending order - earliest expiration first
          });

          console.log('🕒 Sorted pending invites:', sortedInvites);
          console.log('🔄 Setting invites state to:', sortedInvites);
          setInvites(sortedInvites);

          if (sortedInvites.length > 0) {
            console.log('🎉 Pending invite detected, stopping polling.');
            handleCancel(); // Stop polling if a pending invite is detected
          } else {
            console.log('📭 No pending invites found, continuing to poll...');
          }
        } else {
          console.warn('⚠️ Response data is not an array:', responseData.data);
          setInvites([]);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Invites API request failed:', response.status, errorText);
        console.error('❌ Response headers:', Object.fromEntries(response.headers.entries()));
        setInvites([]);
      }
    } catch (error) {
      console.error('❌ Error fetching invites:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      Alert.alert('Error', 'Failed to fetch invites.');
      setInvites([]);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalId) {
        console.log('Clearing interval on component unmount:', intervalId);
        clearInterval(intervalId);
      }
      setIsPolling(false); // Ensure polling state is reset
    };
  }, [intervalId]);

  const handleConfirmInvite = async (inviteId, artistPostId) => {
    console.log('✅ handleConfirmInvite called with:', { inviteId, artistPostId });
    console.log('🔑 Access token present:', !!accessToken);
    console.log('👤 Current user profile:', userProfile);
    
    try {
      console.log('📡 Making PATCH request to:', `${BASEURL}/api/v1/invites/${inviteId}`);
      console.log('📡 Request body:', { status: 'ACCEPTED' });
      
      const response = await fetch(`${BASEURL}/api/v1/invites/${inviteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: 'ACCEPTED' }),
      });

      console.log('📡 Confirm invite response status:', response.status);
      console.log('📡 Confirm invite response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Invite confirmation successful:', responseData);
        
        // Clear the accepted invite from the UI
        console.log('🔄 Updating invites state, removing invite:', inviteId);
        setInvites(prevInvites => {
          const newInvites = prevInvites.filter(invite => invite.id !== inviteId);
          console.log('🔄 New invites state:', newInvites);
          return newInvites;
        });

        Alert.alert('Success', 'Invite confirmed.');
      } else {
        const errorText = await response.text();
        console.error('❌ Invite confirmation failed:', response.status, errorText);
        Alert.alert('Error', 'Failed to confirm invite.');
      }
    } catch (error) {
      console.error('❌ Error confirming invite:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      Alert.alert('Error', 'Failed to confirm invite.');
    }
  };

  const handleDenyInvite = async (inviteId) => {
    Alert.alert(
      'Deny this invite?',
      'Are you sure you want to deny this invite?',
      [
        {
          text: 'No, don\'t deny',
          style: 'cancel',
        },
        {
          text: 'Yes, deny',
          onPress: () => {
            Alert.alert(
              'Last Chance',
              'This invite will be permanently deleted. Are you sure?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Confirm',
                  onPress: async () => {
                    try {
                      await fetch(`${BASEURL}/api/v1/invites/${inviteId}`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${accessToken}`,
                        },
                        body: JSON.stringify({ status: 'REJECTED' }),
                      });
                      
                      // Remove the declined invite from the UI immediately
                      setInvites(prevInvites => prevInvites.filter(invite => invite.id !== inviteId));
                      
                      Alert.alert('Success', 'Invite denied.');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to deny invite.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleAcceptAllInvites = async () => {
    Alert.alert(
      'Accept All Invites?',
      `Are you sure you want to accept all ${invites.length} invite${invites.length !== 1 ? 's' : ''}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Accept All',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // Accept all invites in parallel
              const acceptPromises = invites.map(invite => 
                fetch(`${BASEURL}/api/v1/invites/${invite.id}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                  },
                  body: JSON.stringify({ status: 'ACCEPTED' }),
                })
              );

              await Promise.all(acceptPromises);
              
              // Clear all invites from the UI
              setInvites([]);
              
              // Stop polling and reset invite status
              handleCancel();
              dispatch(setInvitesEnabled(false));
              setIsInviteEnabled(false);
              
              Alert.alert('Success', `All ${invites.length} invite${invites.length !== 1 ? 's' : ''} accepted!`);
            } catch (error) {
              console.error('Error accepting all invites:', error);
              Alert.alert('Error', 'Failed to accept all invites. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderInviteItem = ({ item }) => (
    <View style={styles.inviteCard}>
      <LinearGradient 
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']} 
        style={styles.inviteCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header with user info */}
        <View style={styles.inviteHeader}>
          <View style={styles.userInfoContainer}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: item.user.avatar_url }} style={styles.avatar} />
              <View style={styles.onlineIndicator} />
            </View>
            <Text style={styles.userName}>{item.user.full_name}</Text>
            <Text style={styles.inviteLabel}>sent you an invite</Text>
          </View>
        </View>

        {/* Invite details */}
        <View style={styles.inviteDetails}>
          <View style={styles.validityContainer}>
            <FontAwesome name="clock-o" size={14} color="#888" />
            <Text style={styles.validityText}>
              Valid until {new Date(item.valid_till).toLocaleDateString()} at {new Date(item.valid_till).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.denyButton}
            onPress={() => handleDenyInvite(item.id)}
          >
            <FontAwesome name="times" size={16} color="#FF6B6B" />
            <Text style={styles.denyButtonText}>Decline</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => handleConfirmInvite(item.id, item.artist_post_id)}
          >
            <LinearGradient
              colors={['#00E5FF', '#D500F9']}
              style={styles.confirmButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <FontAwesome name="check" size={16} color="white" />
              <Text style={styles.confirmButtonText}>Accept</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {console.log('🎨 FHomePage render - Current state:', {
        invitesLength: invites.length,
        isPolling,
        isLoading,
        countdown,
        accessToken: !!accessToken,
        userProfile: !!userProfile
      })}
      
      <ProfilePictureButton navigation={navigation} />
      
      {/* Add notification button */}
      <TouchableOpacity 
        style={styles.notificationButton} 
        onPress={() => navigation.navigate('Notifications')}
      >
        <FontAwesome name="bell" size={24} color="white" />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Header Section for Logo and Text */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/1024.png')}
          style={styles.logo}
        />
        <Text style={styles.personalMediaText}>DayOnes Live</Text>
      </View>

      <FlatList
        data={invites}
        keyExtractor={(item) => item.id}
        renderItem={renderInviteItem}
        contentContainerStyle={{ paddingTop: hp('2%') }}
        onLayout={() => console.log('📱 FlatList onLayout - invites data:', invites)}
        ListHeaderComponent={
          invites.length > 0 ? (
            <View style={styles.invitesHeader}>
              {console.log('📋 Rendering invites header with', invites.length, 'invites')}
              <Text style={styles.invitesCountText}>
                You have {invites.length} invite{invites.length !== 1 ? 's' : ''}!
              </Text>
              <TouchableOpacity
                style={styles.acceptAllButton}
                onPress={handleAcceptAllInvites}
              >
                <LinearGradient
                  colors={['#00E5FF', '#D500F9']}
                  style={styles.acceptAllButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialIcons name="check-circle" size={18} color="white" />
                  <Text style={styles.acceptAllButtonText}>Accept All</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* Static Placeholder Image and Text */}
      {invites.length === 0 && (
        <View style={styles.staticContainer}>
          {console.log('🖼️ Rendering static placeholder - no invites available')}
          <Image
            source={require('../../assets/images/ArtistHomePagePlaceholder2.jpg')}
            style={styles.staticPlaceholderImage}
          />
          <Text style={styles.staticOverlayText}>Autographs & Invites</Text>
        </View>
      )}

      {/* Fixed "Get Invites" Button */}
      {invites.length === 0 && (
        <View style={styles.fixedButtonContainer}>
          {console.log('🔘 Rendering Get Invites button - no invites available')}
          <TouchableOpacity
            style={styles.sendButtonGradient}
            onPress={() => {
              console.log('👆 Get Invites button pressed');
              console.log('📍 Current state before toggleInviteAndFetch:', {
                invitesLength: invites.length,
                isPolling,
                isLoading,
                accessToken: !!accessToken,
                userProfile: !!userProfile
              });
              toggleInviteAndFetch();
            }}
          >
            <LinearGradient
              colors={['#00E5FF', '#D500F9']}
              style={styles.sendButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.sendButtonText}>Get Invites</Text>
            </LinearGradient>
          </TouchableOpacity>
          <View style={styles.patentText}>
            <Text style={styles.patentLabel}>U.S Patent </Text>
            <Text style={styles.patentNumber}>#10749935</Text>
          </View>
        </View>
      )}

      <Modal visible={isLoading} transparent={true} animationType="fade">
        <View style={styles.modalBackground}>
          <ActivityIndicator size="large" color="#D500F9" />
          <Text style={styles.countdownText}>Checking invites... {countdown}s</Text>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default FHomePage;
