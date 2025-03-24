import React, { useEffect, useState, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import axios from 'axios';
import { BASEURL } from '../../assets/constants';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Foundation from 'react-native-vector-icons/Foundation';
import Icon from 'react-native-vector-icons/FontAwesome';
import styles from './artistStyles/PostDetailsPageStyles';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { uploadImageToBucket } from '../../utils';
import { uploadVideoToBucket } from '../../utils/videoUploadService';
import Video from 'react-native-video';
import ImageViewing from 'react-native-image-viewing';
import { convertToTemporaryFile } from '../../assets/components/convertToTemporaryFileHelper';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const detectAndStyleLinks = (text) => {
  // Regex pattern to match URLs
  const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
  
  if (!text) return null;

  // Split text by URLs
  const parts = text.split(urlPattern);
  
  return parts.map((part, index) => {
    // Check if this part matches a URL pattern
    if (part && (part.startsWith('http') || part.startsWith('www.'))) {
      const url = part.startsWith('www.') ? `https://${part}` : part;
      return (
        <Text
          key={index}
          style={styles.linkText}
          onPress={() => Linking.openURL(url)}
        >
          {part}
        </Text>
      );
    }
    // Return regular text
    return part ? <Text key={index}>{part}</Text> : null;
  });
};

const PostDetailPage = () => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [likedComments, setLikedComments] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [commentsCollapsed, setCommentsCollapsed] = useState(true);
  const [replyParentId, setReplyParentId] = useState(null);
  const [mediaType, setMediaType] = useState(null); // NEW: track whether it's a photo or video
  const [showReplies, setShowReplies] = useState({});
  const [showArtistReplies, setShowArtistReplies] = useState({}); // Track artist comment replies
  const [likedReplies, setLikedReplies] = useState([]);
  const [isFullScreenVisible, setFullScreenVisible] = useState(false);
  const [imagesForViewing, setImagesForViewing] = useState([]); // Stores images for full-screen viewing
  const [reportMenuVisible, setReportMenuVisible] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const [reportModalVisible, setReportModalVisible] = useState(false); // Modal visibility
  const [reportDescription, setReportDescription] = useState(""); // Input for report description
  const [isSelectingMedia, setIsSelectingMedia] = useState(false);
  const [isSendingComment, setIsSendingComment] = useState(false);



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
      // Use the helper function for Android scoped storage compatibility
      const filePath = Platform.OS === 'android' && uri.startsWith('content://')
        ? await convertToTemporaryFile(uri, mediaType === 'PHOTO' ? 'jpg' : 'mp4')
        : uri;

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

  const handleSelectMedia = () => {
    setIsSelectingMedia(true); // Start loading indicator
    launchImageLibrary({ mediaType: 'mixed' }, async (response) => {
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        let mediaUri = asset.uri;

        try {
          if (Platform.OS === 'android' && mediaUri.startsWith('content://')) {
            mediaUri = await convertToTemporaryFile(
              mediaUri,
              asset.type.startsWith('image/') ? 'jpg' : 'mp4'
            );
          }

          setSelectedImage(mediaUri);
          setMediaType(asset.type.startsWith('image/') ? 'PHOTO' : 'VIDEO');
        } catch (error) {
          console.error('Error handling selected media:', error);
          Alert.alert('Error', 'Failed to process selected media.');
        } finally {
          setIsSelectingMedia(false); // Stop loading indicator
        }
      } else {
        setIsSelectingMedia(false); // Stop loading indicator even if no media is selected
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

      // Define the options for the camera
      const options = {
        mediaType: 'photo', // or 'mixed' if you want both photo and video options
        includeBase64: false, // Add this if you don't want the base64 string
        saveToPhotos: true, // Save the photo to the user's gallery
      };

      if (result === RESULTS.GRANTED) {
        // Permission is already granted; launch the camera
        launchCamera(options, (response) => {
          if (response.didCancel) {
            console.log('User cancelled image picker');
          } else if (response.errorMessage) {
            console.log('ImagePicker Error: ', response.errorMessage);
          } else if (response.assets && response.assets.length > 0) {
            const capturedImage = response.assets[0];
            setSelectedImage(capturedImage.uri);
            setMediaType('PHOTO');
            navigation.navigate('EditScreen', { selectedImage: capturedImage });
          }
        });
      } else if (result === RESULTS.DENIED) {
        // Request permission
        const requestResult = await request(permission);
        if (requestResult === RESULTS.GRANTED) {
          // Permission granted after request; launch the camera
          launchCamera(options, (response) => {
            if (response.didCancel) {
              console.log('User cancelled image picker');
            } else if (response.errorMessage) {
              console.log('ImagePicker Error: ', response.errorMessage);
            } else if (response.assets && response.assets.length > 0) {
              const capturedImage = response.assets[0];
              setSelectedImage(capturedImage.uri);
              setMediaType('PHOTO');
              navigation.navigate('EditScreen', { selectedImage: capturedImage });
            }
          });
        } else {
          // Permission denied
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


  const handleSendComment = async () => {
    if (selectedImage && !commentText.trim()) {
      Alert.alert(
        'Message Required',
        'Please include a message when sending a photo.',
        [{ text: 'OK', onPress: () => { } }]
      );
      return;
    }

    if (!commentText.trim() && !selectedImage) {
      Alert.alert('Error', 'Comment or image is required.');
      return;
    }

    setIsSendingComment(true); // Start loading indicator
    let s3Url = selectedImage;

    if (selectedImage && !selectedImage.startsWith('https://')) {
      s3Url = await handleMediaUpload(selectedImage);
      if (!s3Url) {
        setIsSendingComment(false); // Stop loading indicator on failure
        return;
      }
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
    } finally {
      setIsSendingComment(false); // Stop loading indicator
    }
  };



  const handleBlockUser = (commentId) => {
    let userToBlock = null;

    // Search for the comment or reply in post.comments
    post.comments.forEach((comment) => {
      if (comment.id === commentId) {
        // Top-level comment
        userToBlock = comment.user?.id;
      } else if (comment.replies) {
        // Search in replies of top-level comments
        const reply = comment.replies.find((reply) => reply.id === commentId);
        if (reply) {
          userToBlock = reply.user?.id;
        }
      }
    });

    // Search for the comment or reply in artistComments
    post.artistComments.forEach((artistComment) => {
      if (artistComment.id === commentId) {
        // Top-level artist comment
        userToBlock = artistComment.user?.id;
      } else if (artistComment.replies) {
        // Search in replies of artist comments
        const reply = artistComment.replies.find((reply) => reply.id === commentId);
        if (reply) {
          userToBlock = reply.user?.id;
        }
      }
    });

    if (!userToBlock) {
      console.error("User ID not found for the given comment/reply:", { commentId });
      Alert.alert("Error", "Unable to block the user. User information is missing.");
      return;
    }

    Alert.alert(
      "Block User",
      "Are you sure you want to block this user?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await axios.post(
                `${BASEURL}/api/v1/blocks`,
                { blockedUser: userToBlock },
                { headers: { Authorization: `Bearer ${accessToken}` } }
              );

              if (response.status === 200 || response.status === 201) {
                Alert.alert("Success", "The user has been blocked.");
              } else {
                Alert.alert("Error", "Failed to block the user.");
              }
            } catch (error) {
              console.error("Error blocking user:", error);
              Alert.alert("Error", "An error occurred while blocking the user.");
            }
          },
        },
      ]
    );
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

    if (commentsCollapsed) {
      setTimeout(() => {
        if (commentsSectionRef.current) {
          commentsSectionRef.current.scrollToOffset({
            offset: 800, // Adjust this value based on where your comments section starts
            animated: true,
          });
        }
      }, 100); // Delay ensures the comments have time to expand before scrolling
    }
  };



  const openReportMenu = (commentId) => {
    setSelectedCommentId(commentId);
    setReportMenuVisible(true);
  };

  const closeReportMenu = () => {
    setSelectedCommentId(null);
    setReportMenuVisible(false);
  };

  const openReportModal = () => {
    closeReportMenu(); // Close the report menu before opening the modal
    setReportDescription(""); // Clear previous input
    setReportModalVisible(true);
  };

  const closeReportModal = () => {
    setReportDescription("");
    setReportModalVisible(false);
  };

  const submitCommentReport = async () => {
    if (!reportDescription.trim()) {
      Alert.alert("Error", "Please provide a reason for reporting the comment.");
      return;
    }

    try {
      const response = await axios.post(
        `${BASEURL}/api/v1/report`,
        {
          description: reportDescription.trim(),
          reportedCommentId: selectedCommentId,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.status === 200 || response.status === 201) {
        Alert.alert("Success", "Your report has been submitted successfully. Thank you!");
        closeReportModal();
      } else {
        Alert.alert("Error", "Failed to report the comment.");
      }
    } catch (error) {
      console.error("Error reporting comment:", error);
      Alert.alert("Error", "An unexpected error occurred while reporting the comment.");
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

  const createOrNavigateConversation = async (userId, profilePicture, username) => {
    console.log('createOrNavigateConversation: Starting process for userId:', userId);

    try {
      // Step 1: Check if a conversation already exists
      console.log('Checking for existing conversation for userId:', userId);
      const existingConversation = await checkForExistingConversation(userId);
      console.log('Existing conversation:', existingConversation);

      if (existingConversation) {
        console.log('Existing conversation found. Navigating to ConversationThread...');
        navigation.navigate('ConversationThread', {
          conversationId: existingConversation.id,
          profilePicture: existingConversation.reciever.avatar_url,
          username: existingConversation.reciever.full_name,
          userId: existingConversation.reciever.id
        });
      } else {
        console.log('No existing conversation found. Navigating to new ConversationThread...');
        // Navigate directly to ConversationThread without creating conversation
        navigation.navigate('ConversationThread', {
          profilePicture: profilePicture || 'https://example.com/default-avatar.png',
          username: username || 'User',
          userId: userId,
          isNewConversation: true // Add this flag to indicate it's a new conversation
        });
      }
    } catch (error) {
      console.error('Error in createOrNavigateConversation:', error.response?.data || error.message);
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
                        {detectAndStyleLinks(artistComment.message)}
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
                        <View style={styles.iconContainer}>
                          <Foundation name="heart" size={24} color="#fff" />
                          <Text style={styles.iconText}>{artistComment.commentReactionCount}</Text>
                        </View>

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
                                  <TouchableOpacity onPress={() => createOrNavigateConversation(reply.user.id, reply.user.avatar_url, reply.user.full_name)}>
                                    <Icon name="paper-plane" size={20} color="#333" />
                                  </TouchableOpacity>
                                  <TouchableOpacity onPress={() => openReportMenu(reply.id)}>
                                    <Icon name="ellipsis-h" size={20} color="#333" style={styles.dotsButton} />
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
                          {detectAndStyleLinks(item.message)}
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

                      <TouchableOpacity onPress={() => createOrNavigateConversation(item.user.id, item.user.avatar_url, item.user.full_name)}>
                        <Icon name="paper-plane" size={20} color="#333" />
                      </TouchableOpacity>
                      {/* Three-Dot Button */}
                      <TouchableOpacity onPress={() => openReportMenu(item.id)}>
                        <Icon name="ellipsis-h" size={20} color="#333" style={styles.dotsButton} />
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
              {isSelectingMedia ? (
                <ActivityIndicator size="small" color="blue" />
              ) : (
                <>
                  <TouchableOpacity onPress={handleSelectMedia}>
                    <Icon name="image" size={24} color="blue" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleTakeMedia}>
                    <Icon name="camera" size={24} color="blue" />
                  </TouchableOpacity>
                </>
              )}
            </View>

            <TouchableOpacity
              style={styles.postButton}
              onPress={isSendingComment ? null : handleSendComment}
              disabled={isSendingComment} // Disable button while loading
            >
              {isSendingComment ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.postButtonText}>Send</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={reportModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeReportModal}
      >
        <View style={styles.reportModalOverlay}>
          <View style={styles.reportModalContainer}>
            <Text style={styles.reportModalTitle}>Report Comment</Text>
            <TextInput
              style={styles.reportModalDescriptionInput}
              placeholder="Why are you reporting this comment?"
              placeholderTextColor="#aaa"
              multiline
              value={reportDescription}
              onChangeText={(text) => setReportDescription(text)}
            />
            <View style={styles.reportModalButtons}>
              <TouchableOpacity style={styles.reportModalCancelButton} onPress={closeReportModal}>
                <Text style={styles.reportModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.reportModalSubmitButton} onPress={submitCommentReport}>
                <Text style={styles.reportModalButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {reportMenuVisible && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={reportMenuVisible}
          onRequestClose={closeReportMenu}
        >
          <TouchableOpacity
            style={styles.reportMenuOverlay}
            onPress={closeReportMenu}
            activeOpacity={1}
          >
            <View style={styles.reportMenuContainer}>
              {/* Report Comment */}
              <TouchableOpacity
                onPress={() => openReportModal(selectedCommentId)} // Pass the comment ID
                style={styles.reportMenuItem}
              >
                <Icon name="flag" size={20} color="red" style={styles.reportMenuFlagIcon} />
                <Text style={styles.reportMenuText}>Report Comment</Text>
              </TouchableOpacity>

              {/* Block User */}
              <TouchableOpacity
                onPress={() => handleBlockUser(selectedCommentId)} // Handle block user
                style={styles.reportMenuItem}
              >
                <Icon name="ban" size={20} color="#ff4444" style={styles.reportMenuFlagIcon} />
                <Text style={styles.reportMenuText}>Block User</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}



      <ImageViewing
        images={imagesForViewing}
        imageIndex={0}
        visible={isFullScreenVisible}
        onRequestClose={closeFullScreenImage}
      />

    </SafeAreaView>
  );
};



export default PostDetailPage;
