import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, Image, TouchableOpacity, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import { Modal } from 'react-native';
import axios from 'axios';
import { BASEURL } from '../../assets/constants';
import { useSelector } from 'react-redux';
import Video from 'react-native-video';
import ImageViewing from 'react-native-image-viewing';
import { uploadImageToBucket } from '../../utils';
import { uploadVideoToBucket } from '../../utils/videoUploadService';
import Icon from 'react-native-vector-icons/FontAwesome';
import {  launchImageLibrary } from 'react-native-image-picker';
import { TouchableWithoutFeedback } from 'react-native';


const MAX_COMMENT_LENGTH = 200;

const DMDetailPage = ({ route }) => {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(false);
  const [likedComments, setLikedComments] = useState([]);
  const accessToken = useSelector((state) => state.accessToken);
  const userEmail = useSelector((state) => state.userProfile.data.email);
  const userProfile = useSelector((state) => state.userProfile.data);
  const [latestArtistCommentId, setLatestArtistCommentId] = useState(null);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportDescription, setReportDescription] = useState("");
  const [reportCommentModalVisible, setReportCommentModalVisible] = useState(false);
const [reportedCommentId, setReportedCommentId] = useState(null);
const [commentReportDescription, setCommentReportDescription] = useState("");
const [commentIcons, setCommentIcons] = useState({});
const [openCommentMenuId, setOpenCommentMenuId] = useState(null);
const [activeCommentMenu, setActiveCommentMenu] = useState(null);

// Function to open the menu and set text specific to the comment
const openCommentMenu = (commentId, text) => {
  setActiveCommentMenu(commentId);
  setCommentText((prev) => ({
    ...prev,
    [commentId]: text, // Assign text or actions to the specific comment
  }));
};




const openReportCommentModal = (commentId) => {
  setReportedCommentId(commentId);
  setCommentReportDescription(""); // Clear previous input
  setReportCommentModalVisible(true);
};

const closeReportCommentModal = () => {
  setReportedCommentId(null);
  setCommentReportDescription("");
  setReportCommentModalVisible(false);
};

const submitCommentReport = async () => {
  if (!commentReportDescription.trim()) {
    Alert.alert("Error", "Please provide a reason for reporting the comment.");
    return;
  }

  // Prepare the payload
  const reportPayload = {
    description: commentReportDescription.trim(),
    reportedCommentId: reportedCommentId,
  };

  // Log the payload
  console.log("Comment Report API Payload:", reportPayload);

  try {
    const response = await axios.post(
      `${BASEURL}/api/v1/report`,
      reportPayload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    // Log the response
    console.log("Comment Report API Response:", response);

    if (response.status === 200 || response.status === 201) {
      Alert.alert("Success", "The comment has been reported successfully.");
      closeReportCommentModal();
    } else {
      Alert.alert("Error", "Failed to report the comment.");
    }
  } catch (error) {
    console.error("Error reporting comment:", error);
    Alert.alert("Error", "An unexpected error occurred while reporting the comment.");
  }
};


  const openReportModal = () => {
    setReportModalVisible(true);
  };
  
  const closeReportModal = () => {
    setReportDescription("");
    setReportModalVisible(false);
  };
  
  const submitReport = async () => {
    if (!reportDescription.trim()) {
      Alert.alert("Error", "Please provide a reason for reporting the post.");
      return;
    }
  
    try {
      console.log("Submitting report for post ID:", postId);
  
      const response = await axios.post(
        `${BASEURL}/api/v1/report`,
        {
          description: reportDescription.trim(),
          reportedPostId: postId,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
  
      console.log("Report API Response:", response);
  
      if (response.status === 200 || response.status === 201) {
        // Use a user-friendly success message
        Alert.alert("Success", "Your report has been submitted successfully. Thank you!");
        closeReportModal(); // Close the modal
      } else {
        console.log("Unexpected API Response Status:", response.status);
        Alert.alert("Error", "Failed to report the post.");
      }
    } catch (error) {
      console.error("Error reporting post:", error);
      if (error.response) {
        console.log("Error Response Data:", error.response.data);
        Alert.alert(
          "Error",
          error.response.data.message || "An unexpected error occurred while reporting the post."
        );
      } else {
        Alert.alert("Error", "An unexpected error occurred while reporting the post.");
      }
    }
  };
  
  


  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const openImageViewer = (uri) => {
    setSelectedImageUri(uri);
    setIsImageViewerVisible(true);
  };

  const reportPost = async () => {
    try {
      console.log("Attempting to report the post with ID:", postId);
  
      const response = await axios.post(
        `${BASEURL}/api/v1/report`,
        {
          description: "This post is inappropriate.", // Customize the description as needed
          reportedPostId: postId, // Use the `postId` from the route parameters
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
  
      console.log("API Response:", response);
  
      if (response.status === 200 || response.status === 201) {
        Alert.alert("Success", "The post has been reported.");
      } else {
        console.log("Unexpected API Response Status:", response.status);
        Alert.alert("Error", "Failed to report the post.");
      }
    } catch (error) {
      console.error("Error reporting post:", error);
      if (error.response) {
        console.log("Error Response Data:", error.response.data);
        console.log("Error Response Status:", error.response.status);
        console.log("Error Response Headers:", error.response.headers);
      }
      Alert.alert("Error", "An unexpected error occurred while reporting the post.");
    }
  };
  
  

  const fetchPostDetails = async () => {
    try {
      const response = await axios.get(`${BASEURL}/api/v1/post/${postId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const postData = response.data?.data?.post || {};
      const reactions = response.data?.data?.reactions || [];
      let artistComments = response.data?.data?.artistComments || [];
      const comments = response.data?.data?.comments || [];

      // Set post liked state
      const isPostLiked = reactions.some(reaction => reaction.user?.email === userEmail);
      setLiked(isPostLiked);

      // Get IDs of liked artist and fan comments
      const likedArtistComments = artistComments
        .filter(comment => comment.commentReactionCount > 0)
        .map(comment => comment.id);
      const likedFanComments = comments
        .filter(comment => comment.commentReactionCount > 0)
        .map(comment => comment.id);

      // Process artistReplies for likes
      const artistReplies = artistComments.reduce((allReplies, comment) => {
        return comment.replies ? [...allReplies, ...comment.replies] : allReplies;
      }, []);
      const likedReplies = artistReplies
        .filter(reply => reply.commentReactionCount > 0)
        .map(reply => reply.id);

      // Update likedComments to include all liked comments and replies
      setLikedComments([...likedArtistComments, ...likedFanComments, ...likedReplies]);

      // Set the latest artist comment ID
      artistComments = artistComments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      if (artistComments.length > 0) {
        const latestArtistComment = artistComments[artistComments.length - 1];
        setLatestArtistCommentId(latestArtistComment.id);
      } else {
        setLatestArtistCommentId(null);
      }

      // Flatten artist comments, replies, and fan comments into a single list
      setPost({ ...postData, artistComments, comments, artistReplies });
    } catch (error) {
      console.error('Error fetching post details:', error);
      Alert.alert('Error', 'Could not load post details.');
    }
  };


  useEffect(() => {
    fetchPostDetails();
  }, [postId]);

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

  



  const toggleLike = async () => {
    try {
      if (!liked) {
        const response = await axios.post(`${BASEURL}/api/v1/post/${postId}/likes`, {}, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.status === 200 || response.status === 201) {
          setLiked(true);
        } else {
          Alert.alert("Error", "Failed to like the post.");
        }
      } else {
        const response = await axios.delete(`${BASEURL}/api/v1/post/${postId}/likes`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.status === 200 || response.status === 204) {
          setLiked(false);
        } else {
          Alert.alert("Error", "Failed to unlike the post.");
        }
      }
    } catch (error) {
      console.error("Error toggling like on post:", error);
      Alert.alert("Error", "An unexpected error occurred.");
    }
  };


  const addComment = async () => {
    if (!commentText.trim() && !selectedMedia) {
      Alert.alert('Error', 'Comment or media is required.');
      return;
    }

    let s3Url = null;

    if (selectedMedia) {
      s3Url = await handleMediaUpload(selectedMedia);
      if (!s3Url) return; // Exit if upload fails
    }

    try {
      const body = {
        message: commentText.trim(),
        ...(s3Url && { url: s3Url, mediaType }),
        ...(latestArtistCommentId && { parentCommentId: latestArtistCommentId }),
      };

      const response = await axios.post(`${BASEURL}/api/v1/post/${postId}/comment`, body, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.status === 200 || response.status === 201) {
        const newComment = {
          ...response.data.data,
          user: {
            full_name: userProfile?.full_name || 'Unknown User',
            avatar_url: userProfile?.avatar_url || '',
          },
        };

        setPost((prevPost) => ({
          ...prevPost,
          comments: [newComment, ...prevPost.comments],
        }));
        setCommentText('');
        setSelectedMedia(null); // Clear selected media
        setMediaType(null); // Clear media type
      } else {
        Alert.alert('Error', 'Unexpected response from the server.');
      }
    } catch (error) {
      console.error('Error adding comment:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to add comment.');
    }
  };



  const likeComment = async (commentId) => {
    if (!commentId) {
      console.warn("No commentId provided to likeComment function.");
      return;
    }

    try {
      const response = await axios.post(`${BASEURL}/api/v1/comment/like/${commentId}`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.status === 200 || response.status === 201) {
        setLikedComments((prevLikedComments) => [...prevLikedComments, commentId]);
      } else {
        Alert.alert("Error", "Unexpected response from the server.");
      }
    } catch (error) {
      console.error("Error liking comment:", error);
      Alert.alert("Error", "An unexpected error occurred while liking the comment.");
    }
  };

  const dislikeComment = async (commentId) => {
    try {
      await axios.post(`${BASEURL}/api/v1/comment/dislike/${commentId}`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setLikedComments((prevLikedComments) => prevLikedComments.filter((id) => id !== commentId));
    } catch (error) {
      console.error("Error disliking comment:", error);
      Alert.alert('Error', 'Failed to dislike the comment.');
    }
  };

  if (!post) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }



  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollViewContainer}
          extraScrollHeight={80}
        >
          {post.user && post.user.avatar_url && (
  <View style={styles.userInfoContainer}>
    <Image source={{ uri: post.user.avatar_url }} style={styles.userAvatar} />
    <Text style={styles.userName}>{post.user.full_name}</Text>

    <TouchableOpacity onPress={toggleMenu}>
      <Entypo
        name="dots-three-horizontal"
        size={30}
        color="white"
        style={styles.menuIcon}
      />
    </TouchableOpacity>
  </View>
)}

{post.message && (
  <View style={styles.postMessageContainer}>
    <Text style={styles.postMessageText}>{post.message}</Text>
  </View>
)}



  
  {menuVisible && (
  <Modal
    transparent={true}
    animationType="fade"
    visible={menuVisible}
    onRequestClose={toggleMenu}
  >
     <TouchableWithoutFeedback onPress={toggleMenu}>
      <View style={styles.modalOverlay}>
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              toggleMenu();
              openReportModal(); // Open the report modal
            }}
          >
            <Ionicons name="warning-outline" size={24} color="red" />
            <Text style={styles.menuText}>Flag Post</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
)}

  
          {post.image_url && (
            <TouchableOpacity onPress={() => openImageViewer(post.image_url)}>
              <Image source={{ uri: post.image_url }} style={styles.postImage} />
            </TouchableOpacity>
          )}
  
          <View style={styles.interactionContainer}>
            <TouchableOpacity onPress={toggleLike}>
              <EvilIcons name="heart" size={30} color={liked ? "#FF0000" : "#FFFFFF"} />
            </TouchableOpacity>
          </View>
  
          <View style={styles.commentsContainer}>
          {post.artistComments
  .map((comment) => ({ ...comment, isArtistComment: true }))
  .concat(post.comments, post.artistReplies)
  .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  .map((comment, index) => (
    <View
      key={index}
      style={[
        styles.commentCard,
        comment.isArtistComment
          ? styles.artistCommentContainer
          : styles.fanCommentContainer,
        { alignSelf: comment.isArtistComment ? "flex-start" : "flex-end" },
      ]}
    >
      {comment.user && comment.user.avatar_url && (
        <Image source={{ uri: comment.user.avatar_url }} style={styles.avatar} />
      )}
      <View style={styles.commentTextContainer}>
        <Text style={styles.commentAuthor}>{comment.user?.full_name}</Text>
        <Text style={styles.commentText}>{comment.message}</Text>

        {comment.media_type === "PHOTO" && comment.url && (
          <TouchableOpacity onPress={() => openImageViewer(comment.url)}>
            <Image source={{ uri: comment.url }} style={styles.largeMedia} />
          </TouchableOpacity>
        )}
        {comment.media_type === "VIDEO" && comment.url && (
          <Video
            source={{ uri: comment.url }}
            style={styles.largeMedia}
            resizeMode="contain"
            paused={true}
            controls
          />
        )}
      </View>

      {/* Actions */}
      <View style={styles.commentActions}>
        {(comment.isArtistComment || likedComments.includes(comment.id)) && (
          <TouchableOpacity
            onPress={() =>
              likedComments.includes(comment.id)
                ? dislikeComment(comment.id)
                : likeComment(comment.id)
            }
            style={styles.heartIconOutside}
          >
            <EvilIcons
              name="heart"
              size={28}
              color={likedComments.includes(comment.id) ? "#FF0000" : "#FFFFFF"}
            />
          </TouchableOpacity>
        )}

        {comment.isArtistComment && (
          <>
            <TouchableOpacity
              onPress={() => setActiveCommentMenu(comment.id)}
              style={styles.reportButton}
            >
              <Entypo name="dots-three-horizontal" size={24} color="#FFF" />
            </TouchableOpacity>

            {activeCommentMenu === comment.id && (
              <Modal
                transparent={true}
                animationType="fade"
                visible={activeCommentMenu === comment.id}
                onRequestClose={() => setActiveCommentMenu(null)}
              >
                <TouchableWithoutFeedback onPress={() => setActiveCommentMenu(null)}>
                  <View style={styles.modalOverlay}>
                    <View style={styles.menuContainer}>
                      <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                          setActiveCommentMenu(null); // Close menu
                          openReportCommentModal(comment.id); // Open report modal
                        }}
                      >
                        <Ionicons name="warning-outline" size={24} color="red" />
                        <Text style={styles.menuText}>Flag Comment</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>
            )}
          </>
        )}
      </View>
    </View>
  ))}


</View>

        </KeyboardAwareScrollView>
  
        <View style={styles.commentInputContainer}>
          {selectedMedia && (
            <View style={styles.previewContainer}>
              {mediaType === "PHOTO" ? (
                <Image source={{ uri: selectedMedia }} style={styles.previewImage} />
              ) : (
                <Video
                  source={{ uri: selectedMedia }}
                  style={styles.previewVideo}
                  resizeMode="cover"
                  paused={true}
                />
              )}
              <TouchableOpacity
                onPress={() => setSelectedMedia(null)}
                style={styles.removeMediaButton}
              >
                <Icon name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
  
          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            placeholderTextColor="#aaa"
            value={commentText}
            onChangeText={(text) => setCommentText(text.slice(0, MAX_COMMENT_LENGTH))}
            multiline
          />
  
          <TouchableOpacity onPress={handleSelectMedia} style={styles.icon}>
            <Icon name="image" size={24} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: commentText.trim() || selectedMedia ? "#FF0080" : "#555" },
            ]}
            onPress={addComment}
            disabled={!commentText.trim() && !selectedMedia}
          >
            <EvilIcons name="sc-telegram" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
  
        <ImageViewing
          images={[{ uri: selectedImageUri }]}
          imageIndex={0}
          visible={isImageViewerVisible}
          onRequestClose={() => setIsImageViewerVisible(false)}
        />
  
        <Modal
          visible={reportModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={closeReportModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.reportModal}>
              <Text style={styles.modalTitle}>Report Post</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Why are you reporting this post?"
                placeholderTextColor="#aaa"
                multiline
                value={reportDescription}
                onChangeText={(text) => setReportDescription(text)}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={closeReportModal}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitButton} onPress={submitReport}>
                  <Text style={styles.buttonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <Modal
  visible={reportCommentModalVisible}
  transparent={true}
  animationType="slide"
  onRequestClose={closeReportCommentModal}
>
  <View style={styles.modalOverlay}>
    <View style={styles.reportModal}>
      <Text style={styles.modalTitle}>Report Comment</Text>
      <TextInput
        style={styles.descriptionInput}
        placeholder="Why are you reporting this comment?"
        placeholderTextColor="#aaa"
        multiline
        value={commentReportDescription}
        onChangeText={(text) => setCommentReportDescription(text)}
      />
      <View style={styles.modalButtons}>
        <TouchableOpacity style={styles.cancelButton} onPress={closeReportCommentModal}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={submitCommentReport}>
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
  

};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 16 },
  scrollViewContainer: { flexGrow: 1, paddingBottom: 100 },
  userInfoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  userAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
  userName: { fontSize: 18, color: '#ffffff' },
  postImage: { width: '100%', height: 300, borderRadius: 10, marginBottom: 10 },
  interactionContainer: { flexDirection: 'row', marginTop: 10, marginBottom: 20, justifyContent: 'center' },
  commentsContainer: { marginTop: 20 },
  artistCommentContainer: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#000', padding: 10, borderRadius: 8, maxWidth: '75%' },
  fanCommentContainer: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#333', padding: 10, borderRadius: 8, marginVertical: 5, alignSelf: 'flex-end', maxWidth: '75%' },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  commentTextContainer: { flexShrink: 1 },
  commentAuthor: { fontSize: 14, color: '#FFF', fontWeight: 'bold' },
  commentText: { fontSize: 16, color: '#FFF', marginRight: 10 },
  heartIconOutside: { marginTop: 0, alignSelf: 'center', },
  commentCard: { backgroundColor: '#1e1e1e', borderRadius: 10, padding: 15, marginVertical: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5, maxWidth: '75%', paddingBottom: 20 },
  largeMedia: { width: 200, height: 250, borderRadius: 10, marginTop: 5 }, // Increased media size
  commentInputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'rgba(0, 0, 0, 0.4)', width: '100%' },
  commentInput: { flex: 1, color: '#ffffff', paddingHorizontal: 15, paddingVertical: 10, borderWidth: 1, borderColor: '#555', borderRadius: 25, backgroundColor: 'rgba(51, 51, 51, 0.6)', fontSize: 16 },
  characterCounter: { color: '#aaa', marginLeft: 10, fontSize: 12 },
  sendButton: { marginLeft: 10, padding: 10, borderRadius: 25, backgroundColor: '#FF0080' },
  icon: { marginLeft: 10, padding: 10, borderRadius: 25,  },
  warning: { right: "-100%", alignItems: 'flex-end', marginRight: '30%' },
  menuIcon: {
    marginLeft: '50%',
  },



  menuContainer: {
    backgroundColor: 'black',
    borderRadius: 10,
    
    width: 140,
    alignItems: 'flex-start',
    marginBottom: '100%',
    marginLeft: '69%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    right:"50%",
    
  },
  reportButton: {
    marginLeft: 10,
    padding: 5,
  },
  
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  

  menuText: {
    marginLeft: 11,
    fontSize: 16,
    color: '#FFF',
    
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
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    bottom:"5%",
    backgroundColor: "rgba(0, 0, 0, .96)", // Dimmed background
    
  },
  reportModal: {
    backgroundColor: "#222", // Modal background
    borderRadius: 12,
    padding: 20,
    width: "90%",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 10,
  },
  descriptionInput: {
    backgroundColor: "#333",
    color: "#FFF",
    padding: 15,
    borderRadius: 10,
    height: 120,
    marginBottom: 20,
    textAlignVertical: "top", // Ensures text starts at the top of the box
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalTitle: {
    bottom:"5%",
    color:"#c0c0c0"
  },
  cancelButton: {
    backgroundColor: "#555",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  submitButton: {
    backgroundColor: "#FF0080",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "bold",
  },
  postMessageText: {
    color: '#FFF',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'left',
  },
  postMessageContainer: {
    marginTop: 5,
    marginBottom: 10, // Add spacing between the message and the image
    paddingHorizontal: 10, // Align text with the padding of other elements
  },
  
  


});

export default DMDetailPage;
