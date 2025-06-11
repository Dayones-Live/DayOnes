import React, { useState, useEffect, useRef } from 'react';
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
  RefreshControl,
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
import { notificationService } from '../assets/services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationsScreen = () => {
  const queryClient = useQueryClient();
  const { data, error, isLoading, refetch } = useNotifications();
  const userProfile = useSelector((state) => state.userProfile);
  const userEmail = userProfile?.data?.email;
  const navigation = useNavigation();
  const accessToken = useSelector(state => state.accessToken);
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [localNotifications, setLocalNotifications] = useState([]);
  const lastNotificationId = useRef(null);
  const notificationTimeoutRef = useRef(null);

  // Get all notifications without filtering
  const notifications = localNotifications.length > 0 ? localNotifications : (data?.data?.data || []);
  
  // Update unread count and local notifications based on backend data
  useEffect(() => {
    if (data?.data?.unreadCount !== undefined) {
      setUnreadCount(data.data.unreadCount);
      navigation.setOptions({
        tabBarBadge: data.data.unreadCount > 0 ? data.data.unreadCount : null
      });
    }
    // Sync local notifications with backend data
    if (data?.data?.data) {
      setLocalNotifications(data.data.data);
    }
  }, [data?.data?.unreadCount, data?.data?.data]);

  const hasUnreadNotifications = unreadCount > 0;
  
  // Handle OneSignal notification
  const handleOneSignalNotification = (notification) => {
    if (!notification?.notificationId || notification.notificationId === lastNotificationId.current) {
      return;
    }

    lastNotificationId.current = notification.notificationId;
    
    // Clear any existing timeout
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    // Set a new timeout to fetch notifications
    notificationTimeoutRef.current = setTimeout(() => {
      refetch();
    }, 1000);
  };

  // Set up OneSignal notification listener
  useEffect(() => {
    if (typeof OneSignal !== 'undefined') {
      OneSignal.setNotificationWillShowInForegroundHandler(handleOneSignalNotification);
      OneSignal.setNotificationOpenedHandler(handleOneSignalNotification);
    }

    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // Refresh on focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (!markingAsRead) {
        refetch();
      }
    });

    return unsubscribe;
  }, [navigation, markingAsRead]);

  const markAllAsRead = async () => {
    if (markingAsRead || !hasUnreadNotifications) return;

    try {
      setMarkingAsRead(true);
      const response = await notificationService.markAllNotificationsAsRead();
      
      if (response.success) {
        // Update local state
        setUnreadCount(0);
        navigation.setOptions({
          tabBarBadge: null
        });
        
        // Invalidate cache to trigger a refetch
        queryClient.invalidateQueries(['notifications']);
      } else {
        Alert.alert('Error', 'Failed to mark notifications as read');
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      Alert.alert('Error', 'Failed to mark notifications as read');
    } finally {
      setMarkingAsRead(false);
    }
  };

  const handleNotificationPress = async (item) => {
    console.log('🔔 Notification clicked:', item);
    
    try {
      console.log('📝 Attempting to mark notification as read...');
      const response = await notificationService.markNotificationAsRead(item.id);
      console.log('📝 Mark as read response:', response);
      
      // Update local state if mark as read was successful
      if (response.success) {
        console.log('✅ Notification marked as read successfully');
        setUnreadCount(prev => Math.max(0, prev - 1));
        navigation.setOptions({
          tabBarBadge: unreadCount > 1 ? unreadCount - 1 : null
        });
        
        // Invalidate cache to trigger a refetch
        queryClient.invalidateQueries(['notifications']);
      } else {
        console.log('⚠️ Failed to mark notification as read, but continuing with navigation');
      }

      // Parse the data field if it's a string, or use it directly if it's an object
      let parsedData = null;
      if (item.data) {
        if (typeof item.data === 'string') {
          try {
            // Handle double-encoded JSON
            const firstParse = JSON.parse(item.data);
            parsedData = typeof firstParse === 'string' ? JSON.parse(firstParse) : firstParse;
            console.log('📦 Parsed notification data:', parsedData);
          } catch (error) {
            console.log('❌ Error parsing data:', error);
            console.log('Raw data:', item.data);
          }
        } else if (typeof item.data === 'object') {
          parsedData = item.data;
          console.log('📦 Notification data is already an object:', parsedData);
        }
      }

      // Determine if user is a fan
      const isFan = userProfile?.data?.role === 'USER';
      console.log('👤 User role:', userProfile?.data?.role, 'Is Fan:', isFan);

      // Get post ID from any possible location
      const postId = parsedData?.post_id || item.post_id || item.postId;
      console.log('📝 Post ID from various sources:', {
        fromParsedData: parsedData?.post_id,
        fromItemPostId: item.post_id,
        fromItemPostIdDirect: item.postId,
        finalPostId: postId
      });

      // Handle navigation based on notification type
      if (item.type === 'message' && (parsedData?.conversation_id || item.conversation_id)) {
        const conversationId = parsedData?.conversation_id || item.conversation_id;
        console.log('💬 Navigating to conversation:', conversationId);
        
        try {
          const authToken = await AsyncStorage.getItem('authToken');
          if (!authToken) {
            console.error('No auth token found');
            return;
          }

          // Fetch conversation details
          const response = await fetch(`${BASEURL}/api/v1/conversation/${conversationId}`, {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          });
          
          if (response.ok) {
            const responseData = await response.json();
            const conversation = responseData.data;
            console.log('💬 Conversation details:', conversation);
            
            // Determine the other user in the conversation
            const otherUser = conversation.sender.email === userProfile?.data?.email 
              ? conversation.reciever 
              : conversation.sender;

            console.log('👤 Other user details:', otherUser);

            navigation.navigate('ConversationThread', {
              conversationId: conversationId,
              userId: otherUser.id,
              username: otherUser.full_name,
              profilePicture: otherUser.avatar_url || 'https://example.com/default-avatar.png',
              isNewConversation: false
            });
          }
        } catch (error) {
          console.error('Error fetching conversation details:', error);
        }
      } else if ((item.type === 'comment' || item.type === 'reaction') && postId) {
        console.log('📝 Navigating to post:', postId);
        
        if (isFan) {
          console.log('👤 Fan navigating to DMDetailPage');
          navigation.navigate('DMDetailPage', { postId });
        } else {
          console.log('👤 Artist navigating to PostDetailPage');
          navigation.navigate('PostDetailPage', { postId });
        }
      } else {
        console.log('❌ Unknown notification type or missing data:', {
          type: item.type,
          parsedData,
          post_id: item.post_id,
          postId: item.postId,
          conversation_id: item.conversation_id
        });
      }
    } catch (error) {
      console.error('❌ Error in handleNotificationPress:', error);
    }
  };

  // Clear all notifications from UI and backend
  const clearAllNotifications = async () => {
    try {
      await notificationService.clearAllNotifications();
      setLocalNotifications([]);
      setUnreadCount(0);
      navigation.setOptions({ tabBarBadge: null });
      refetch(); // Refetch to get only new notifications
    } catch (error) {
      Alert.alert('Error', 'Failed to clear notifications');
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
   
    
    const getNotificationMessage = () => {
      // For message notifications, show the actual message content
      if (item.type === 'message' && item.data) {
        try {
          const messageData = JSON.parse(item.data);
          return messageData.message || item.message;
        } catch (error) {
          console.error('Error parsing notification data:', error);
        }
      }
      return item.message || 'New notification';
    };

    const safeFormatDate = (dateString) => {
      try {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return formatDate(date);
      } catch (error) {
        console.error('Error formatting date:', error);
        return '';
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.isRead && styles.unreadNotification
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.notificationContent}>
          <View style={styles.avatarContainer}>
            {item.from_user_profile?.avatar_url ? (
              <Image
                source={{ uri: item.from_user_profile.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <FontAwesome name="user-circle" size={40} color="#666" />
            )}
          </View>
          <View style={styles.notificationTextContainer}>
            <Text style={styles.notificationText}>
              {item.from_user_profile?.full_name || 'Unknown user'} {getNotificationMessage()}
            </Text>
            <Text style={styles.notificationTime}>
              {safeFormatDate(item.createdAt)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Clear All button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.text}>Notifications</Text>
        <TouchableOpacity onPress={clearAllNotifications} style={styles.markReadButton}>
          <Text style={styles.markReadText}>Clear All</Text>
        </TouchableOpacity>
      </View>
      
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No new notifications</Text>
        </View>
      ) : (
        <FlatList
          data={notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))}
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
