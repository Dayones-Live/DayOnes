import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  Modal,
} from 'react-native';
import axios from 'axios';
import { BASEURL } from '../assets/constants';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Foundation from 'react-native-vector-icons/Foundation';
import Icon from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { launchImageLibrary } from 'react-native-image-picker';

const PostDetailPage = () => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [likedComments, setLikedComments] = useState([]);
  const [commentsToShow, setCommentsToShow] = useState(10);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showComments, setShowComments] = useState(false);

  const route = useRoute();
  const navigation = useNavigation();
  const { postId } = route.params;
  const accessToken = useSelector((state) => state.accessToken);

  const fetchPostDetails = async () => {
    try {
      const response = await axios.get(`${BASEURL}/api/v1/post/${postId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const postData = response.data?.data?.post || {};
      const reactions = response.data?.data?.reactions || [];
      const reactionCount = reactions.length || 0;
      const artistComments = response.data?.data?.artistComments || [];
      const comments = response.data?.data?.comments || [];
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

  const handleSelectImage = () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else {
        const { uri } = response.assets[0];
        setSelectedImage(uri);
      }
    });
  };

  const handleSendComment = async () => {
    if (!commentText.trim() && !selectedImage) {
      Alert.alert('Error', 'Comment or image is required.');
      return;
    }

    try {
      const commentData = { message: commentText };

      if (selectedImage) {
        commentData.imageUrl = selectedImage;
      }

      const response = await axios.post(
        `${BASEURL}/api/v1/post/${postId}/comment`,
        commentData,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.status === 200 || response.status === 201) {
        Alert.alert('Success', 'Your comment has been posted.');
        setCommentText('');
        setSelectedImage(null);
        setModalVisible(false);
        fetchPostDetails();
      } else {
        Alert.alert('Error', 'Failed to post the comment. Please try again.');
      }
    } catch (error) {
      console.error('Error sending comment:', error.response?.data || error.message);
      Alert.alert('Error', `Failed to send comment: ${error.response?.data?.message || 'An error occurred'}`);
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

  const createOrNavigateConversation = async (receiverId, initialMessage = 'Hey!') => {
    try {
      const response = await axios.get(`${BASEURL}/api/v1/conversation?pageNo=1&pageSize=100`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const conversations = response.data?.data?.conversations || [];
      const existingConversation = conversations.find(
        (conv) => conv.reciever_id === receiverId || conv.sender_id === receiverId
      );

      if (existingConversation) {
        navigation.navigate('ConversationThread', { conversationId: existingConversation.id });
      } else {
        const newConvResponse = await axios.post(
          `${BASEURL}/api/v1/conversation`,
          {
            recieverId: receiverId,
            lastMessage: initialMessage,
          },
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        const conversationId = newConvResponse.data?.data?.id;
        navigation.navigate('ConversationThread', { conversationId });
      }
    } catch (error) {
      console.error('Error creating/navigating conversation:', error.message);
      Alert.alert('Error', 'Failed to start a conversation.');
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
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
      <ScrollView contentContainerStyle={styles.scrollViewContainer} style={{ flex: 1 }}>
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Foundation name="arrow-left" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.postTitle}>{post.locale || 'Unknown Location'}</Text>
            <TouchableOpacity onPress={handleOpenModal} style={styles.plusIcon}>
              <AntDesign name="pluscircleo" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.userInfoContainer}>
            <Image source={{ uri: post.user?.avatar_url }} style={styles.avatar} />
            <View>
              <Text style={styles.userName}>{post.user?.full_name}</Text>
              <Text style={styles.userLocation}>{post.user?.location}</Text>
            </View>
          </View>

          <Text style={styles.postText}>{post.message}</Text>

          {post.image_url && (
            <Image source={{ uri: post.image_url }} style={styles.postImage} />
          )}

          <View style={styles.interactionRow}>
            <TouchableOpacity onPress={toggleComments}>
              <Foundation name="comments" size={24} color="#333" />
              <Text style={styles.iconText}>{post.comments.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Foundation name="heart" size={24} color="#333" />
              <Text style={styles.iconText}>{post.reactionCount}</Text>
            </TouchableOpacity>
          </View>

          {showComments && (
            <FlatList
              data={post.comments.slice(0, commentsToShow)}
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
                  <View style={styles.interactionRow}>
                    <TouchableOpacity onPress={() => likeComment(item.id)}>
                      <Icon
                        name="heart"
                        size={20}
                        color={likedComments.includes(item.id) ? '#FF0080' : '#333'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => createOrNavigateConversation(item.user.id)}>
                      <Icon name="paper-plane" size={20} color="#333" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
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
              <TouchableOpacity onPress={handleSelectImage}>
                <Icon name="image" size={24} color="blue" />
              </TouchableOpacity>
              <Icon name="camera" size={24} color="blue" />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c002b', padding: 16 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0c002b' },
  errorText: { color: '#FFF', fontSize: 18 },
  scrollViewContainer: { paddingBottom: 100 },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomColor: '#ddd',
    borderBottomWidth: 0.5,
  },
  plusIcon: {
    padding: 5,
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
  postText: { fontSize: 14, color: '#333', marginVertical: 10 },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    marginVertical: 10,
    backgroundColor: '#ddd',
  },
  interactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginTop: 10,
  },
  iconText: { marginLeft: 5, fontSize: 14, color: '#333' },
  commentContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
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
});

export default PostDetailPage;
