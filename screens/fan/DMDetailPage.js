import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, Image, TouchableOpacity, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import axios from 'axios';
import { BASEURL } from '../../assets/constants';
import { useSelector } from 'react-redux';

const MAX_COMMENT_LENGTH = 200;

const DMDetailPage = ({ route }) => {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(false);
  const [likedComments, setLikedComments] = useState([]);
  const accessToken = useSelector((state) => state.accessToken);
  const userEmail = useSelector((state) => state.userProfile.data.email);

  const fetchPostDetails = async () => {
    console.log(`Fetching post details for postId: ${postId}`);
    try {
      const response = await axios.get(`${BASEURL}/api/v1/post/${postId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
  
      const postData = response.data?.data?.post || {};
      const reactions = response.data?.data?.reactions || [];
      const artistComments = response.data?.data?.artistComments || [];
      const comments = response.data?.data?.comments || [];
  
      console.log("Fetched initial post data:", postData);
      console.log("Artist comments:", artistComments);
      console.log("Fan comments:", comments);
  
      const isPostLiked = reactions.some(reaction => reaction.user?.email === userEmail);
      setLiked(isPostLiked);
  
      const likedArtistComments = artistComments
        .filter((comment) => comment.commentReactionCount > 0)
        .map((comment) => comment.id);
  
      const likedFanComments = comments
        .filter((comment) => comment.commentReactionCount > 0)
        .map((comment) => comment.id);
  
      setLikedComments([...likedArtistComments, ...likedFanComments]);

      // Accessing and flattening replies embedded in artist comments
      const artistReplies = artistComments.reduce((allReplies, comment) => {
        if (comment.replies && comment.replies.length > 0) {
          console.log(`Replies for artist comment ID ${comment.id}:`, comment.replies);
          return [...allReplies, ...comment.replies];
        }
        return allReplies;
      }, []);

      setPost({ ...postData, artistComments, comments, artistReplies });

      console.log("Post details with comments and artist replies set in state:", {
        ...postData,
        artistComments,
        comments,
        artistReplies
      });
    } catch (error) {
      console.error('Error fetching post details:', error.response || error.message);
      Alert.alert('Error', 'Could not load post details.');
    }
  };

  useEffect(() => {
    console.log("Post ID has changed or component mounted, fetching post details...");
    fetchPostDetails();
  }, [postId]);



  const toggleLike = async () => {
    try {
      if (!liked) {
        console.log("Attempting to like the post:", postId);
        const response = await axios.post(`${BASEURL}/api/v1/post/${postId}/likes`, {}, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.status === 200 || response.status === 201) {
          setLiked(true);
          console.log("Post liked successfully.");
        } else {
          Alert.alert("Error", "Failed to like the post.");
        }
      } else {
        console.log("Attempting to unlike the post:", postId);
        const response = await axios.delete(`${BASEURL}/api/v1/post/${postId}/likes`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.status === 200 || response.status === 204) {
          setLiked(false);
          console.log("Post unliked successfully.");
        } else {
          Alert.alert("Error", "Failed to unlike the post.");
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      Alert.alert("Error", "An unexpected error occurred.");
    }
  };
  const userProfile = useSelector((state) => state.userProfile.data);

  const addComment = async () => {
    if (!commentText.trim()) {
      Alert.alert("Error", "Comment cannot be empty.");
      return;
    }
    try {
      const endpoint = `${BASEURL}/api/v1/post/${postId}/comment`;
      const latestArtistCommentId = post?.artistComments?.[post.artistComments.length - 1]?.id;
      const body = {
        message: commentText,
        ...(latestArtistCommentId && { parentCommentId: latestArtistCommentId })
      };

      console.log("Adding comment to post:", postId);
      console.log("Comment text:", commentText);
      console.log("Parent comment ID:", latestArtistCommentId);

      const response = await axios.post(
        endpoint,
        body,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (response.status === 200 || response.status === 201) {
        const newComment = {
          ...response.data.data,
          user: {
            full_name: userProfile.full_name,
            avatar_url: userProfile.avatar_url,
          },
        };
        setPost((prevPost) => ({
          ...prevPost,
          comments: [newComment, ...prevPost.comments],
        }));
        setCommentText('');
        console.log("Comment added successfully:", newComment);
      } else {
        Alert.alert("Error", "Unexpected response from the server.");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Error", "Failed to add comment.");
    }
  };
  const likeComment = async (commentId) => {
    if (!commentId) {
      console.warn("No commentId provided to likeComment function.");
      return;
    }

    try {
      const response = await axios.post(
        `${BASEURL}/api/v1/comment/like/${commentId}`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.status === 200 || response.status === 201) {
        setLikedComments((prevLikedComments) => [...prevLikedComments, commentId]);
        console.log("Comment liked successfully:", commentId);
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
      console.log("Comment disliked successfully:", commentId);
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAwareScrollView contentContainerStyle={styles.scrollViewContainer} extraScrollHeight={80}>
          {post.user && post.user.avatar_url && (
            <View style={styles.userInfoContainer}>
              <Image source={{ uri: post.user.avatar_url }} style={styles.userAvatar} />
              <Text style={styles.userName}>{post.user.full_name}</Text>
            </View>
          )}

          {post.image_url && (
            <Image source={{ uri: post.image_url }} style={styles.postImage} />
          )}

          <View style={styles.interactionContainer}>
            <TouchableOpacity onPress={toggleLike}>
              <EvilIcons name="heart" size={30} color={liked ? '#FF0000' : '#FFFFFF'} />
            </TouchableOpacity>
          </View>

          <View style={styles.commentsContainer}>
            {post.artistComments
              .map(comment => ({ ...comment, isArtistComment: true })) // Mark artist comments
              .concat(post.comments, post.artistReplies) // Combine all comments and replies
              .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) // Sort by date
              .map((comment, index) => (
                <View
                  key={index}
                  style={[
                    styles.commentCard, // Card style for each comment
                    comment.isArtistComment ? styles.artistCommentContainer : styles.fanCommentContainer,
                    { alignSelf: comment.isArtistComment ? 'flex-start' : 'flex-end' }, // Align based on artist or fan
                  ]}
                >
                  {comment.user && comment.user.avatar_url && (
                    <Image source={{ uri: comment.user.avatar_url }} style={styles.avatar} />
                  )}
                  <View style={styles.commentTextContainer}>
                    <Text style={styles.commentAuthor}>{comment.user?.full_name}</Text>
                    <Text style={styles.commentText}>{comment.message}</Text>

                    {/* Display image if it exists for artist comments */}
                    {comment.isArtistComment && comment.url && (
                      <Image source={{ uri: comment.url }} style={styles.commentImage} />
                    )}
                  </View>

                  {/* Like button for artist comments only */}
                  {comment.isArtistComment ? (
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
                        color={likedComments.includes(comment.id) ? '#FF0000' : '#FFFFFF'}
                      />
                    </TouchableOpacity>
                  ) : (
                    likedComments.includes(comment.id) && (
                      <EvilIcons name="heart" size={20} color="#FF0000" />
                    )
                  )}
                </View>
              ))}
          </View>



        </KeyboardAwareScrollView>

        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            placeholderTextColor="#aaa"
            value={commentText}
            onChangeText={(text) => setCommentText(text.slice(0, MAX_COMMENT_LENGTH))}
            multiline
          />
          <Text style={styles.characterCounter}>
            {commentText.length}/{MAX_COMMENT_LENGTH}
          </Text>
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: commentText.trim() ? '#FF0080' : '#555' }]}
            onPress={addComment}
            disabled={!commentText.trim()}
          >
            <EvilIcons name="sc-telegram" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 16 },
  scrollViewContainer: { flexGrow: 1, paddingBottom: 100 },
  loadingText: { fontSize: 20, color: '#ffffff' },
  userInfoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  userAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
  userName: { fontSize: 18, color: '#ffffff' },
  postImage: { width: '100%', height: 300, borderRadius: 10, marginBottom: 10 },
  interactionContainer: { flexDirection: 'row', marginTop: 10, marginBottom: 20, justifyContent: 'center' },
  commentsContainer: { marginTop: 20 },
  commentWrapper: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  artistCommentContainer: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#000', padding: 10, borderRadius: 8, maxWidth: '75%' },
  fanCommentContainer: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#333', padding: 10, borderRadius: 8, marginVertical: 5, alignSelf: 'flex-end', maxWidth: '75%' },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  commentTextContainer: { flexShrink: 1 },
  commentAuthor: { fontSize: 14, color: '#FFF', fontWeight: 'bold', },
  commentText: { fontSize: 16, color: '#FFF', marginRight: 85 },
  heartIconOutside: { marginLeft: -40 },
  commentCard: {
    backgroundColor: '#1e1e1e', // Dark background for contrast
    borderRadius: 10,
    padding: 15,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    maxWidth: '75%',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Ensures like button stays to the right
    marginBottom: 5,
  },
  commentImage: {
    width: 150, // Adjust width as needed
    height: 150, // Adjust height as needed
    borderRadius: 8,
    marginTop: 5,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    width: '100%',
  },
  commentInput: {
    flex: 1,
    color: '#ffffff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 25,
    backgroundColor: 'rgba(51, 51, 51, 0.6)',
    fontSize: 16,
  },
  characterCounter: { color: '#aaa', marginLeft: 10, fontSize: 12 },
  sendButton: { marginLeft: 10, padding: 10, borderRadius: 25, backgroundColor: '#FF0080' },
});

export default DMDetailPage;
