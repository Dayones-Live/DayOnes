import React from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Image,
  Button,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import useNotifications from '../assets/hooks/useNotifications';
import { formatDate } from '../utils/dateFormat';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

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
    const senderName = item.sender_name || 'A Fan from your event';
    const senderAvatar = item.sender_avatar;
    const notificationMessage =
      item.type === 'reaction'
        ? 'Liked your post'
        : item.type === 'comments'
          ? `Commented: "${item.message}"!`
          : 'Sent you a DM';

    return (
      <View style={styles.notificationCard}>
        <View style={styles.header}>
          {senderAvatar ? (
            <Image source={{ uri: senderAvatar }} style={styles.avatar} />
          ) : (
            <FontAwesome name="user-circle" size={40} color="gray" style={styles.defaultAvatar} />
          )}
          <View>
            <Text style={styles.senderName}>{senderName}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 24,
    color: '#fff',
    marginVertical: 16,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  notificationCard: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  defaultAvatar: {
    marginRight: 12,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  date: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  dmContent: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8, // Adds spacing between the main message and the DM content
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#ccc',
    flex: 1,
  },
  adminText: {
    fontSize: 16,
    color: '#00ff00',
    marginTop: 20,
    textAlign: 'center',
  },
});

export default NotificationsScreen;
