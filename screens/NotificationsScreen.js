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
import { useSelector } from 'react-redux'; // To access user information from the store
import { useNavigation } from '@react-navigation/native'; // Navigation for Super Admin button
import useTodos from '../assets/hooks/useTodos'; // Adjust the path if necessary
import ProfilePictureButton from '../assets/components/ProfilePictureButton';

const NotificationsScreen = () => {
  const { data, error, isLoading } = useTodos();
  const userProfile = useSelector((state) => state.userProfile); // Access user profile from Redux
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
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Text style={styles.itemText}>{item.title}</Text>
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
  },
  itemContainer: {
    backgroundColor: '#1b1b1b',
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    width: '90%',
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
});

export default NotificationsScreen;
