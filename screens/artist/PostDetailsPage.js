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
  const [showArtistReplies, setShowArtistReplies] = useState({}); // Track artist comment replies

  const options = {
    mediaType: 'photo',
    quality: 1, // You can adjust the quality (1 is the highest)
  };
  

  const route = useRoute();
  const navigation = useNavigation();
  const { postId } = route.params;
  const accessToken = useSelector((state) => state.accessToken);
  const commentsSectionRef = useRef(null);

  const structureCommentsWithReplies = (comments) => {
    const commentMap = {};
    const structuredComments = [];
  
    comments.forEach((comment) => {
      comment.replies = [];
      commentMap[comment.id] = comment;
  
      if (comment.parentCommentId) {
        if (commentMap[comment.parentCommentId]) {
          commentMap[comment.parentCommentId].replies.push(comment);
        }
      } else {
        structuredComments.push(comment);
      }
    });
  
    return structuredComments;
  };
  
  const fetchPostDetails = async () => {
    console.log("Fetching post details for post ID:", postId);
    try {
      // Step 1: Fetch basic post data from the detail endpoint
      const detailResponse = await axios.get(`${BASEURL}/api/v1/post/${postId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const postData = detailResponse.data?.data?.post || {};
      const artistComments = detailResponse.data?.data?.artistComments?.reverse() || [];
      const comments = detailResponse.data?.data?.comments || [];
      const structuredComments = structureCommentsWithReplies(comments);
  
      // Step 2: Fetch reaction count from the main feed endpoint
      const feedResponse = await axios.get(`${BASEURL}/api/v1/post?pageNo=1&pageSize=50`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const posts = feedResponse.data?.data?.posts || [];
      const postFromFeed = posts.find((post) => post.id === postId);
  
      // Step 3: Combine data from both responses
      const combinedPostData = {
        ...postData,
        reactionCount: postFromFeed?.reactionCount || 0, // Use reactionCount from the feed endpoint
        artistComments,
        comments: structuredComments,
      };
  
      // Update the state with the combined data
      setPost(combinedPostData);
    } catch (error) {
      console.error('Error fetching post details:', error.response || error.message);
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

  const toggleArtistReplies = (commentId) => {
    setShowArtistReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

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
      return s3Url;
    } catch (error) {
      Alert.alert('Error', 'Image upload failed. Please try again.');
      return null;
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim() && !selectedImage) {
      Alert.alert('Error', 'Comment or image is required.');
      return;
    }

    let s3Url = selectedImage;
    if (selectedImage && !selectedImage.startsWith('https://')) {
      s3Url = await handleImageUpload(selectedImage);
      if (!s3Url) return;
    }

    const commentData = {
      message: commentText.trim(),
      ...(s3Url && { url: s3Url, mediaType: 'PHOTO' }),
    };

    try {
      const response = await axios.post(
        `${BASEURL}/api/v1/post/${postId}/comment`,
        commentData,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', 'Your comment has been posted.');
        setCommentText('');
        setSelectedImage(null);
        setModalVisible(false);
        fetchPostDetails();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to post the comment.');
    }
  };

  const likeComment = async (commentId) => {
    try {
      if (likedComments.includes(commentId)) {
        await axios.post(`${BASEURL}/api/v1/comment/dislike/${commentId}`, {}, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setLikedComments((prevLikedComments) =>
          prevLikedComments.filter((id) => id !== commentId)
        );
      } else {
        await axios.post(`${BASEURL}/api/v1/comment/like/${commentId}`, {}, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
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
              Alert.alert('Error', 'Failed to delete comment.');
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
    }, 100);
  };

  const handleOpenReplyModal = (commentId) => {
    setReplyParentId(commentId);
    setReplyText('');
    setReplyModalVisible(true);
  };

  const handleCloseReplyModal = () => {
    setReplyModalVisible(false);
    setReplyParentId(null);
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) {
      Alert.alert('Error', 'Reply content cannot be empty.');
      return;
    }

    const replyData = {
      message: replyText,
      parentCommentId: replyParentId,
    };

    try {
      const response = await axios.post(
        `${BASEURL}/api/v1/post/${postId}/comment`,
        replyData,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', 'Your reply has been posted.');
        setReplyText('');
        setReplyModalVisible(false);
        fetchPostDetails();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to post the reply.');
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
      return null;
    }
  };

  const createOrNavigateConversation = async (userId) => {
    try {
      const existingConversation = await checkForExistingConversation(userId);
      if (existingConversation) {
        navigation.navigate('ConversationThread', { conversationId: existingConversation.id });
      } else {
        const response = await axios.post(
          `${BASEURL}/api/v1/conversation`,
          { recieverId: userId, lastMessage: 'Hello!' },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const newConversationId = response.data?.data?.id;
        if (newConversationId) {
          navigation.navigate('ConversationThread', { conversationId: newConversationId });
        } else {
          Alert.alert('Error', 'Failed to create conversation. Please try again.');
        }
      }
    } catch (error) {
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
                    {artistComment.url && artistComment.media_type === "PHOTO" && (
                      <Image source={{ uri: artistComment.url }} style={styles.artistCommentImage} />
                    )}
                    <View style={styles.interactionRow}>
  
                    <TouchableOpacity onPress={() => toggleArtistReplies(artistComment.id)}>
                    <Foundation name="comments" size={24} color="#333" />
                    <Text style={styles.iconText}>{artistComment.replies?.length || 0}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => likeComment(artistComment.id)}>
                    <Foundation name="heart" size={24} color="#333" />
                    <Text style={styles.iconText}>{artistComment.commentReactionCount}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteComment(artistComment.id)}>
                    <Icon name="trash" size={20} color="red" />
                  </TouchableOpacity>
                </View>


                    {/* Display replies if the toggle is open */}
                    {showArtistReplies[artistComment.id] && artistComment.replies && artistComment.replies.length > 0 && (
                      <View style={styles.repliesContainer}>
                        {artistComment.replies.map((reply) => (
                          <View key={reply.id} style={[styles.commentContainer, { marginLeft: 20 }]}>
                            <View style={styles.userInfoContainer}>
                              <Image source={{ uri: reply.user.avatar_url }} style={styles.avatar} />
                              <View>
                                <Text style={styles.userName}>{reply.user.full_name}</Text>
                                <Text style={styles.commentText}>{reply.message}</Text>
                              </View>
                            </View>
                            <View style={styles.interactionRow}>
                              <TouchableOpacity onPress={() => likeComment(reply.id)}>
                                <Icon
                                  name="heart"
                                  size={20}
                                  color={likedComments.includes(reply.id) ? 'red' : '#333'}
                                />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleOpenReplyModal(reply.id)}>
                                <AntDesign name="message1" size={20} color="#333" />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => createOrNavigateConversation(reply.user.id)}>
                                <Icon name="paper-plane" size={20} color="#333" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
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
                    {item.replies && item.replies.length > 0 && (
                      <TouchableOpacity onPress={() => toggleReplies(item.id)} style={styles.dropdownButton}>
                        <Text style={styles.dropdownText}>
                          {showReplies[item.id] ? 'Hide Replies' : `View Replies (${item.replies.length})`}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {showReplies[item.id] && (
                      <View style={styles.repliesContainer}>
                        {item.replies.map((reply, index) => (
                          <View key={index} style={styles.reply}>
                            <View style={styles.userInfoContainer}>
                              <Image source={{ uri: reply.user.avatar_url }} style={styles.avatar} />
                              <Text style={styles.userName}>{reply.user.full_name}</Text>
                            </View>
                            <Text style={styles.replyText}>{reply.message}</Text>
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
  dropdownButton: { paddingVertical: 5, marginTop: 5 },
  dropdownText: { color: '#FF0080', fontSize: 14 },
  repliesContainer: { paddingLeft: 20, marginTop: 10 },
  reply: { marginBottom: 5 },
  replyText: { color: '#000', fontSize: 14 },
  replyTimestamp: { color: '#000', fontSize: 8 },
  artistCommentImage: { width: '100%', height: 200, borderRadius: 10, marginVertical: 10 },
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
  commentImage: { width: '100%', height: 200, borderRadius: 10, marginVertical: 10 },
  artistCommentContainer: { backgroundColor: '#000', padding: 10, borderRadius: 8, marginVertical: 5 },
  userInfoContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  userLocation: { fontSize: 13, color: '#666' },
  postText: { fontSize: 14, color: '#FFF', marginVertical: 10 },
  postImage: { width: '100%', height: 300, borderRadius: 10, marginVertical: 10, backgroundColor: '#ddd' },
  interactionRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  iconText: { marginLeft: 5, fontSize: 14, color: '#FFF' },
  commentContainer: { marginTop: 10, padding: 10, backgroundColor: 'white', borderRadius: 8 },
  commentText: { color: '#333', marginTop: 5 },
  modalBackground: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.7)' },
  modalContainer: { width: '90%', backgroundColor: 'white', borderRadius: 10, padding: 20, alignItems: 'center' },
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
  collapseText: { color: '#FFF', textAlign: 'center', marginVertical: 10, fontSize: 16, fontWeight: 'bold' },
});

export default PostDetailPage;