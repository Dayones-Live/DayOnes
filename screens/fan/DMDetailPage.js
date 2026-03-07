import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, Image, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, Linking, Keyboard } from 'react-native';
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
import { launchImageLibrary } from 'react-native-image-picker';
import { TouchableWithoutFeedback } from 'react-native';
import styles from './fanStyles/DMDetailPageStyles';
import { useNavigation } from '@react-navigation/native';
import { convertToTemporaryFile } from '../../assets/components/convertToTemporaryFileHelper';
import { getMerchDropByPost } from '../../services/merch.service';


const MAX_COMMENT_LENGTH = 200;

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
  const navigation = useNavigation();
  const [merchDrop, setMerchDrop] = useState(null);

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

  const handleBlockUser = (userId) => {
    Alert.alert(
      "Block User",
      "Are you sure you want to block this user? Blocking will prevent you from viewing their past posts, including this one, and interacting with any future content they create. ",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await axios.post(
                `${BASEURL}/api/v1/blocks`,
                { blockedUser: userId },
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

  useEffect(() => {
    const checkMerchDrop = async () => {
      try {
        const drop = await getMerchDropByPost(postId);
        if (drop && drop.status === 'ACTIVE') {
          setMerchDrop(drop);
        }
      } catch (error) {
      }
    };
    checkMerchDrop();
  }, [postId]);

  const handleMediaUpload = async (uri) => {
    try {
      // Ensure compliance with scoped storage
      const filePath = uri.startsWith('content://')
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
    launchImageLibrary({ mediaType: 'mixed' }, async (response) => {
      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        const uri = asset.uri;

        // Ensure media is ready for use
        const mediaType = asset.type.startsWith('image/') ? 'PHOTO' : 'VIDEO';
        const filePath = uri.startsWith('content://')
          ? await convertToTemporaryFile(uri, mediaType === 'PHOTO' ? 'jpg' : 'mp4')
          : uri;

        setSelectedMedia(filePath);
        setMediaType(mediaType);
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
            <View style={styles.headerContainer}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <Image source={{ uri: post.user.avatar_url }} style={styles.userAvatar} />
              <Text style={styles.userName}>{post.user.full_name}</Text>
              <TouchableOpacity onPress={toggleMenu}>
                <Entypo name="dots-three-horizontal" size={30} color="white" style={styles.menuIcon} />
              </TouchableOpacity>
            </View>

          )}

          {post.message && (
            <View style={styles.postMessageContainer}>
              <Text style={styles.postMessageText}>{detectAndStyleLinks(post.message)}</Text>
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
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        toggleMenu();
                        handleBlockUser(post.user?.id); // Block the post creator
                      }}
                    >
                      <Ionicons name="ban" size={24} color="red" />
                      <Text style={styles.menuText}>Block User</Text>
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

          {merchDrop && (
            <TouchableOpacity
              style={{
                backgroundColor: '#FF0080',
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 8,
                marginHorizontal: 16,
                marginVertical: 12,
                alignItems: 'center',
              }}
              onPress={() => navigation.navigate('MerchStorePage', { dropId: merchDrop.id })}
            >
              <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>Shop Merch</Text>
            </TouchableOpacity>
          )}

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
                    <Text style={[
                      styles.commentText,
                      comment.isArtistComment ? styles.artistCommentText : styles.fanCommentText
                    ]}>
                      {detectAndStyleLinks(comment.message)}
                    </Text>

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
                                  <TouchableOpacity
                                    style={styles.menuItem}
                                    onPress={() => {
                                      setActiveCommentMenu(null); // Close menu
                                      handleBlockUser(comment.user?.id); // Block the comment author
                                    }}
                                  >
                                    <Ionicons name="ban" size={24} color="red" />
                                    <Text style={styles.menuText}>Block User</Text>
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
            returnKeyType="done"
            blurOnSubmit={true}
            onSubmitEditing={(e) => {
              e.preventDefault();
              Keyboard.dismiss();
            }}
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



export default DMDetailPage;
