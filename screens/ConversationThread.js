import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
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
import styles from './sharedStyles/ConversationThreadStyles';
import { convertToTemporaryFile } from '../assets/components/convertToTemporaryFileHelper';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

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
      let filePath = uri;

      // Use helper function for Android scoped storage
      if (Platform.OS === 'android' && uri.startsWith('content://')) {
        const extension = mediaType === 'PHOTO' ? 'jpg' : 'mp4';
        filePath = await convertToTemporaryFile(uri, extension);
      }

      let s3Url;
      if (mediaType === 'PHOTO') {
        s3Url = await uploadImageToBucket(filePath, 'message-media', accessToken);
      } else if (mediaType === 'VIDEO') {
        s3Url = await uploadVideoToBucket(filePath, 'message-media', accessToken);
      }

      return s3Url;
    } catch (error) {
      console.error('Failed to upload media:', error);
      Alert.alert('Error', 'Media upload failed. Please try again.');
      return null;
    }
  };

  const handleSelectMedia = async () => {
    launchImageLibrary({ mediaType: 'mixed' }, async (response) => {
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        let uri = asset.uri;

        // Use helper function for Android scoped storage
        if (Platform.OS === 'android' && uri.startsWith('content://')) {
          const extension = asset.type.startsWith('image/') ? 'jpg' : 'mp4';
          uri = await convertToTemporaryFile(uri, extension);
        }

        setSelectedMedia(uri);
        setMediaType(asset.type.startsWith('image/') ? 'PHOTO' : 'VIDEO');
      }
    });
  };


  const handleTakeMedia = async () => {
    try {
      const permission =
        Platform.OS === 'android'
          ? PERMISSIONS.ANDROID.CAMERA
          : PERMISSIONS.IOS.CAMERA;
  
      // Check if permission is granted
      const result = await check(permission);
  
      if (result === RESULTS.GRANTED) {
        // Permission is already granted; define camera options
        const options = {
          mediaType: 'photo', // You can set 'photo', 'video', or 'mixed'
          saveToPhotos: true, // Save the photo to the user's gallery
          includeBase64: false, // Exclude base64 string for the file
        };
  
        // Launch the camera
        launchCamera(options, (response) => {
          if (response.didCancel) {
            console.log('User cancelled image picker');
          } else if (response.errorMessage) {
            console.log('ImagePicker Error: ', response.errorMessage);
          } else if (response.assets && response.assets.length > 0) {
            const capturedImage = response.assets[0];
            setSelectedMedia(capturedImage.uri);
            setMediaType('PHOTO');
          }
        });
      } else if (result === RESULTS.DENIED) {
        // Request permission
        const requestResult = await request(permission);
        if (requestResult === RESULTS.GRANTED) {
          handleTakeMedia(); // Retry camera after permission is granted
        } else {
          Alert.alert(
            'Permission Required',
            'Camera access is required to take a picture. Please enable camera permissions in your device settings.'
          );
        }
      } else if (result === RESULTS.BLOCKED) {
        // Permission is blocked; show an alert to guide the user to settings
        Alert.alert(
          'Permission Required',
          'Camera access has been blocked. Please enable it in your device settings.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error checking camera permission:', error);
    }
  };
  

   const handleSendMessage = async () => {
    // Check if both the message and media are empty
    if (isSending) return;
  
    if (!newMessage.trim() && selectedMedia) {
      Alert.alert(
        'Message Required',
        'A message is required when sending an image or video. Please include a message.'
      );
      return;
    }
  
    if (newMessage.trim() === '' && !selectedMedia) {
      Alert.alert('Error', 'Please enter a message or attach media.');
      return;
    }
  
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

  const handleBlockUser = () => {
    const userId = route.params.userId; // Get userId from route params

    if (!userId) {
      Alert.alert('Error', 'Unable to block the user. Missing user ID.');
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      'Block User',
      'Are you sure you want to block this user? You can access blocked users in the Profile Page.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Blocking user with ID:', userId);

              const response = await fetch(`${BASEURL}/api/v1/blocks`, { // Use '/api/v1/blocks'
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ blockedUser: userId }), // Adjust key if necessary
              });

              const responseData = await response.json();
              console.log('API Response Status:', response.status);
              console.log('API Response Data:', responseData);

              if (response.ok) {
                Alert.alert('Success', 'User has been blocked successfully.');
              } else {
                Alert.alert(
                  'Error',
                  responseData.message || 'Failed to block the user. Please try again.'
                );
              }
            } catch (error) {
              console.error('Error blocking user:', error);
              Alert.alert('Error', 'An error occurred while blocking the user.');
            }
          },
        },
      ]
    );
  };



  const handleReportUser = async () => {
    console.log('Route Params:', route.params); // Log the route parameters

    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for reporting the user.');
      return;
    }

    try {
      const payload = {
        description: reason.trim(),
        reportedUserId: route.params.userId, // Use userId from route params
      };

      console.log('Report User Payload:', payload); // Log the request payload

      const response = await fetch(`${BASEURL}/api/v1/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      // Log response status and data
      const responseData = await response.json();
      console.log('API Response Status:', response.status); // Log HTTP status code
      console.log('API Response Data:', responseData); // Log response JSON

      if (response.ok) {
        Alert.alert('Success', 'User has been reported successfully.');
      } else {
        Alert.alert(
          'Error',
          responseData.message || 'Failed to report the user. Please try again.'
        );
      }
    } catch (error) {
      console.error('Error reporting user:', error); // Log any network or unexpected errors
      Alert.alert('Error', 'An error occurred while reporting the user. Please try again.');
    } finally {
      toggleMenu(); // Close the modal
      setReason(''); // Clear the reason
    }
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

                  {/* Report User Button */}
                  <TouchableOpacity onPress={handleReportUser} style={styles.modalItem}>
                    <Icon name="flag" size={20} color="#ffa500" style={styles.modalItemIcon} />
                    <Text style={styles.modalText}>Report User</Text>
                  </TouchableOpacity>

                  {/* Block User Button */}
                  <TouchableOpacity onPress={handleBlockUser} style={styles.modalItem}>
                    <Icon name="ban" size={20} color="#ff4444" style={styles.modalItemIcon} />
                    <Text style={styles.modalText}>Block User</Text>
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



export default ConversationThread;
