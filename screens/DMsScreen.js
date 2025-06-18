import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, Image, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { getConversations } from '../assets/services/apiService';
import { BASEURL } from '../assets/constants';
import styles from './sharedStyles/DMScreenStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoadingSpinner from '../components/LoadingSpinner';

const DMsScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const accessToken = useSelector((state) => state.accessToken);
  const loggedInUser = useSelector((state) => state.userProfile);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserData = async () => {
      try {
        // First check Redux state
        if (loggedInUser?.data?.email) {
          setLoading(false);
          return;
        }

        // If not in Redux, check AsyncStorage
        const userData = await AsyncStorage.getItem('loggedInUser');
        const storedToken = await AsyncStorage.getItem('authToken');
        
        if (!userData || !storedToken) {
          console.log('No user data or token found, redirecting to login');
          navigation.replace('LoginPage');
          return;
        }

        // If we have data, parse it and continue
        const parsedUserData = JSON.parse(userData);
        if (!parsedUserData?.data?.email) {
          console.log('Invalid user data format, redirecting to login');
          navigation.replace('LoginPage');
          return;
        }

      } catch (error) {
        console.error('Error in checkUserData:', error);
        navigation.replace('LoginPage');
      } finally {
        setLoading(false);
      }
    };

    checkUserData();
  }, [loggedInUser, navigation]);

  useEffect(() => {
    if (!loading && accessToken) {
      fetchConversations();
    }
  }, [loading, accessToken, pageNo]);

  // Add focus effect to refresh conversations when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (!accessToken) {
        console.log('No access token available, skipping conversation refresh');
        return;
      }
      console.log('DMsScreen focused, refreshing conversations...');
      fetchConversations();
    });

    return unsubscribe;
  }, [navigation, accessToken]);

  const fetchConversations = async () => {
    if (!accessToken) {
      console.error('Error: Missing access token.');
      return;
    }

    try {
      const response = await getConversations(accessToken, pageNo, pageSize);
      if (response?.data?.conversations) {
        const sortedConversations = response.data.conversations.sort(
          (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
        );
        setConversations(sortedConversations);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
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

  const handleConversationPress = (conversationId, sender, receiver) => {
    // Determine the other user (not the logged-in user)
    const otherUser = sender.email === loggedInUser?.data?.email ? receiver : sender;

    // Pass only the relevant information
    navigation.navigate('ConversationThread', {
      conversationId,
      profilePicture: otherUser.avatar_url || 'https://example.com/default-avatar.png',
      username: otherUser.full_name,
      userId: otherUser.id
    });
  };

  const getOtherUser = (sender, receiver, loggedInUserEmail) => {
    return sender.email === loggedInUserEmail ? receiver : sender;
  };

  const renderItem = ({ item }) => {
    // Determine who is not the logged-in user
    const otherUser = getOtherUser(item.sender, item.reciever, loggedInUser?.data?.email);

    const lastMessageTime = formatTimeAgo(item.updated_at);
    const avatarUrl = otherUser.avatar_url || 'https://example.com/default-avatar.png';
    const displayName = otherUser.full_name;

    return (
      <TouchableOpacity
        onPress={() => handleConversationPress(item.id, item.sender, item.reciever)}
        onLongPress={() =>
          Alert.alert(
            'Delete Conversation',
            'Are you sure you want to delete this conversation?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => handleDeleteConversation(item.id) },
            ]
          )
        }
        style={styles.conversationContainer}
      >
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        <View style={styles.messageInfo}>
          <Text style={styles.senderName}>{displayName} sent you a private message</Text>
          <Text style={styles.lastMessage}>Tap to view message - {lastMessageTime}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // Check for valid user data before rendering
  const userEmail = loggedInUser?.data?.email;
  if (!userEmail) {
    return <LoadingSpinner />;
  }

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

export default DMsScreen;
