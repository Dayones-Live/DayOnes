import React, { useState, useEffect, useRef } from 'react';
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
  Modal
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
import { BASEURL } from '../assets/constants';
import ImageViewing from 'react-native-image-viewing';

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
  const [isImageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageForViewer, setSelectedImageForViewer] = useState(null);
  const route = useRoute();
  const navigation = useNavigation();
  const { conversationId, profilePicture, username } = route.params;
  const accessToken = useSelector((state) => state.accessToken);
  const loggedInUser = useSelector((state) => state.userProfile);
  const loggedInUserEmail = loggedInUser?.data.email || null;
  const loggedInUserId = loggedInUser?.id || null;
  const { sendMessage } = useSendMessage(accessToken);
  const flatListRef = useRef(null);
  const [isSending, setIsSending] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [reason, setReason] = useState('');

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
        const errorData = await response.json();
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
    if (isSending || (newMessage.trim() === '' && !selectedMedia)) return;

    setIsSending(true); // Disable the button
    try {
      let mediaUrl = null;
      if (selectedMedia) {
        mediaUrl = await handleMediaUpload(selectedMedia);
        if (!mediaUrl) {
          setIsSending(false); // Re-enable the button if media upload fails
          return;
        }
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
    } finally {
      setIsSending(false); // Re-enable the button
    }
  };


  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  // const handleBlockUser = () => {
  //   if (!reason.trim()) {
  //     Alert.alert('Error', 'Please provide a reason for blocking the user.');
  //     return;
  //   }

  //   console.log('Block User Reason:', reason);
  //   console.log('User ID:', route.params.userId); // Assuming userId is passed via route params

  //   toggleMenu(); // Close the modal
  //   setReason(''); // Clear reason
  // };

  const handleReportUser = () => {
    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for reporting the user.');
      return;
    }

    console.log('Report User Reason:', reason);
    console.log('User ID:', route.params.userId); // Assuming userId is passed via route params
    console.log(route.params)
    toggleMenu(); // Close the modal
    setReason(''); // Clear reason
  };


  const renderMessage = ({ item }) => {
    const senderEmail = item.messageSender?.email || null;
    const isSender = senderEmail === loggedInUserEmail;
    const timestamp = formatDateLabel(item.created_at);

    return (
      <View
        style={[
          styles.messageWrapper,
          isSender ? styles.senderWrapper : styles.receiverWrapper,
        ]}
      >
        {/* Render Media */}
        {item.media_type === 'PHOTO' && item.url && (
          <TouchableOpacity
            onPress={() => {
              setSelectedImageForViewer(item.url);
              setImageViewerVisible(true);
            }}
            style={isSender ? styles.senderMedia : styles.receiverMedia}
          >
            <Image
              source={{ uri: item.url }}
              style={[
                styles.messageImage,
                isSender ? styles.senderMedia : styles.receiverMedia,
              ]}
            />
          </TouchableOpacity>
        )}
        {item.media_type === 'VIDEO' && item.url && (
          <View style={isSender ? styles.senderMedia : styles.receiverMedia}>
            <Video
              source={{ uri: item.url }}
              style={[
                styles.messageVideo,
                isSender ? styles.senderMedia : styles.receiverMedia,
              ]}
              paused={true}
              resizeMode="cover"
              controls
            />
          </View>
        )}

        {/* Render Message Bubble (Text and Timestamp) */}
        {item.message && (
          <TouchableOpacity
            onLongPress={() =>
              Alert.alert(
                'Delete Message',
                'Are you sure you want to delete this message?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => handleDeleteMessage(item.id),
                  },
                ]
              )
            }
            style={[
              styles.messageBubble,
              isSender ? styles.senderBubble : styles.receiverBubble,
            ]}
          >
            <Text style={styles.messageText}>{item.message}</Text>
            <Text style={styles.messageTimestamp}>{timestamp}</Text>
          </TouchableOpacity>
        )}
      </View>
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
          <TouchableOpacity onPress={toggleMenu}>
            <Icon name="ellipsis-v" size={24} color="#fff" style={styles.menuIcon} />
          </TouchableOpacity>

          {menuVisible && (
            <Modal
              transparent={true}
              animationType="fade"
              visible={menuVisible}
              onRequestClose={toggleMenu}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>Specify Your Reason</Text>

                  <TextInput
                    style={styles.inputBox}
                    placeholder="Write your reason here..."
                    placeholderTextColor="#aaa"
                    multiline
                    value={reason}
                    onChangeText={setReason}
                  />

                  <TouchableOpacity onPress={handleReportUser} style={styles.modalItem}>
                    <Icon name="flag" size={20} color="#ffa500" style={styles.modalItemIcon} />
                    <Text style={styles.modalText}>Report User</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={toggleMenu} style={styles.modalCloseButton}>
                    <Text style={styles.modalCloseText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}

        </View>



        <FlatList
          ref={flatListRef}
          data={[...messages].reverse()}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          style={styles.messageList}
          inverted={true}
          contentContainerStyle={{ paddingBottom: 10, paddingTop: 10 }}
        />


        <ImageViewing
          images={[{ uri: selectedImageForViewer }]}
          imageIndex={0}
          visible={isImageViewerVisible}
          onRequestClose={() => setImageViewerVisible(false)}
        />

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
          <TouchableOpacity
            style={[styles.sendButton, isSending && { opacity: 0.5 }]} // Disable visual feedback
            onPress={handleSendMessage}
            disabled={isSending} // Disable button while sending
          >
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
  menuIcon: {
    marginLeft: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  inputBox: {
    width: '100%',
    height: 100,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#222',
    color: '#fff',
    fontSize: 16,
    textAlignVertical: 'top', // Ensures text starts at the top
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Dimmed background
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    width: '100%',
  },
  modalItemIcon: {
    marginRight: 10,
  },
  modalText: {
    fontSize: 18,
    color: '#fff',
  },
  modalCloseButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#444',
    borderRadius: 5,
    width: '50%',
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 16,
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
    flex: 1,
  },
  blockButton: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageList: {
    flex: 1,
  },
  messageWrapper: {
    flexDirection: 'column',
    marginVertical: 10,
    paddingHorizontal: 5,
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
    maxWidth: '75%',
    padding: 10,
    borderRadius: 20,
    marginVertical: 5,
  },
  senderBubble: {
    backgroundColor: '#4e9af1',
    alignSelf: 'flex-end',
  },
  receiverBubble: {
    backgroundColor: '#333',
    alignSelf: 'flex-start',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
  messageTimestamp: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 5,
  },
  messageImage: {
    width: '85%', // Larger width for better display
    borderRadius: 10,
    alignSelf: 'flex-start', // Dynamic alignment for receiver
    marginBottom: 10,
    aspectRatio: 1.5, // Adjust aspect ratio for consistent sizing
    backgroundColor: '#000',
    marginLeft: '12%',
  },
  messageVideo: {
    width: '85%', // Larger width for better display
    borderRadius: 10,
    marginRight: '11%',
    alignSelf: 'flex-start', // Dynamic alignment for receiver
    aspectRatio: 1,
    backgroundColor: '#000',
  },
  senderMedia: {
    alignItems: 'flex-end',
    alignSelf: 'flex-end', // Ensure it aligns to the right for sender
    right: '-6%',
    marginVertical: 5,
  },
  receiverMedia: {
    alignItems: 'flex-start',
    left: '-2%',
    alignSelf: 'flex-start', // Ensure it aligns to the left for receiver
    marginVertical: 5,

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
