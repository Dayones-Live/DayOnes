import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { BASEURL } from '../assets/constants';

const BlockedUsers = ({ route }) => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const accessToken = useSelector(state => state.accessToken);
  const userRole = useSelector(state => state.userProfile?.data?.role);

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        const response = await axios.get(`${BASEURL}/api/v1/blocks`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        console.log('Fetched blocked users:', response.data);
        const users = response.data.data.blocked_users || [];
        setBlockedUsers(users);
      } catch (error) {
        console.error('Error fetching blocked users:', error);
        Alert.alert('Error', 'Failed to fetch blocked users.');
      }
    };

    fetchBlockedUsers();
  }, [accessToken]);

  const handleUnblock = async (userId) => {
    setIsLoading(true);
    try {
      console.log(`Unblocking user with ID: ${userId}`);
      const response = await axios.delete(
        `${BASEURL}/api/v1/blocks/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      console.log('Unblock User Response:', response.data);
      setBlockedUsers(prevUsers => prevUsers.filter(user => user.blockedUser.id !== userId));
      Alert.alert('Success', 'User has been unblocked.');
    } catch (error) {
      console.error('Error unblocking user:', error);
      Alert.alert('Error', 'Failed to unblock user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      if (userRole === 'ARTIST') {
        navigation.navigate('ArtistStack', {
          screen: 'MainTabs'
        });
      } else {
        navigation.navigate('FanStack', {
          screen: 'MainTabs'
        });
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}>
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blocked Users</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {isLoading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        ) : blockedUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No blocked users</Text>
          </View>
        ) : (
          blockedUsers.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <Image
                  source={
                    user.blockedUser.avatar_url
                      ? { uri: user.blockedUser.avatar_url }
                      : require('../assets/images/defaultProfileImage.jpg')
                  }
                  style={styles.avatar}
                />
                <Text style={styles.userName}>{user.blockedUser.full_name}</Text>
              </View>
              <TouchableOpacity
                style={styles.unblockButton}
                onPress={() => handleUnblock(user.blockedUser.id)}
                disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.unblockText}>Unblock</Text>
                )}
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(60),
    paddingBottom: verticalScale(16),
  },
  backButton: {
    padding: scale(8),
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: moderateScale(17),
    fontWeight: '600',
  },
  placeholder: {
    width: scale(40),
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(16),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: verticalScale(40),
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: moderateScale(16),
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1E',
    padding: scale(16),
    borderRadius: scale(12),
    marginVertical: verticalScale(8),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    marginRight: scale(12),
  },
  userName: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: '500',
  },
  unblockButton: {
    backgroundColor: '#2C2C2E',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(16),
    borderRadius: scale(8),
    minWidth: scale(80),
    alignItems: 'center',
  },
  unblockText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
});

export default BlockedUsers; 