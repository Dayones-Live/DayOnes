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

const FHomePage = ({ navigation }) => {
  const dispatch = useDispatch();
  const invitesFromRedux = useSelector((state) => state.invitesEnabled);
  const { mutate: fetchUser } = useFetchUser();
  const { data: notificationsData } = useNotifications();
  const userProfile = useSelector((state) => state.userProfile);
  const unreadCount = notificationsData?.data?.data?.filter(n => 
    !n.is_read && 
    n.from_user_profile?.id !== userProfile?.data?.id
  )?.length || 0;

  // Initialize notifications and location
  useSetupNotificationsAndLocation();

  const [isInviteEnabled, setIsInviteEnabled] = useState(invitesFromRedux);
  const [invites, setInvites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isPolling, setIsPolling] = useState(false);
  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('authToken');
        if (accessToken) {
          console.log('Access token:', accessToken);
          fetchUser(); // Fetch user data
        } else {
          console.log('No access token found in AsyncStorage, skipping user data fetch.');
        }
      } catch (error) {
        console.error('Error fetching access token:', error);
      }
    };

    fetchUserData();
  }, [fetchUser]); // Include `fetchUser` in the dependency array

  const accessToken = useSelector((state) => state.accessToken);

  useEffect(() => {
    setIsInviteEnabled(invitesFromRedux);
  }, [invitesFromRedux]);

  const toggleInviteAndFetch = () => {
    setIsLoading(true);
    setCountdown(60);
    dispatch(setInvitesEnabled(true));
    setIsInviteEnabled(true);

    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await updateNotificationStatus(latitude, longitude, true);
          startInvitePolling();
        } catch (error) {
          Alert.alert('Error', 'Failed to update invite status');
        }
      },
      (error) => Alert.alert('Error', 'Failed to get location'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const updateNotificationStatus = async (latitude, longitude, notificationsEnabled) => {
    try {
      await fetch(`${BASEURL}/api/v1/user/update-notification-status`, {
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
    } catch (error) {
      throw new Error('Failed to update notification status');
    }
  };

  const startInvitePolling = () => {
    if (isPolling) {
      console.log('Polling is already running, skipping new interval setup.');
      return;
    }

    setIsPolling(true);
    const id = setInterval(async () => {
      await fetchInvites();
      setCountdown((prevCountdown) => {
        if (prevCountdown <= 1) {
          clearInterval(id);
          setIsPolling(false);
          setIsLoading(false);
        }
        return prevCountdown - 1;
      });
    }, 1000); // Poll every 5 seconds
    setIntervalId(id);
    console.log('Polling started with interval ID:', id);
  };

  const handleCancel = () => {
    if (intervalId) {
      console.log('Clearing interval:', intervalId);
      clearInterval(intervalId);
      setIntervalId(null);
      setIsPolling(false); // Reset the polling state
    }
    setIsLoading(false); // Hide the loading modal
    setCountdown(60); // Reset the countdown timer
  };

  const fetchInvites = async () => {
    try {
      const response = await fetch(`${BASEURL}/api/v1/invites`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const responseData = await response.json();
        const pendingInvites = responseData.data.filter((invite) => invite.status === 'PENDING');

        // Sort invites by expiration time - closest to expiration first
        const sortedInvites = pendingInvites.sort((a, b) => {
          const timeA = new Date(a.valid_till).getTime();
          const timeB = new Date(b.valid_till).getTime();
          return timeA - timeB; // Ascending order - earliest expiration first
        });

        console.log('Sorted pending invites:', sortedInvites);
        setInvites(sortedInvites);

        if (sortedInvites.length > 0) {
          console.log('Pending invite detected, stopping polling.');
          handleCancel(); // Stop polling if a pending invite is detected
        }
      }
    } catch (error) {
      console.error('Error fetching invites:', error);
      Alert.alert('Error', 'Failed to fetch invites.');
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
    try {
      await fetch(`${BASEURL}/api/v1/invites/${inviteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: 'ACCEPTED' }),
      });

      // Clear the accepted invite from the UI
      setInvites(prevInvites => prevInvites.filter(invite => invite.id !== inviteId));

      Alert.alert('Success', 'Invite confirmed.');
    } catch (error) {
      console.error('Error confirming invite:', error);
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
        ListHeaderComponent={
          invites.length > 0 ? (
            <View style={styles.invitesHeader}>
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
          <TouchableOpacity
            style={styles.sendButtonGradient}
            onPress={toggleInviteAndFetch}
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
