import React from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Button,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import useNotifications from '../assets/hooks/useNotifications';
import { formatDate } from '../utils/dateFormat';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import styles from './sharedStyles/NotificationsScreenStyles';

const NotificationsScreen = () => {
  const { data, error, isLoading } = useNotifications();
  const userProfile = useSelector((state) => state.userProfile);
  const userEmail = userProfile?.data?.email;
  const navigation = useNavigation();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#00ff00" />
        <Text style={styles.text}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>Error fetching notifications</Text>
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
      <Text style={styles.text}>Notifications</Text>
      <FlatList
        data={data?.data?.data?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContent}
      />
      {/* Render Button Only for Super Admin */}
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
