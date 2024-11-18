import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
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

const FHomePage = ({ navigation }) => {
  const dispatch = useDispatch();
  const invitesFromRedux = useSelector((state) => state.invitesEnabled);
  const accessToken = useSelector((state) => state.accessToken);

  const [isInviteEnabled, setIsInviteEnabled] = useState(invitesFromRedux);
  const [invites, setInvites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [intervalId, setIntervalId] = useState(null);

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
    const id = setInterval(() => {
      fetchInvites();
      setCountdown((prevCountdown) => {
        if (prevCountdown <= 1) {
          clearInterval(id);
          setIsLoading(false);
        }
        return prevCountdown - 1;
      });
    }, 1000);
    setIntervalId(id);
  };

  const handleCancel = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsLoading(false); // Hide the modal
    setCountdown(60);    // Reset countdown
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

        setInvites(pendingInvites);

        if (pendingInvites.length > 0) {
          handleCancel();
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch invites.');
    }
  };

  const handleConfirmInvite = async (inviteId) => {
    try {
      await fetch(`${BASEURL}/api/v1/invites/${inviteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: 'ACCEPTED' }),
      });
      fetchInvites();
      Alert.alert('Success', 'Invite confirmed.');
    } catch (error) {
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
                      fetchInvites();
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

  const renderInviteItem = ({ item }) => (
    <LinearGradient colors={['#0c002b', '#1b0248']} style={styles.inviteItemGradient}>
      <View style={styles.inviteItem}>
        <View style={styles.userInfoContainer}>
          <Image source={{ uri: item.user.avatar_url }} style={styles.avatar} />
          <Text style={styles.userName}>{item.user.full_name}</Text>
        </View>
        <Text style={styles.inviteText}>Invite valid until: {new Date(item.valid_till).toLocaleString()}</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.inviteButton, styles.confirmButton]} onPress={() => handleConfirmInvite(item.id)}>
            <Text style={styles.buttonText}>Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.inviteButton, styles.denyButton]} onPress={() => handleDenyInvite(item.id)}>
            <Text style={styles.buttonText}>Deny</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ProfilePictureButton navigation={navigation} />

      {/* Header Section for Logo and Text */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/1024.png')}
          style={styles.logo}
        />
        <Text style={styles.personalMediaText}>Personal Media</Text>
      </View>

      <FlatList
        data={invites}
        keyExtractor={(item) => item.id}
        renderItem={renderInviteItem}
        contentContainerStyle={{ paddingTop: hp('10%') }}
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
          <LinearGradient
            colors={['#00E5FF', '#D500F9']}
            style={styles.sendButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <TouchableOpacity style={styles.sendButton} onPress={toggleInviteAndFetch}>
              <Text style={styles.sendButtonText}>Get Invites</Text>
            </TouchableOpacity>
          </LinearGradient>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    alignItems: 'center',
    paddingVertical: hp('2%'), // Space around the header
  },
  logo: {
    width: wp('15%'), // Adjust to desired size
    height: hp('6%'),
    resizeMode: 'contain',
    top:'-10%',
  },
  cancelButton: {
    marginTop: 20,
    backgroundColor: 'red',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  personalMediaText: {
    color: '#C0C0C0',
    fontSize: wp('5%'), // Font size for "Personal Media"
    fontWeight: 'bold',
    marginTop: hp('-0.9%'),
  },
  inviteItemGradient: {
    marginVertical: hp('1%'),
    borderRadius: wp('2%'),
    marginHorizontal: wp('2%'),
  },
  inviteItem: {
    padding: wp('3%'),
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  avatar: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    marginRight: wp('2%'),
  },
  userName: {
    fontSize: wp('4%'),
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  inviteText: {
    color: '#FFFFFF',
    fontSize: wp('3.5%'),
    marginBottom: hp('1%'),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp('1%'),
  },
  inviteButton: {
    flex: 1,
    paddingVertical: hp('1%'),
    marginHorizontal: wp('1%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  denyButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  countdownText: {
    color: '#fff',
    fontSize: wp('4%'),
    marginTop: hp('1%'),
  },
  // Static Placeholder Image and Text
  staticContainer: {
    position: 'absolute',
    top: hp('20%'),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: -1,
  },
  staticPlaceholderImage: {
    width: wp('125%'),
    height: hp('100%'),
    resizeMode: 'contain',
    top:'-38.4%',
  },
  staticOverlayText: {
    position: 'absolute',
    top: '1.7%',
    textAlign: 'center',
    color: '#c0c0c0',
    fontSize: wp('5%'),
    fontWeight: 'bold',
  },
  // Fixed Button Styling
  fixedButtonContainer: {
    position: 'absolute',
    bottom: hp('2%'),
    left: wp('0%'),
    right: wp('0%'),
    alignItems: 'center',
  },
  sendButtonGradient: {
    paddingVertical: hp('2%'),
    borderRadius: wp('3%'),
    width: '100%',
    alignItems: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
  },
});

export default FHomePage;
