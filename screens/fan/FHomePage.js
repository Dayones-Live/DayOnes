import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, Alert, FlatList, TouchableOpacity, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Geolocation from '@react-native-community/geolocation';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { setInvitesEnabled } from '../../assets/redux/actions';
import { BASEURL } from '../../assets/constants';

const FHomePage = () => {
  const dispatch = useDispatch();
  const invitesFromRedux = useSelector((state) => state.invitesEnabled);
  const accessToken = useSelector((state) => state.accessToken);

  const [isInviteEnabled, setIsInviteEnabled] = useState(invitesFromRedux);
  const [invites, setInvites] = useState([]);

  useEffect(() => {
    setIsInviteEnabled(invitesFromRedux); // Sync local state with Redux state
  }, [invitesFromRedux]);

  // Refetch invites whenever the page is focused
  useFocusEffect(
    useCallback(() => {
      if (isInviteEnabled) {
        fetchInvites();
      }
    }, [isInviteEnabled])
  );

  const toggleInvite = async (value) => {
    setIsInviteEnabled(value); // Update local state
    dispatch(setInvitesEnabled(value)); // Dispatch to Redux
    console.log('Toggling invites:', value);

    // Fetch current location and make API call
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('User location:', { latitude, longitude });

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
              notificationsEnabled: value,
            }),
          });

          const responseData = await response.json();
          console.log('Update invite status response:', responseData);

          if (response.ok) {
            // Automatically fetch invites if enabled
            if (value) {
              fetchInvites();
            }
          } else {
            console.error(`Failed to update invite status. Status: ${response.status}`);
          }
        } catch (error) {
          console.error('Error updating invite status:', error);
          Alert.alert('Error', 'Failed to update invite status');
        }
      },
      (error) => {
        console.error('Failed to get location:', error);
        Alert.alert('Error', 'Failed to get location');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const fetchInvites = async () => {
    if (!isInviteEnabled) {
      Alert.alert('Please Enable Invites', 'Enable invites to fetch invites.');
      return;
    }

    try {
      console.log('Fetching invites from API...');
      const response = await fetch(`${BASEURL}/api/v1/invites`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseData = await response.json();
      console.log('Invites data:', responseData);

      if (response.ok) {
        // Filter only invites with status "PENDING"
        const pendingInvites = responseData.data.filter((invite) => invite.status === 'PENDING');
        setInvites(pendingInvites);
      } else {
        console.error(`Failed to fetch invites. Status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching invites:', error);
      Alert.alert('Error', 'Failed to fetch invites.');
    }
  };

  const handleConfirmInvite = async (inviteId) => {
    try {
      const response = await fetch(`${BASEURL}/api/v1/invites/${inviteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: 'ACCEPTED' }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Invite confirmed.');
        fetchInvites();
      } else {
        throw new Error(`Failed to confirm invite. Status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error confirming invite:', error);
      Alert.alert('Error', 'Failed to confirm invite.');
    }
  };

  const handleDenyInvite = async (inviteId) => {
    try {
      const response = await fetch(`${BASEURL}/api/v1/invites/${inviteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: 'REJECTED' }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Invite denied.');
        fetchInvites();
      } else {
        throw new Error(`Failed to deny invite. Status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error denying invite:', error);
      Alert.alert('Error', 'Failed to deny invite.');
    }
  };

  const renderInviteItem = ({ item }) => {
    console.log("Invite Data:", item); // Log out all data for each invite

    // Format date to show time first before date
    const validTillDate = new Date(item.valid_till);
    const formattedDate = `${validTillDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ${validTillDate.toLocaleDateString()}`;

    return (
      <View style={styles.inviteItem}>
        <View style={styles.userInfoContainer}>
          <Image source={{ uri: item.user.avatar_url }} style={styles.avatar} />
          <Text style={styles.userName}>{item.user.full_name}</Text>
        </View>

        {/* Invite Validity */}
        <Text style={styles.inviteText}>Invite valid until: {formattedDate}</Text>

        {/* Confirm and Deny Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.inviteButton, styles.confirmButton]}
            onPress={() => handleConfirmInvite(item.id)}
          >
            <Text style={styles.buttonText}>Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.inviteButton, styles.denyButton]}
            onPress={() => handleDenyInvite(item.id)}
          >
            <Text style={styles.buttonText}>Deny</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#00ffcc', '#0099cc']} style={styles.header}>
        <Text style={styles.headerText}>DayOnes Invites</Text>
      </LinearGradient>

      <FlatList
        data={invites}
        keyExtractor={(item) => item.id}
        renderItem={renderInviteItem}
        ListEmptyComponent={<Text style={styles.noInviteText}>No Invites Available</Text>}
      />

      {/* Controls only visible if invites are disabled */}
      {!isInviteEnabled && (
        <View style={styles.controlsContainer}>
          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>{isInviteEnabled ? 'Invites Enabled' : 'Invites Disabled'}</Text>
            <Switch
              value={isInviteEnabled}
              onValueChange={toggleInvite}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isInviteEnabled ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>

          <TouchableOpacity style={styles.fetchButton} onPress={fetchInvites}>
            <Text style={styles.buttonText}>Get Invites</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c002b',
  },
  header: {
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
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
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 10,
  },
  switchText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  fetchButton: {
    backgroundColor: '#1e90ff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  noInviteText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    padding: 20,
  },
});

export default FHomePage;
