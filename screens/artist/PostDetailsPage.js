import React, { useEffect, useState, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
} from 'react-native';
import axios from 'axios';
import { BASEURL } from '../../assets/constants';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Foundation from 'react-native-vector-icons/Foundation';
import Icon from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { uploadImageToBucket } from '../../utils';

const PostDetailPage = () => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [likedComments, setLikedComments] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [commentsCollapsed, setCommentsCollapsed] = useState(true);
  const [isReplyModalVisible, setReplyModalVisible] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyParentId, setReplyParentId] = useState(null);
  const [showReplies, setShowReplies] = useState({});


  const route = useRoute();
  const navigation = useNavigation();
  const { postId } = route.params;
  const accessToken = useSelector((state) => state.accessToken);
  const commentsSectionRef = useRef(null);

  const fetchPostDetails = async () => {
    try {
      const response = await axios.get(`${BASEURL}/api/v1/post/${postId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const postData = response.data?.data?.post || {};
      const reactions = response.data?.data?.reactions || [];
      const reactionCount = reactions.length || 0;
      const artistComments = response.data?.data?.artistComments?.reverse() || [];
      const comments = response.data?.data?.comments || [];

      // Log the fan comments data with replies (if available)
      console.log("Fetched fan comments data:", comments);

      const likedCommentsArray = comments
        .filter((comment) => comment.commentReactionCount > 0)
        .map((comment) => comment.id);

      setLikedComments(likedCommentsArray);
      setPost({ ...postData, reactionCount, artistComments, comments });
    } catch (error) {
      console.error('Error fetching post:', error.response || error.message);
      Alert.alert('Error', 'Could not load post details.');
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    fetchPostDetails();
  }, [postId, accessToken]);

  const handleOpenModal = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedImage(null);
  };

  const toggleReplies = (commentId) => {
    setShowReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };
  const options = { mediaType: 'photo', includeBase64: false };

  const takePicture = () => {
    launchCamera(options, (response) => {
      if (!response.didCancel && !response.errorCode) {
        const { uri } = response.assets[0];
        setSelectedImage(uri.startsWith('file://') ? uri : `file://${uri}`);
      }
    });
  };

  const uploadFile = () => {
    launchImageLibrary(options, (response) => {
      if (!response.didCancel && !response.errorCode) {
        const { uri } = response.assets[0];
        setSelectedImage(uri.startsWith('file://') ? uri : `file://${uri}`);
      }
    });
  };

  const handleImageUpload = async (imageUri) => {
    try {
      const s3Url = await uploadImageToBucket(imageUri, 'comment-images', accessToken);
      console.log('Image uploaded to S3:', s3Url);
      return s3Url; // Return the S3 URL to be used in the comment data
    } catch (error) {
      console.error('Failed to upload image:', error);
      Alert.alert('Error', 'Image upload failed. Please try again.');
      return null; // Return null if the upload fails
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim() && !selectedImage) {
      Alert.alert('Error', 'Comment or image is required.');
      return;
    }

    let s3Url = selectedImage;

    // Check if selectedImage is a local URI (i.e., not yet uploaded to S3)
    if (selectedImage && !selectedImage.startsWith('https://')) {
      try {
        s3Url = await handleImageUpload(selectedImage); // Upload to S3 and get the URL
        if (!s3Url) {
          throw new Error('Image upload failed');
        }
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        Alert.alert('Error', 'Image upload failed. Please try again.');
        return;
      }
    }

    try {
      // Construct the comment data
      const commentData = {
        message: commentText.trim(),
        ...(s3Url && { url: s3Url, mediaType: 'PHOTO' }), // Include url and mediaType only if s3Url exists
      };

      // Log the comment data for debugging
      console.log("Sending comment with data:", commentData);

      const response = await axios.post(
        `${BASEURL}/api/v1/post/${postId}/comment`,
        commentData,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      // Check if the response status indicates success
      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', 'Your comment has been posted.');
        setCommentText('');
        setSelectedImage(null);
        setModalVisible(false);
        fetchPostDetails();
      } else {
        console.warn('Unexpected response status:', response.status);
        Alert.alert('Error', 'Failed to post the comment. Unexpected response from server.');
      }
    } catch (error) {
      // Enhanced error handling
      if (error.response) {
        // The request was made, and the server responded with a status code outside of the 2xx range
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
        Alert.alert(
          'Error',
          `Failed to send comment: ${error.response.data?.message || 'Server error occurred.'}`
        );
      } else if (error.request) {
        // The request was made, but no response was received
        console.error('No response received:', error.request);
        Alert.alert('Error', 'No response from server. Please check your network connection and try again.');
      } else {
        // Something happened in setting up the request that triggered an error
        console.error('Error setting up the request:', error.message);
        Alert.alert('Error', `Unexpected error: ${error.message}`);
      }
    }
  };


  const likeComment = async (commentId) => {
    try {
      if (likedComments.includes(commentId)) {
        await axios.post(
          `${BASEURL}/api/v1/comment/dislike/${commentId}`,
          {},
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        setLikedComments((prevLikedComments) =>
          prevLikedComments.filter((id) => id !== commentId)
        );
      } else {
        await axios.post(
          `${BASEURL}/api/v1/comment/like/${commentId}`,
          {},
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        setLikedComments((prevLikedComments) => [...prevLikedComments, commentId]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to like/dislike the comment.');
    }
  };

  const deleteComment = async (commentId) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${BASEURL}/api/v1/post/${postId}/comment/${commentId}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              Alert.alert('Success', 'Comment deleted.');
              fetchPostDetails();
            } catch (error) {
              console.error('Error deleting comment:', error.response || error.message);
              Alert.alert('Error', 'Failed to delete comment. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const toggleComments = () => {
    setCommentsCollapsed((prevState) => !prevState);
    setTimeout(() => {
      if (!commentsCollapsed && commentsSectionRef.current) {
        commentsSectionRef.current.scrollToOffset({ offset: 300, animated: true });
      }
    }, 100); // Delayed to ensure state update takes effect
  };

  // Opens the reply modal and sets the parent comment ID
  const handleOpenReplyModal = (commentId) => {
    setReplyParentId(commentId);
    setReplyText('');
    setReplyModalVisible(true);
  };

  // Closes the reply modal
  const handleCloseReplyModal = () => {
    setReplyModalVisible(false);
    setReplyParentId(null);
  };

  // Handles sending the reply to the API
  const handleSendReply = async () => {
    console.log("Attempting to send reply...");

    if (!replyText.trim()) {
      Alert.alert('Error', 'Reply content cannot be empty.');
      console.log("Reply content is empty, aborting.");
      return;
    }

    console.log("Reply content:", replyText);
    console.log("Parent comment ID:", replyParentId);

    try {
      const replyData = {
        message: replyText,
        parentCommentId: replyParentId,
      };

      console.log("Reply data to be sent:", replyData);

      const response = await axios.post(
        `${BASEURL}/api/v1/post/${postId}/comment`,
        replyData,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      console.log("Reply response:", response);

      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', 'Your reply has been posted.');
        console.log("Reply successfully posted.");
        setReplyText('');
        setReplyModalVisible(false);
        fetchPostDetails();  // Fetch updated comments after the reply
      } else {
        Alert.alert('Error', 'Failed to post the reply. Please try again.');
        console.warn("Unexpected response status:", response.status);
      }
    } catch (error) {
      if (error.response) {
        console.error("Error response from server:", error.response.data);
        Alert.alert(
          'Error',
          `Failed to send reply: ${error.response.data?.message || 'Server error occurred.'}`
        );
      } else if (error.request) {
        console.error("No response received:", error.request);
        Alert.alert('Error', 'No response from server. Please check your network connection and try again.');
      } else {
        console.error("Error setting up the request:", error.message);
        Alert.alert('Error', `Unexpected error: ${error.message}`);
      }
    }
  };



  const checkForExistingConversation = async (userId) => {
    try {
      const response = await axios.get(`${BASEURL}/api/v1/conversation?pageNo=1&pageSize=100`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const conversations = response.data?.data?.conversations || [];

      return conversations.find(
        (conversation) =>
          (conversation.sender_id === userId || conversation.reciever_id === userId) &&
          (conversation.reciever_id === userId || conversation.sender_id === userId)
      );
    } catch (error) {
      console.error('Error fetching existing conversations:', error.message);
      return null;
    }
  };

  const createOrNavigateConversation = async (userId) => {
    try {
      const existingConversation = await checkForExistingConversation(userId);
      if (existingConversation) {
        console.log('Navigating to existing conversation with ID:', existingConversation.id);
        navigation.navigate('ConversationThread', { conversationId: existingConversation.id });
      } else {
        console.log('Creating a new conversation as none exists.');
        const response = await axios.post(
          `${BASEURL}/api/v1/conversation`,
          { recieverId: userId, lastMessage: 'Hello!' },
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        const newConversationId = response.data?.data?.id;
        if (newConversationId) {
          console.log('New conversation created with ID:', newConversationId);
          navigation.navigate('ConversationThread', { conversationId: newConversationId });
        } else {
          console.error('Error: Conversation ID not found in response:', response.data);
          Alert.alert('Error', 'Failed to create conversation. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error creating or navigating conversation:', error.response || error.message);
      Alert.alert('Error', 'An error occurred while handling the conversation request.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF0080" />
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Post not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={commentsSectionRef}
        data={[post]}
        ListHeaderComponent={
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <AntDesign name="arrowleft" size={35} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.postTitle}>{post.locale || 'Unknown Location'}</Text>
            <TouchableOpacity onPress={handleOpenModal} style={styles.plusIcon}>
              <AntDesign name="pluscircleo" size={35} color="#FFF" />
            </TouchableOpacity>
          </View>
        }
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <>
            {item.artistComments && item.artistComments.length > 0 && (
              <View>
                {item.artistComments.map((artistComment) => (
                  <View key={artistComment.id} style={styles.artistCommentContainer}>
                    <View style={styles.userInfoContainer}>
                      <Image source={{ uri: artistComment.user.avatar_url }} style={styles.avatar} />
                      <View>
                        <Text style={styles.userName}>{artistComment.user.full_name}</Text>
                        <Text style={styles.userLocation}>{artistComment.user.location}</Text>
                      </View>
                    </View>
                    <Text style={styles.commentText}>{artistComment.message}</Text>

                    {/* Display artist comment image if url is present */}
                    {artistComment.url && artistComment.media_type === "PHOTO" && (
                      <Image source={{ uri: artistComment.url }} style={styles.artistCommentImage} />
                    )}

                    <View style={styles.interactionRow}>
                      <TouchableOpacity>
                        <Foundation name="comments" size={24} color="#333" />
                        <Text style={styles.iconText}>{artistComment.commentReactionCount}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity>
                        <Foundation name="heart" size={24} color="#333" />
                        <Text style={styles.iconText}>{artistComment.commentReactionCount}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteComment(artistComment.id)}>
                        <Icon name="trash" size={20} color="red" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}




            <View style={styles.postCard}>
              <View style={styles.userInfoContainer}>
                <Image source={{ uri: item.user?.avatar_url }} style={styles.avatar} />
                <View>
                  <Text style={styles.userName}>{item.user?.full_name}</Text>
                  <Text style={styles.userLocation}>{item.user?.location}</Text>
                </View>
              </View>

              <Text style={styles.postText}>{item.message}</Text>

              {item.image_url && (
                <Image source={{ uri: item.image_url }} style={styles.postImage} />
              )}

              <View style={styles.interactionRow}>
                <TouchableOpacity onPress={toggleComments}>
                  <Foundation name="comments" size={24} color="#FFF" />
                  <Text style={styles.iconText}>{item.comments.length}</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Foundation name="heart" size={24} color="#FFF" />
                  <Text style={styles.iconText}>{item.reactionCount}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
        ListFooterComponent={
          <View>
            <TouchableOpacity onPress={toggleComments}>
              <Text style={styles.collapseText}>
                {commentsCollapsed ? ' ' : ' '}
              </Text>
            </TouchableOpacity>
            {!commentsCollapsed && (
              <FlatList
                data={post.comments}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.commentContainer}>
                    <View style={styles.userInfoContainer}>
                      <Image source={{ uri: item.user.avatar_url }} style={styles.avatar} />
                      <View>
                        <Text style={styles.userName}>{item.user.full_name}</Text>
                        <Text style={styles.commentText}>{item.message}</Text>
                      </View>
                    </View>

                    {/* Display comment image if imageUrl is present */}
                    {item.imageUrl && (
                      <Image source={{ uri: item.imageUrl }} style={styles.commentImage} />
                    )}

                    <View style={styles.interactionRow}>
                      <TouchableOpacity onPress={() => likeComment(item.id)}>
                        <Icon
                          name="heart"
                          size={20}
                          color={likedComments.includes(item.id) ? 'red' : '#333'}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleOpenReplyModal(item.id)}>
                        <AntDesign name="message1" size={20} color="#333" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => createOrNavigateConversation(item.user.id)}>
                        <Icon name="paper-plane" size={20} color="#333" />
                      </TouchableOpacity>
                    </View>

                    {/* Toggle View Replies */}
                    {item.replies && item.replies.length > 0 && (
                      <TouchableOpacity onPress={() => toggleReplies(item.id)} style={styles.dropdownButton}>
                        <Text style={styles.dropdownText}>
                          {showReplies[item.id] ? 'Hide Replies' : `View Replies (${item.replies.length})`}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* Display replies if showReplies for the comment is true */}
                    {showReplies[item.id] && (
                      <View style={styles.repliesContainer}>
                        {item.replies.map((reply, index) => (
                          <View key={index} style={styles.reply}>
                            {/* Display reply message */}
                            <Text style={styles.replyText}>{reply.message}</Text>

                            {/* Display reply timestamp */}
                            <Text style={styles.replyTimestamp}>
                              {new Date(reply.created_at).toLocaleTimeString()}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}



                  </View>
                )}
              />

            )}
          </View>
        }
      />

      <Modal
        animationType="slide"
        transparent
        visible={isModalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Message Group</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Write a message..."
              placeholderTextColor="gray"
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />

            {selectedImage && (
              <Image source={{ uri: selectedImage }} style={{ width: 100, height: 100, marginBottom: 10 }} />
            )}

            <View style={styles.iconRow}>
              <TouchableOpacity onPress={uploadFile}>
                <Icon name="image" size={24} color="blue" />
              </TouchableOpacity>
              <TouchableOpacity onPress={takePicture}>
                <Icon name="camera" size={24} color="blue" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.postButton} onPress={handleSendComment}>
              <Text style={styles.postButtonText}>Send</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Reply Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={isReplyModalVisible}
        onRequestClose={handleCloseReplyModal}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Reply to Comment</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Write your reply..."
              placeholderTextColor="gray"
              value={replyText}
              onChangeText={setReplyText}
              multiline
            />
            <TouchableOpacity style={styles.postButton} onPress={handleSendReply}>
              <Text style={styles.postButtonText}>Reply</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={handleCloseReplyModal}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 16 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0c002b' },
  errorText: { color: '#FFF', fontSize: 18 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#000',
  },
  dropdownButton: {
    paddingVertical: 5,
    marginTop: 5,
  },
  dropdownText: {
    color: '#FF0080', // Customize the color if needed
    fontSize: 14,
  },
  repliesContainer: {
    paddingLeft: 20,
    marginTop: 10,
  },
  reply: {
    marginBottom: 5,
  },
  replyText: {
    color: '#000', // Customize as needed
    fontSize: 14,
  },
  replyTimestamp: {
    color: '#000', // Lighter color for timestamp
    fontSize: 8,
  },
  artistCommentImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginVertical: 10,
  },
  postTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  plusIcon: { padding: 8 },
  postCard: {
    backgroundColor: '#000',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  commentImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginVertical: 10,
  },
  artistCommentContainer: {
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  userLocation: { fontSize: 13, color: '#666' },
  postText: { fontSize: 14, color: '#FFF', marginVertical: 10 },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    marginVertical: 10,
    backgroundColor: '#ddd',
  },
  interactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  iconText: { marginLeft: 5, fontSize: 14, color: '#FFF' },
  commentContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  commentText: { color: '#333', marginTop: 5 },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  textInput: {
    width: '100%',
    minHeight: 80,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
    color: '#2c3e50',
    backgroundColor: '#f4f4f9',
  },
  iconRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 20 },
  postButton: {
    backgroundColor: '#FF0080',
    padding: 10,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  postButtonText: { color: 'white', fontWeight: 'bold' },
  closeButton: { marginTop: 10 },
  closeButtonText: { color: 'blue', fontWeight: 'bold' },
  collapseText: {
    color: '#FFF',
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PostDetailPage;
