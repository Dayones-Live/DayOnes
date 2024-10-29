import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, FlatList, TouchableOpacity, Image, SafeAreaView, Modal, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Geolocation from '@react-native-community/geolocation';
import { useSelector, useDispatch } from 'react-redux';
import { setInvitesEnabled } from '../../assets/redux/actions';
import { BASEURL } from '../../assets/constants';
import ProfilePictureButton from '../../assets/components/ProfilePictureButton';

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
    if (intervalId) clearInterval(intervalId);
    setIsLoading(false);
    setCountdown(60);
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
  };

  const renderInviteItem = ({ item }) => (
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
  );

  return (
    <SafeAreaView style={styles.container}>
      <ProfilePictureButton navigation={navigation} />

      <FlatList
        data={invites}
        keyExtractor={(item) => item.id}
        renderItem={renderInviteItem}
        ListEmptyComponent={<Text style={styles.noInviteText}>No Invites Available</Text>}
        contentContainerStyle={{ paddingTop: 65 }} // Added padding to push invites down
      />

      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.fetchButton} onPress={toggleInviteAndFetch}>
          <LinearGradient colors={['#00E5FF', '#D500F9']} style={styles.fetchButtonGradient}>
            <Text style={styles.buttonText}>Get Invites</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

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
  inviteItem: {
    backgroundColor: '#222',
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  inviteText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  inviteButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 5,
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
  controlsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  fetchButton: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  fetchButtonGradient: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  noInviteText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    padding: 20,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  countdownText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  cancelButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#D500F9',
    borderRadius: 10,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default FHomePage;
