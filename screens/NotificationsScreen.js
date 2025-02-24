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

  // Safely access notifications array
  const notifications = data?.data?.data || [];
  const hasUnreadNotifications = notifications.some(notification => !notification.is_read);

  // Filter to only show unread notifications
  const unreadNotifications = notifications.filter(notification => !notification.is_read);
  
  console.log('Notifications render:', {
    dataExists: !!data,
    totalCount: notifications.length,
    unreadCount: unreadNotifications.length,
    hasUnread: hasUnreadNotifications,
    isLoading,
    error: error?.message
  });

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
      
      const unreadNotifications = notifications.filter(notification => !notification.is_read) || [];
      
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

    return (
      <View style={styles.notificationCard}>
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
      </View>
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
      
      {unreadNotifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No new notifications</Text>
        </View>
      ) : (
        <FlatList
          data={unreadNotifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))}
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
