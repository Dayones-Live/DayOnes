import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, SafeAreaView } from 'react-native'; // Import SafeAreaView
import useTodos from '../assets/hooks/useTodos'; // Adjust the path if necessary
import ProfilePictureButton from '../assets/components/ProfilePictureButton'; // Import the ProfilePictureButton

const NotificationsScreen = () => {
  const { data, error, isLoading } = useTodos();

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
      {/* Add Profile Picture Button in the top-left corner */}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Navy blue background color
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
});

export default NotificationsScreen;
