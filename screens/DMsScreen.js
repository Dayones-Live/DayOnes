import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity, SafeAreaView } from 'react-native'; // Import SafeAreaView
import { useSelector } from 'react-redux';
import { getConversations } from '../assets/services/apiService';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation

const DMsScreen = () => {
  const [conversations, setConversations] = useState([]);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const accessToken = useSelector((state) => state.accessToken); // Fetch accessToken from Redux store
  const navigation = useNavigation(); // Use the navigation hook

  useEffect(() => {
    fetchConversations();
  }, [pageNo]);

  const fetchConversations = async () => {
    if (!accessToken) {
      Alert.alert('Error', 'User is not authenticated');
      console.error('Error: Missing access token.');
      return;
    }

    try {
      console.log('Fetching conversations with access token:', accessToken);
      const response = await getConversations(accessToken, pageNo, pageSize); // Pass pageNo and pageSize

      // Correctly access conversations from the response data
      const { conversations } = response.data;

      if (conversations && conversations.length > 0) {
        setConversations(conversations); // Set conversations if found
        console.log('Conversations fetched successfully:', conversations);
      } else {
        setConversations([]); // Set to empty if no conversations
        console.log('No conversations found.');
      }
    } catch (err) {
      console.error('Error fetching conversations:', err.message);
      Alert.alert('Error', 'Failed to fetch conversations.');
      setConversations([]); // In case of error, set to empty array
    }
  };

  const handleConversationPress = (conversationId) => {
    // Navigate to the ConversationThread screen with the conversationId as a parameter
    navigation.navigate('ConversationThread', { conversationId });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleConversationPress(item.id)}>
      <View style={styles.item}>
        <Text style={styles.itemText}>
          {item.sender.full_name} - Last message: {item.last_message || 'No messages yet'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Direct Messages</Text>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c002b',
    padding: 20,
  },
  text: {
    fontSize: 24,
    color: '#fff',
  },
  item: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  itemText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default DMsScreen;
