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
  KeyboardAvoidingView,
  Platform,
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
import { uploadVideoToBucket } from '../../utils/videoUploadService';
import Video from 'react-native-video';
import ImageViewing from 'react-native-image-viewing';

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
  const [mediaType, setMediaType] = useState(null); // NEW: track whether it's a photo or video
  const [showReplies, setShowReplies] = useState({});
  const [showArtistReplies, setShowArtistReplies] = useState({}); // Track artist comment replies
  const [likedReplies, setLikedReplies] = useState([]);
  const [isFullScreenVisible, setFullScreenVisible] = useState(false);
  const [imagesForViewing, setImagesForViewing] = useState([]); // Stores images for full-screen viewing



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
      // Fetching post data
      const detailResponse = await axios.get(`${BASEURL}/api/v1/post/${postId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const postData = detailResponse.data?.data?.post || {};
      const artistComments = detailResponse.data?.data?.artistComments?.reverse() || [];
      const comments = detailResponse.data?.data?.comments || [];
      const structuredComments = structureCommentsWithReplies(comments);

      // Fetching reaction count
      const feedResponse = await axios.get(`${BASEURL}/api/v1/post?pageNo=1&pageSize=50`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const posts = feedResponse.data?.data?.posts || [];
      const postFromFeed = posts.find((post) => post.id === postId);

      const combinedPostData = {
        ...postData,
        reactionCount: postFromFeed?.reactionCount || 0,
        artistComments,
        comments: structuredComments,
      };

      // Setting liked comments
      const initialLikedComments = comments
        .filter((comment) => comment.commentReaction && comment.commentReaction.length > 0)
        .map((comment) => comment.id);
      setLikedComments(initialLikedComments);

      // Setting liked replies from artistComments
      const initialLikedReplies = [];
      artistComments.forEach((artistComment) => {
        if (artistComment.replies && artistComment.replies.length > 0) {
          artistComment.replies.forEach((reply) => {
            console.log("Checking reply for reactions:", reply); // Log reply details
            if (reply.commentReaction && reply.commentReaction.length > 0) {
              console.log("Reply has reaction:", reply.id);
              initialLikedReplies.push(reply.id);
            }
          });
        }
      });
      console.log("Initial liked replies from artistComments:", initialLikedReplies); // Log final list of liked replies
      setLikedReplies(initialLikedReplies);

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
    setSelectedImage(null); // Clear the selected image
    setMediaType(null); // Clear the media type
    setModalVisible(false); // Close the modal
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

  const openFullScreenImage = (imageUri) => {
    setImagesForViewing([{ uri: imageUri }]); // Set the image to be viewed in full screen
    setFullScreenVisible(true);
  };

  const closeFullScreenImage = () => {
    setFullScreenVisible(false);
  };


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
        setSelectedImage(asset.uri);
        setMediaType(asset.type.startsWith('image/') ? 'PHOTO' : 'VIDEO');
      }
    });
  };


  const handleTakeMedia = () => {
    launchCamera({ mediaType: 'mixed' }, (response) => {
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        setSelectedImage(asset.uri);
        setMediaType(asset.type.startsWith('image/') ? 'PHOTO' : 'VIDEO');
      }
    });
  };

  const handleSendComment = async () => {
    if (!commentText.trim() && !selectedImage) {
      Alert.alert('Error', 'Comment or image is required.');
      return;
    }

    let s3Url = selectedImage;
    if (selectedImage && !selectedImage.startsWith('https://')) {
      s3Url = await handleMediaUpload(selectedImage);
      if (!s3Url) return;
    }

    const commentData = {
      message: commentText.trim(),
      ...(s3Url && { url: s3Url, mediaType: mediaType }),
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

  const likeReply = async (replyId) => {
    try {
      if (likedReplies.includes(replyId)) {
        // Dislike the reply
        await axios.post(`${BASEURL}/api/v1/comment/dislike/${replyId}`, {}, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setLikedReplies((prevLikedReplies) =>
          prevLikedReplies.filter((id) => id !== replyId)
        );
      } else {
        // Like the reply
        await axios.post(`${BASEURL}/api/v1/comment/like/${replyId}`, {}, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setLikedReplies((prevLikedReplies) => [...prevLikedReplies, replyId]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to like/dislike the reply.');
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
            <Text style={styles.postTitle}>{post.locale || 'My DayOnes'}</Text>
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
    {item.artistComments
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map((artistComment) => (
        <View key={artistComment.id} style={styles.artistCommentContainer}>
          <View style={styles.userInfoContainer}>
            <Image source={{ uri: artistComment.user.avatar_url }} style={styles.avatar} />
            <View>
              <Text style={styles.userName}>{artistComment.user.full_name}</Text>
              <Text style={styles.userLocation}>{artistComment.user.location}</Text>
            </View>
          </View>
          <Text style={[styles.commentText, styles.artistCommentText]}>
            {artistComment.message}
          </Text>
          {artistComment.url && artistComment.media_type === "PHOTO" && (
            <TouchableOpacity onPress={() => openFullScreenImage(artistComment.url)}>
              <Image source={{ uri: artistComment.url }} style={styles.artistCommentImage} />
            </TouchableOpacity>
          )}
          {artistComment.media_type === "VIDEO" && artistComment.url && (
            <Video
              source={{ uri: artistComment.url }}
              style={styles.messageVideo}
              paused={true}
              resizeMode="contain"
              controls
            />
          )}
          <View style={styles.interactionRow}>
            <TouchableOpacity onPress={() => toggleArtistReplies(artistComment.id)}>
              <Foundation name="comments" size={24} color="#fff" />
              <Text style={styles.iconText}>{artistComment.replies?.length || 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => likeComment(artistComment.id)}>
              <Foundation name="heart" size={24} color="#fff" />
              <Text style={styles.iconText}>{artistComment.commentReactionCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteComment(artistComment.id)}>
              <Icon name="trash" size={20} color="red" />
            </TouchableOpacity>
          </View>
          {showArtistReplies[artistComment.id] && artistComment.replies && artistComment.replies.length > 0 && (
            <View style={styles.repliesContainer}>
              {artistComment.replies
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .map((reply) => (
                  <View key={reply.id} style={[styles.commentContainer, { marginLeft: 20 }]}>
                    <View style={styles.userInfoContainer}>
                      <Image source={{ uri: reply.user.avatar_url }} style={styles.avatar} />
                      <View>
                        <Text style={styles.userName}>{reply.user.full_name}</Text>
                        <Text style={styles.commentText}>{reply.message}</Text>
                      </View>
                    </View>
                    {reply.url && reply.media_type === "PHOTO" && (
                      <Image source={{ uri: reply.url }} style={styles.commentAImage} />
                    )}
                    {reply.url && reply.media_type === "VIDEO" && (
                      <Video
                        source={{ uri: reply.url }}
                        style={styles.commentVideo}
                        paused={true}
                        resizeMode="contain"
                        controls
                      />
                    )}
                    <View style={styles.interactionRow}>
                      <TouchableOpacity onPress={() => likeReply(reply.id)}>
                        <Icon
                          name="heart"
                          size={20}
                          color={likedReplies.includes(reply.id) ? "red" : "#333"}
                        />
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
                {item.user?.avatar_url ? (
                  <Image source={{ uri: item.user.avatar_url }} style={styles.avatar} />
                ) : null}
                <View>
                  <Text style={styles.userName}>{item.user?.full_name}</Text>
                  <Text style={styles.userLocation}>{item.user?.location}</Text>
                </View>
              </View>
              <Text style={styles.postText}>{item.message}</Text>
              {item.image_url && (
                <TouchableOpacity onPress={() => openFullScreenImage(item.image_url)}>
                  <Image source={{ uri: item.image_url }} style={styles.postImage} />
                </TouchableOpacity>
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

            </TouchableOpacity>
            {!commentsCollapsed && (
              <FlatList
                data={post.comments}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.commentContainer}>
                    <View style={styles.userInfoContainer}>
                      {item.user.avatar_url && (
                        <Image source={{ uri: item.user.avatar_url }} style={styles.avatar} />
                      )}
                      <View>
                        <Text style={styles.userName}>{item.user.full_name}</Text>
                        <Text
                          style={[
                            styles.commentText,
                            item.user.type === 'artist' ? styles.artistCommentText : styles.fanCommentText,
                          ]}
                        >
                          {item.message}
                        </Text>
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
      {reply.user.avatar_url && (
        <Image source={{ uri: reply.user.avatar_url }} style={styles.avatar} />
      )}
      <Text style={styles.userName}>{reply.user.full_name}</Text>
    </View>
    <Text style={styles.replyText}>{reply.message}</Text>
    {reply.url && reply.media_type === 'PHOTO' && (
      <TouchableOpacity onPress={() => openFullScreenImage(reply.url)}>
        <Image source={{ uri: reply.url }} style={styles.commentAImage} />
      </TouchableOpacity>
    )}
    {reply.url && reply.media_type === 'VIDEO' && (
      <Video
        source={{ uri: reply.url }}
        style={styles.commentVideo}
        paused={true}
        resizeMode="contain"
        controls
      />
    )}
    <Text style={styles.replyTimestamp}>
      {new Date(reply.created_at).toLocaleTimeString()}
    </Text>
  </View>
))}

<ImageViewing
  images={imagesForViewing} // This contains the selected image's URL
  imageIndex={0}
  visible={isFullScreenVisible}
  onRequestClose={closeFullScreenImage}
/>

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
        <KeyboardAvoidingView
          style={styles.modalBackground}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
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
              <View style={styles.mediaContainer}>
                {mediaType === 'PHOTO' ? (
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.mediaPreview}
                  />
                ) : (
                  <Video
                    source={{ uri: selectedImage }}
                    style={styles.mediaPreview}
                    paused
                    controls
                    resizeMode="contain"
                  />
                )}
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setSelectedImage(null)}
                >
                  <AntDesign name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.iconRow}>
              <TouchableOpacity onPress={handleSelectMedia}>
                <Icon name="image" size={24} color="blue" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleTakeMedia}>
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
        </KeyboardAvoidingView>
      </Modal>


      <Modal
        animationType="slide"
        transparent
        visible={isReplyModalVisible}
        onRequestClose={handleCloseReplyModal}
      >
        <KeyboardAvoidingView
          style={styles.modalBackground}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
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
        </KeyboardAvoidingView>
      </Modal>
      <ImageViewing
        images={imagesForViewing}
        imageIndex={0}
        visible={isFullScreenVisible}
        onRequestClose={closeFullScreenImage}
      />

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
  mediaContainer: {
    position: 'relative',
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#000',
  },
  commentAImage: {
    width: "90%",
    height: 200,
    borderRadius: 10,
    marginVertical: 10,
    backgroundColor: "#000",
    left:"9%",
    

  },
  commentVideo: {
    width: "90%",
    height: 200,
    borderRadius: 10,
    marginVertical: 10,
    backgroundColor: "#000",
    left:"9%",
  },
  
  clearButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 5,
    zIndex: 1,
  },
  dropdownButton: { paddingVertical: 5, marginTop: 5 },
  dropdownText: { color: '#FF0080', fontSize: 14 },
  repliesContainer: { paddingLeft: 20, marginTop: 10 },
  reply: { marginBottom: 5 },
  replyText: { color: '#000', fontSize: 14 },
  replyTimestamp: { color: '#000', fontSize: 8 },
  artistCommentImage: { width: '100%', height: 350, borderRadius: 10, marginVertical: 10 },
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
  messageVideo: {
    width: '100%',
    height: 500,
    borderRadius: 10,
    marginBottom: 5,
  },
  commentImage: { width: '100%', height: 200, borderRadius: 10, marginVertical: 10 },
  artistCommentContainer: { backgroundColor: '#000', padding: 10, borderRadius: 8, marginVertical: 5 },
  userInfoContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  userLocation: { fontSize: 13, color: '#666' },
  postText: { fontSize: 14, color: '#FFF', marginVertical: 10 },
  postImage: { width: '100%', height: 500, borderRadius: 10, marginVertical: 10, backgroundColor: '#ddd' },
  interactionRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  iconText: { marginLeft: 5, fontSize: 14, color: '#FFF' },
  commentContainer: {
    marginTop: 10,
    padding: 10, // Add padding to create internal spacing
    backgroundColor: 'white',
    borderRadius: 8,
    paddingRight: 20,
    paddingLeft: 1,
  },

  commentText: { color: 'black', marginTop: 5, paddingRight: 50, fontSize: 15 },
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
  artistCommentText: { color: '#FFF' }, // White for artist comments
  fanCommentText: { color: '#000' }, // Black for fan comments

});

export default PostDetailPage;
