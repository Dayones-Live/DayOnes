import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Button,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import useNotifications from '../assets/hooks/useNotifications';
import { formatDate } from '../utils/dateFormat';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import styles from './sharedStyles/NotificationsScreenStyles';
import axios from 'axios';
import { BASEURL } from '../assets/constants';
import { useQueryClient } from '@tanstack/react-query';

const NotificationsScreen = () => {
  const queryClient = useQueryClient();
  const { data, error, isLoading, refetch } = useNotifications();
  const userProfile = useSelector((state) => state.userProfile);
  const userEmail = userProfile?.data?.email;
  const navigation = useNavigation();
  const accessToken = useSelector(state => state.accessToken);
  const [markingAsRead, setMarkingAsRead] = useState(false);

  // Modify the filtering to exclude notifications from the current user
  const notifications = data?.data?.data || [];
  const filteredNotifications = notifications.filter(notification => 
    !notification.is_read && 
    notification.from_user_profile?.id !== userProfile?.data?.id
  );

  const hasUnreadNotifications = filteredNotifications.length > 0;
  
  // Add polling effect
  useEffect(() => {
    // Initial fetch
    refetch();

    // Set up polling interval (every 30 seconds)
    const pollInterval = setInterval(() => {
      console.log('Polling for new notifications...');
      refetch();
    }, 30000); // 30 seconds

    // Cleanup on unmount
    return () => clearInterval(pollInterval);
  }, []);

  // Add focus effect to refetch when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Screen focused, refreshing notifications...');
      refetch();
    });

    return unsubscribe;
  }, [navigation]);

  const markAllAsRead = async () => {
    try {
      setMarkingAsRead(true);
      
      const unreadNotifications = filteredNotifications.filter(notification => !notification.is_read) || [];
      
      console.log('Starting to mark notifications as read:', {
        total: unreadNotifications.length,
      });

      const BATCH_SIZE = 20;
      let successCount = 0;

      for (let i = 0; i < unreadNotifications.length; i += BATCH_SIZE) {
        const batch = unreadNotifications.slice(i, i + BATCH_SIZE);
        
        await Promise.all(batch.map(async (notification) => {
          try {
            await axios.patch(
              `${BASEURL}/api/v1/notifications/${notification.id}`,
              {},
              {
                headers: { 
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            successCount++;
          } catch (error) {
            console.error(`Failed to mark notification ${notification.id} as read:`, error.message);
          }
        }));

        console.log(`Processed batch ${i/BATCH_SIZE + 1}, marked ${successCount} so far`);

        // Invalidate the notifications cache after each batch
        queryClient.invalidateQueries(['notifications']);

        if (i + BATCH_SIZE < unreadNotifications.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`Finished marking notifications as read. Success: ${successCount}`);

      // Final refetch to ensure UI is up to date
      await refetch();
    } catch (error) {
      console.error('Error in mark all as read:', error);
    } finally {
      setMarkingAsRead(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.text}>Notifications</Text>
        </View>
        <ActivityIndicator size="large" color="#00ff00" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.text}>Notifications</Text>
        </View>
        <Text style={styles.errorText}>Error loading notifications</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const renderNotification = ({ item }) => {
    const fromUserProfile = item.from_user_profile;

    const notificationMessage =
      item.type === 'reaction'
        ? 'Liked your post'
        : item.type === 'comments'
          ? `Commented: "${item.message}"!`
          : 'Sent you a DM';

    const handleNotificationPress = () => {
      // Log the notification data for debugging
      console.log('=== Notification Navigation Debug ===');
      console.log('Raw notification:', JSON.stringify(item, null, 2));

      // Parse the data field if it's a string, or use it directly if it's an object
      let parsedData = null;
      if (item.data) {
        if (typeof item.data === 'string') {
          try {
            parsedData = JSON.parse(item.data);
            console.log('Parsed data from string:', parsedData);
          } catch (error) {
            console.log('Data is not JSON:', item.data);
          }
        } else if (typeof item.data === 'object') {
          parsedData = item.data;
          console.log('Data is already an object:', parsedData);
        }
      }

      // Determine the action and ID based on notification type and parsed data
      let action, id;
      switch (item.type) {
        case 'reaction':
          action = 'post';
          id = parsedData.post_id || item.post_id;
          console.log('Reaction notification - Using post_id:', id);
          break;
        case 'comments':
          action = 'post';
          id = parsedData?.post_id || item.post_id;
          break;
        case 'message':
          action = 'conversation';
          id = parsedData?.conversation_id || item.conversation_id;
          break;
        default:
          console.log('Unknown notification type:', item.type);
          break;
      }

      console.log('=== Navigation Data ===');
      console.log('Type:', item.type);
      console.log('Action:', action);
      console.log('ID:', id);
      console.log('Parsed Data:', parsedData);
      console.log('Full User Profile:', JSON.stringify(userProfile, null, 2));
      console.log('User Type:', userProfile?.data?.type);
      console.log('User Email:', userProfile?.data?.email);

      switch (action) {
        case 'post':
          if (id) {
            // Check if user is a fan and navigate to DMDetailPage
            const isFan = userProfile?.data?.role === 'USER';
            console.log('=== Navigation Decision ===');
            console.log('Is Fan?', isFan);
            console.log('User Role Check:', userProfile?.data?.role);
            
            if (isFan) {
              console.log('🚀 Navigating to DMDetailPage for fan');
              navigation.navigate('DMDetailPage', { postId: id });
            } else {
              console.log('🚀 Navigating to PostDetailPage for artist');
              navigation.navigate('PostDetailPage', { postId: id });
            }
          } else {
            console.log('❌ Navigation failed: Missing post ID in notification data');
            Alert.alert(
              'Error',
              'Could not find the associated post. Please try again later.'
            );
          }
          break;

        case 'conversation':
          if (id) {
            navigation.navigate('ConversationThread', {
              conversationId: id,
              userId: item.from_user_profile?.id,
              username: item.from_user_profile?.username,
              profilePicture: item.from_user_profile?.avatar_url || item.from_user_profile?.img_profile
            });
          } else {
            console.log('❌ Navigation failed: Missing conversation ID in notification data');
            console.log('Available data:', {
              parsedData,
              conversation_id: item.conversation_id,
              from_id: item.from_id,
              to_id: item.to_id
            });
            Alert.alert(
              'Error',
              'Could not find the conversation. Please try again later.'
            );
          }
          break;

        default:
          console.log('❌ Unknown notification action:', action);
          break;
      }
      console.log('=== End Navigation Debug ===');
    };

    return (
      <TouchableOpacity 
        style={styles.notificationCard}
        onPress={handleNotificationPress}
      >
        <View style={styles.header}>
          {fromUserProfile?.img_profile ? (
            <Image
              source={{ uri: fromUserProfile.img_profile }}
              style={styles.avatar}
            />
          ) : (
            <FontAwesome name="user-circle" size={40} color="gray" style={styles.defaultAvatar} />
          )}
          <View>
            <Text style={styles.senderName}>{fromUserProfile?.username || 'Unknown User'}</Text>
            <Text style={styles.date}>{formatDate(item.created_at)}</Text>
          </View>
        </View>
        <View style={styles.contentRow}>
          <Text style={styles.notificationMessage}>{notificationMessage}</Text>
          {item.type === 'reaction' && (
            <FontAwesome name="heart" size={20} color="red" />
          )}
          {item.type === 'comments' && (
            <FontAwesome name="comment" size={20} color="white" />
          )}
          {item.type === 'message' && (
            <FontAwesome name="envelope" size={20} color="white" />
          )}
        </View>
        {item.type === 'message' && item.message && (
          <Text style={styles.dmContent}>Message: {item.message}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.text}>Notifications</Text>
        {(hasUnreadNotifications || markingAsRead) && (
          <TouchableOpacity 
            style={styles.markReadButton}
            onPress={markAllAsRead}
            disabled={markingAsRead}
          >
            {markingAsRead ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.markReadText}>Mark all as read</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
      
      {filteredNotifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No new notifications</Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderNotification}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={isLoading}
        />
      )}
      
      {userEmail === 'dayonesflorida@gmail.com' && (
        <>
          <Text style={styles.adminText}>You have admin access.</Text>
          <Button
            title="Go to Super Admin Dashboard"
            onPress={() => navigation.navigate('SuperAdminDashboard')}
          />
        </>
      )}
    </SafeAreaView>
  );
};

export default NotificationsScreen;
