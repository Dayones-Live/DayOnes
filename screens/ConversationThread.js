import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import useSendMessage from '../assets/hooks/useSendMessage';
import { getMessages } from '../assets/services/apiService';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { uploadImageToBucket } from '../utils';
import { uploadVideoToBucket } from '../utils/videoUploadService';
import Video from 'react-native-video';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {BASEURL} from '../assets/constants'

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
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const route = useRoute();
  const navigation = useNavigation();
  const { conversationId, profilePicture, username } = route.params;
  const accessToken = useSelector((state) => state.accessToken);
  const loggedInUser = useSelector((state) => state.userProfile);
  const loggedInUserEmail = loggedInUser?.data.email || null;
  const loggedInUserId = loggedInUser?.id || null;
  const { sendMessage } = useSendMessage(accessToken);

  const handleDeleteMessage = async (messageId) => {
    try {
      const response = await fetch(`${BASEURL}/api/v1/message/${messageId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
  
      if (response.ok) {
        setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== messageId));
        Alert.alert('Message deleted successfully');
      } else {
        const errorData = await response.json(); // fetch error details if available
        Alert.alert('Failed to delete the message', errorData.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      Alert.alert('Error', 'Failed to delete the message. Please try again.');
    }
  };
  



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

  const handleMediaUpload = async (uri) => {
    try {
      let s3Url;
      if (mediaType === 'PHOTO') {
        s3Url = await uploadImageToBucket(uri, 'message-media', accessToken);
      } else if (mediaType === 'VIDEO') {
        s3Url = await uploadVideoToBucket(uri, 'message-media', accessToken);
      }
      return s3Url;
    } catch (error) {
      console.error('Failed to upload media:', error);
      Alert.alert('Error', 'Media upload failed. Please try again.');
      return null;
    }
  };

  const handleSelectMedia = () => {
    launchImageLibrary({ mediaType: 'mixed' }, (response) => {
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        setSelectedMedia(asset.uri);
        setMediaType(asset.type.startsWith('image/') ? 'PHOTO' : 'VIDEO');
      }
    });
  };

  const handleTakeMedia = () => {
    launchCamera({ mediaType: 'mixed' }, (response) => {
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        setSelectedMedia(asset.uri);
        setMediaType(asset.type.startsWith('image/') ? 'PHOTO' : 'VIDEO');
      }
    });
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' && !selectedMedia) return;

    try {
      let mediaUrl = null;
      if (selectedMedia) {
        mediaUrl = await handleMediaUpload(selectedMedia);
        if (!mediaUrl) return;
      }

      await sendMessage(conversationId, newMessage, mediaUrl, mediaType);

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: Date.now().toString(),
          message: newMessage,
          url: mediaUrl,
          mediaType: mediaType,
          sender_id: loggedInUserId,
          created_at: new Date().toISOString(),
          messageSender: { email: loggedInUserEmail },
        },
      ]);

      setNewMessage('');
      setSelectedMedia(null);
      setMediaType(null);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderMessage = ({ item }) => {
    const senderEmail = item.messageSender?.email || null;
    const isSender = senderEmail === loggedInUserEmail;
    const timestamp = formatDateLabel(item.created_at);
  
    return (
      <TouchableOpacity
  onLongPress={() =>
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteMessage(item.id, accessToken) },
      ]
    )
  }
  style={[styles.messageWrapper, isSender ? styles.senderWrapper : styles.receiverWrapper]}
>

        <View style={[styles.messageBubble, isSender ? styles.senderBubble : styles.receiverBubble]}>
          {item.media_type === 'PHOTO' && item.url && (
            <Image source={{ uri: item.url }} style={styles.messageImage} />
          )}
          {item.media_type === 'VIDEO' && item.url && (
            <Video
              source={{ uri: item.url }}
              style={styles.messageVideo}
              paused={true}
              resizeMode="contain"
              controls
            />
          )}
          {item.message && <Text style={styles.messageText}>{item.message}</Text>}
          <Text style={styles.messageTimestamp}>{timestamp}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#fff" style={styles.backButton} />
          </TouchableOpacity>
          <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
          <Text style={styles.username}>{username}</Text>
        </View>

        <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <FlatList
            data={[...messages].reverse()}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMessage}
            style={styles.messageList}
            inverted={true}
            contentContainerStyle={{ paddingBottom: 10, paddingTop: 10 }}
          />
        </KeyboardAwareScrollView>

        <View style={styles.inputContainer}>
          {selectedMedia && (
            <View style={styles.previewContainer}>
              {mediaType === 'PHOTO' ? (
                <Image source={{ uri: selectedMedia }} style={styles.previewImage} />
              ) : (
                <Video
                  source={{ uri: selectedMedia }}
                  style={styles.previewVideo}
                  resizeMode="cover"
                  paused={true}
                />
              )}
              <TouchableOpacity onPress={() => setSelectedMedia(null)} style={styles.removeMediaButton}>
                <Icon name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity onPress={handleTakeMedia}>
            <Icon name="camera" size={24} color="#888" style={styles.icon} />
          </TouchableOpacity>
          <TextInput
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Message..."
            style={[styles.input, selectedMedia && styles.inputWithImage]}
            placeholderTextColor="#ccc"
            returnKeyType="send"
            onSubmitEditing={handleSendMessage}
          />
          <TouchableOpacity onPress={handleSelectMedia} style={styles.iconSpacing}>
            <Icon name="image" size={24} color="#888" style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Icon name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
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
  messageVideo: {
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
  previewVideo: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  removeMediaButton: {
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
