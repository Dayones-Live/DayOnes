import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, SafeAreaView, StyleSheet, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import useSendMessage from '../assets/hooks/useSendMessage';
import { getMessages } from '../assets/services/apiService';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
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
    return formatTime(date);
  } else {
    return `${messageDate.getMonth() + 1}/${messageDate.getDate()}`;
  }
};

const ConversationThread = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const route = useRoute();
  const navigation = useNavigation();
  const { conversationId, profilePicture, username } = route.params;
  const accessToken = useSelector((state) => state.accessToken);
  const loggedInUser = useSelector((state) => state.userProfile);
  const loggedInUserEmail = loggedInUser?.data.email || null;
  const loggedInUserId = loggedInUser?.id || null;
  const { sendMessage } = useSendMessage(accessToken);

  const fetchMessages = async () => {
    if (!accessToken) return;

    try {
      const data = await getMessages(conversationId, accessToken);
      const sortedMessages = data.data.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setMessages(sortedMessages);
    } catch (err) {
      console.error('Error fetching messages:', err.message);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);

    return () => clearInterval(interval);
  }, [accessToken, conversationId]);

  const handleImageUpload = async (imageUri) => {
    try {
      const s3Url = await uploadImageToBucket(imageUri, 'message-images', accessToken);
      return s3Url;
    } catch (error) {
      console.error('Failed to upload image:', error);
      Alert.alert('Error', 'Image upload failed. Please try again.');
      return null;
    }
  };

  const handleSelectImage = () => {
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.assets && response.assets.length > 0) {
        setSelectedImage(response.assets[0].uri);
      }
    });
  };

  const handleTakePicture = () => {
    launchCamera({ mediaType: 'photo' }, (response) => {
      if (response.assets && response.assets.length > 0) {
        setSelectedImage(response.assets[0].uri);
      }
    });
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' && !selectedImage) return;

    try {
      let imageUrl = null;
      if (selectedImage) {
        imageUrl = await handleImageUpload(selectedImage);
        if (!imageUrl) return;
      }

      await sendMessage(conversationId, newMessage, imageUrl);

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: Date.now().toString(),
          message: newMessage,
          url: imageUrl,
          mediaType: imageUrl ? 'PHOTO' : null,
          sender_id: loggedInUserId,
          created_at: new Date().toISOString(),
          messageSender: { email: loggedInUserEmail },
        },
      ]);

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
          {item.url && (
            <Image source={{ uri: item.url }} style={styles.messageImage} />
          )}
          <Text style={styles.messageText}>{item.message}</Text>
          <Text style={styles.messageTimestamp}>{timestamp}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Header with profile picture, name, and back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" style={styles.backButton} />
        </TouchableOpacity>
        <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
        <Text style={styles.username}>{username}</Text>
      </View>

      <FlatList
        data={[...messages].reverse()}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        style={styles.messageList}
        inverted={true}
        contentContainerStyle={{ paddingBottom: 10, paddingTop: 10 }} // Adds space between last message and bottom bar
      />

      <View style={styles.inputContainer}>
        {selectedImage && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.removeImageButton}>
              <Icon name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity onPress={handleTakePicture}>
          <Icon name="camera" size={24} color="#888" style={styles.icon} />
        </TouchableOpacity>
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Message..."
          style={[styles.input, selectedImage && styles.inputWithImage]}
          placeholderTextColor="#ccc"
          returnKeyType="send"
          onSubmitEditing={handleSendMessage}
        />
        <TouchableOpacity onPress={handleSelectImage} style={styles.iconSpacing}>
          <Icon name="image" size={24} color="#888" style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Icon name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#1e1e1e',
  },
  backButton: {
    marginRight: 10,
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  },
  senderBubble: {
    backgroundColor: '#4e9af1',
  },
  receiverBubble: {
    backgroundColor: '#333',
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
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  input: {
    flex: 1,
    backgroundColor: '#333',
    color: '#fff',
    padding: 10,
    borderRadius: 20,
    fontSize: 16,
    marginHorizontal: 10,
  },
  inputWithImage: {
    marginLeft: 10,
  },
  previewContainer: {
    position: 'relative',
    marginRight: 10,
  },
  previewImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#000',
    borderRadius: 10,
    padding: 2,
  },
  sendButton: {
    backgroundColor: '#4e9af1',
    padding: 10,
    borderRadius: 50,
    marginLeft: 5,
  },
  icon: {
    marginHorizontal: 5,
  },
  iconSpacing: {
    marginRight: 10,
  },
});

export default ConversationThread;
