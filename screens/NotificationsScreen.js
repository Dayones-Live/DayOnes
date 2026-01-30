import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
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
import LinearGradient from 'react-native-linear-gradient';
import useNotifications from '../assets/hooks/useNotifications';
import { formatTimeAgo } from '../utils/dateFormat';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import styles, { colors } from './sharedStyles/NotificationsScreenStyles';
import { BASEURL } from '../assets/constants';
import { useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../assets/services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'messages', label: 'Messages' },
  { key: 'activity', label: 'Activity' },
];

const NotificationsScreen = () => {
  const queryClient = useQueryClient();
  const { data, error, isLoading, isFetching, refetch } = useNotifications();
  const userProfile = useSelector((state) => state.userProfile);
  const userEmail = userProfile?.data?.email;
  const navigation = useNavigation();
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [localNotifications, setLocalNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const lastNotificationId = useRef(null);
  const notificationTimeoutRef = useRef(null);

  const rawNotifications = localNotifications.length > 0 ? localNotifications : (data?.data?.data || []);
  const notifications = rawNotifications
    .filter((n) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'messages') return n.type === 'message';
      if (activeFilter === 'activity') return n.type === 'comment' || n.type === 'reaction';
      return true;
    })
    .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));
  
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
  }, [data?.data?.unreadCount, data?.data?.data, navigation]);

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

  if (isLoading && !data?.data?.data?.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Notifications</Text>
              <Text style={styles.subtitle}>Loading…</Text>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentBlue} />
          <Text style={styles.loadingText}>Loading notifications</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !data?.data?.data?.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Notifications</Text>
              <Text style={styles.subtitle}>Something went wrong</Text>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Error loading notifications</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getNotificationMessage = (item) => {
    if (item.type === 'message' && item.data) {
      try {
        const first = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
        const messageData = typeof first === 'string' ? JSON.parse(first) : first;
        return messageData?.message || item.message || 'sent you a message.';
      } catch (e) {
        return item.message || 'sent you a message.';
      }
    }
    return item.message || 'New notification';
  };

  const isUnread = (item) => !(item.isRead ?? item.is_read ?? false);

  const renderNotification = ({ item }) => {
    const name = item.from_user_profile?.full_name || 'Unknown user';
    const action = getNotificationMessage(item);
    const unread = isUnread(item);
    const ts = item.created_at || item.createdAt;
    const timeAgo = ts ? formatTimeAgo(ts) : '';

    return (
      <TouchableOpacity
        style={[styles.notificationItem, unread && styles.notificationItemUnread]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        {unread && <View style={styles.unreadDot} />}
        <View style={styles.notificationContent}>
          <View style={styles.avatarContainer}>
            {item.from_user_profile?.avatar_url ? (
              <Image
                source={{ uri: item.from_user_profile.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <Image
                source={require('../assets/images/defaultProfileImage.jpg')}
                style={styles.avatar}
              />
            )}
          </View>
          <View style={styles.notificationTextContainer}>
            <Text style={styles.notificationMessage}>
              <Text style={styles.notificationTitle}>{name} </Text>
              {action}
            </Text>
            <Text style={styles.notificationTime}>{timeAgo}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerSection}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'All caught up'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={clearAllNotifications}
            style={styles.clearAllButton}
            disabled={notifications.length === 0}
          >
            <Text
              style={[
                styles.clearAllText,
                notifications.length === 0 && { opacity: 0.5 },
              ]}
            >
              Clear All
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setActiveFilter(f.key)}
              style={[styles.filterButton, activeFilter === f.key && styles.filterButtonActive]}
              activeOpacity={0.8}
            >
              {activeFilter === f.key ? (
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.filterButtonGradient}
                >
                  <Text style={styles.filterButtonText}>{f.label}</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.filterButtonText}>{f.label}</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="bell-o" size={48} color={colors.grey} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyText}>
            {activeFilter === 'all'
              ? 'No notifications yet'
              : `No ${activeFilter === 'messages' ? 'messages' : 'activity'}`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderNotification}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={colors.accentBlue}
            />
          }
        />
      )}

      {userEmail === 'dayonesflorida@gmail.com' && (
        <View style={{ padding: 20, paddingBottom: 8 }}>
          <Button
            title="Go to Super Admin Dashboard"
            onPress={() => navigation.navigate('SuperAdminDashboard')}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

export default NotificationsScreen;
