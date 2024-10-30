import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, SafeAreaView, StyleSheet, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { useRoute } from '@react-navigation/native';
import useSendMessage from '../assets/hooks/useSendMessage';
import { getMessages } from '../assets/services/apiService';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import socket from '../assets/services/socket';
import { uploadImageToBucket } from '../utils';

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
  const [selectedImage, setSelectedImage] = useState(null); // State to hold selected image URI
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
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);

    return () => clearInterval(interval);
  }, [accessToken, conversationId]);

  // Function to handle image upload
  const handleImageUpload = async (imageUri) => {
    try {
      // Assuming `uploadImageToBucket` is a function that uploads the image and returns the URL
      const s3Url = await uploadImageToBucket(imageUri, 'message-images', accessToken);
      return s3Url; // Return the S3 URL to be used in handleSendMessage
    } catch (error) {
      console.error('Failed to upload image:', error);
      Alert.alert('Error', 'Image upload failed. Please try again.');
      return null;
    }
  };

  // Function to handle selecting an image from the gallery
  const handleSelectImage = () => {
    launchImageLibrary({ mediaType: 'photo', includeBase64: false }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.error('ImagePicker Error:', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const selectedImageUri = response.assets[0].uri;
        setSelectedImage(selectedImageUri);
      }
    });
  };

  // Function to handle taking a picture with the camera
  const handleTakePicture = () => {
    launchCamera({ mediaType: 'photo', includeBase64: false }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.error('ImagePicker Error:', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const capturedImageUri = response.assets[0].uri;
        setSelectedImage(capturedImageUri);
      }
    });
  };

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (newMessage.trim() === '' && !selectedImage) return;

    try {
      let imageUrl = null;

      // If there’s an image selected, upload it to the server
      if (selectedImage) {
        imageUrl = await handleImageUpload(selectedImage);
        if (!imageUrl) return; // Exit if image upload fails
      }

      // Send the message to the server
      await sendMessage(conversationId, newMessage, imageUrl);

      // Update the local message state with the new message
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: Date.now().toString(),
          message: newMessage,
          imageUrl, // Include the image URL
          sender_id: loggedInUserId,
          created_at: new Date().toISOString(),
          messageSender: { email: loggedInUserEmail },
        },
      ]);

      // Clear the input and selected image
      setNewMessage('');
      setSelectedImage(null);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderMessage = ({ item }) => {
    const senderEmail = item.messageSender?.email || null;
    const isSender = senderEmail === loggedInUserEmail;
    const timestamp = formatDateLabel(item.created_at);

    return (
      <View style={[styles.messageWrapper, isSender ? styles.senderWrapper : styles.receiverWrapper]}>
        <View style={[styles.messageBubble, isSender ? styles.senderBubble : styles.receiverBubble]}>
          {item.imageUrl && (
            <Image source={{ uri: item.imageUrl }} style={styles.messageImage} />
          )}
          <Text style={styles.messageText}>{item.message}</Text>
          <Text style={styles.messageTimestamp}>{timestamp}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <FlatList
        data={[...messages].reverse()}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        style={styles.messageList}
        inverted={true} // Display newest message at the bottom
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={handleSelectImage}>
          <Text style={styles.addImageButton}>🖼️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleTakePicture}>
          <Text style={styles.addImageButton}>📷</Text>
        </TouchableOpacity>

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0c002b',
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
    marginBottom: 5,
  },
  messageTimestamp: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'right',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 5,
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
  addImageButton: {
    fontSize: 24,
    marginHorizontal: 5,
  },
});

export default ConversationThread;
