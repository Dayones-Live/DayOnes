import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import useSendMessage from '../assets/hooks/useSendMessage';
import { getMessages } from '../assets/services/apiService';
import socket from '../assets/services/socket';

const formatTime = (date) => {
  const options = { hour: 'numeric', minute: 'numeric' };
  return new Date(date).toLocaleTimeString([], options);
};

const formatDateLabel = (date) => {
  const messageDate = new Date(date);
  const today = new Date();
  const isToday = messageDate.toDateString() === today.toDateString();

  if (isToday) {
    return formatTime(date); // Show time only
  } else {
    return `${messageDate.getMonth() + 1}/${messageDate.getDate()}`; // Show month/day
  }
};

const ConversationThread = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const route = useRoute();
  const { conversationId } = route.params;
  const accessToken = useSelector((state) => state.accessToken);
  const loggedInUser = useSelector(state => state.userProfile);
  const loggedInUserEmail = loggedInUser?.data.email || null;
  const loggedInUserId = loggedInUser?.id || null;
  const { sendMessage } = useSendMessage(accessToken);

  // Fetch messages from the server
  const fetchMessages = async () => {
    if (!accessToken) {
      console.error('User is not authenticated');
      return;
    }

    try {
      const data = await getMessages(conversationId, accessToken);
      console.log('Fetched messages from server:', data.data.messages);

      const sortedMessages = data.data.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setMessages(sortedMessages);
    } catch (err) {
      console.error('Error fetching messages:', err.message);
    }
  };

  // Fetch messages on component mount and set up polling
  useEffect(() => {
    fetchMessages(); // Fetch on component mount
    const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds

    return () => clearInterval(interval); // Clean up interval on unmount
  }, [accessToken, conversationId]);

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;

    try {
      await sendMessage(conversationId, newMessage);

      const messagePayload = {
        conversationId,
        message: newMessage,
        senderId: loggedInUserId,
      };

      console.log('Sending message:', messagePayload);

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: Date.now().toString(),
          message: newMessage,
          sender_id: loggedInUserId,
          created_at: new Date().toISOString(),
          messageSender: { email: loggedInUserEmail },
        },
      ]);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderMessage = ({ item }) => {
    const senderEmail = item.messageSender?.email || null;
    const isSender = senderEmail === loggedInUserEmail;
    const timestamp = formatDateLabel(item.created_at); // Custom timestamp formatting

    return (
      <View style={[styles.messageWrapper, isSender ? styles.senderWrapper : styles.receiverWrapper]}>
        <View style={[styles.messageBubble, isSender ? styles.senderBubble : styles.receiverBubble]}>
          <Text style={styles.messageText}>{item.message}</Text>
          <Text style={styles.messageTimestamp}>{timestamp}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={[...messages].reverse()}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        style={styles.messageList}
        inverted={true} // Display newest message at the bottom
      />

      <View style={styles.inputContainer}>
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Enter here"
          style={styles.input}
          placeholderTextColor="#ccc"
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c002b',
    padding: 10,
  },
  messageList: {
    flex: 1,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginVertical: 5,
  },
  senderWrapper: {
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
  },
  receiverWrapper: {
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    maxWidth: '75%',
    position: 'relative',
  },
  senderBubble: {
    backgroundColor: '#4e9af1',
  },
  receiverBubble: {
    backgroundColor: '#1e1e1e',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 5, // Add some space between the text and the timestamp
  },
  messageTimestamp: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#1e1e1e',
    borderRadius: 30,
  },
  input: {
    flex: 1,
    backgroundColor: '#333',
    color: '#fff',
    padding: 10,
    borderRadius: 30,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#4e9af1',
    padding: 10,
    borderRadius: 50,
    marginLeft: 10,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
  },
});


export default ConversationThread;
