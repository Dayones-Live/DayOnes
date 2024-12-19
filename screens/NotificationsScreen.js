import React from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Button, // Import Button for navigation
} from 'react-native';
import {useSelector} from 'react-redux'; // To access user information from the store
import {useNavigation} from '@react-navigation/native'; // Navigation for Super Admin button
import ProfilePictureButton from '../assets/components/ProfilePictureButton';
import useNotifications from '../assets/hooks/useNotifications';
import {formatDate} from '../utils/dateFormat';

const NotificationsScreen = () => {
  const {data, error, isLoading} = useNotifications();
  const userProfile = useSelector(state => state.userProfile); // Access user profile from Redux
  const userEmail = userProfile?.data?.email; // Extract email for role-based rendering
  const navigation = useNavigation(); // Initialize navigation

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
        <Text style={styles.text}>Error fetching data</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ProfilePictureButton />
      <Text style={styles.text}>Notifications</Text>
      <FlatList
        data={data?.data}
        keyExtractor={item => item.id.toString()}
        renderItem={({item}) => (
          <View style={styles.itemContainer}>
            <View style={styles.contentRow}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.date}>{formatDate(item.created_at)}</Text>
            </View>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.type}>{item.type}</Text>
          </View>
        )}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 20,
    marginTop: 22,
  },
  itemText: {
    color: '#fff',
    fontSize: 18,
  },
  adminText: {
    fontSize: 16,
    color: '#00ff00',
    marginTop: 20,
    textAlign: 'center',
  },
  itemContainer: {
    padding: 16,
    backgroundColor: '#1a1a1a',
    marginVertical: 6,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  date: {
    fontSize: 12,
    color: '#888',
  },
  message: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 8,
  },
  type: {
    fontSize: 12,
    color: '#00b7ff',
    textTransform: 'capitalize',
  },
});

export default NotificationsScreen;
