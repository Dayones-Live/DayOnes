import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, Image, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { getConversations } from '../assets/services/apiService';
import { BASEURL } from '../assets/constants';

const DMsScreen = () => {
  const [conversations, setConversations] = useState([]);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const accessToken = useSelector((state) => state.accessToken);
  const navigation = useNavigation();

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
      const response = await getConversations(accessToken, pageNo, pageSize);
      let { conversations } = response.data;

      // Sort conversations by `updated_at` timestamp in descending order
      conversations = conversations.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

      console.log('Fetched and sorted conversations:', conversations);
      setConversations(conversations || []);
    } catch (err) {
      console.error('Error fetching conversations:', err.message);
      Alert.alert('Error', 'Failed to fetch conversations.');
      setConversations([]);
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    try {
      const response = await fetch(`${BASEURL}/api/v1/conversation/${conversationId}`, { // Adjusted endpoint
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseData = await response.json();
      console.log('Response status:', response.status);
      console.log('Response data:', responseData);

      if (response.ok) {
        setConversations((prevConversations) => prevConversations.filter((conv) => conv.id !== conversationId));
        Alert.alert('Conversation deleted successfully');
      } else {
        Alert.alert('Failed to delete the conversation', responseData.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      Alert.alert('Error', 'Failed to delete the conversation. Please try again.');
    }
  };



  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const differenceInSeconds = Math.floor((now - date) / 1000);

    if (differenceInSeconds < 60) {
      return `${differenceInSeconds} seconds ago`;
    } else if (differenceInSeconds < 3600) {
      const minutes = Math.floor(differenceInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (differenceInSeconds < 86400) {
      const hours = Math.floor(differenceInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(differenceInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const handleConversationPress = (conversationId, sender) => {
    console.log('send', sender)
    navigation.navigate('ConversationThread', {
      conversationId,
      profilePicture: sender.avatar_url || 'https://example.com/default-avatar.png',
      username: sender.full_name,
      userID: sender.id,
    });
  };

  const renderItem = ({ item }) => {
    const lastMessageTime = formatTimeAgo(item.updated_at);
    const avatarUrl = item.sender.avatar_url || 'https://example.com/default-avatar.png';
    const senderName = item.sender.full_name;

    return (
      <TouchableOpacity
        onPress={() => handleConversationPress(item.id, item.sender)}  // Navigates to conversation on press
        onLongPress={() =>
          Alert.alert(
            'Delete Conversation',
            'Are you sure you want to delete this conversation?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => handleDeleteConversation(item.id) },
            ]
          )
        }  // Prompts deletion on long press
        style={styles.conversationContainer}
      >
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        <View style={styles.messageInfo}>
          <Text style={styles.senderName}>{senderName} sent you a private message</Text>
          <Text style={styles.lastMessage}>Tap to view message - {lastMessageTime}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Direct Messages</Text>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  header: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  conversationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'black',
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  messageInfo: {
    flex: 1,
  },
  senderName: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  lastMessage: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
});

export default DMsScreen;
