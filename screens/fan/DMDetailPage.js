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

    console.log("Post details fetched successfully:", postData);
    console.log("Artist comments fetched:", artistComments);
    console.log("Fan comments fetched:", comments);

    const isPostLiked = reactions.some(reaction => reaction.user?.email === userEmail);
    setLiked(isPostLiked);

    const likedArtistComments = artistComments
      .filter((comment) => comment.commentReactionCount > 0)
      .map((comment) => comment.id);

    const likedFanComments = comments
      .filter((comment) => comment.commentReactionCount > 0)
      .map((comment) => comment.id);

    setLikedComments([...likedArtistComments, ...likedFanComments]);
    setPost({ ...postData, artistComments, comments });

    // Fetch replies for artist comments
    await fetchCommentReplies(artistComments);
  } catch (error) {
    console.error('Error fetching post details:', error.response || error.message);
    Alert.alert('Error', 'Could not load post details.');
  }
};

const fetchCommentReplies = async (artistComments) => {
  try {
    console.log("Fetching replies for artist comments:", artistComments.map(comment => comment.id));
    const allReplies = await Promise.all(
      artistComments.map(async (comment) => {
        const response = await axios.get(`${BASEURL}/api/v1/comment/${comment.id}/replies`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const replies = response.data.data.replies || [];
        console.log(`Fetched ${replies.length} replies for comment ID ${comment.id}`);
        return replies;
      })
    );

    const repliesFlattened = allReplies.flat();
    console.log("All fetched replies:", repliesFlattened);

    // Merge replies into main comments
    setPost((prevPost) => {
      const updatedComments = [...prevPost.comments, ...repliesFlattened];
      console.log("Merged comments and replies. Total comments now:", updatedComments.length);
      return { ...prevPost, comments: updatedComments };
    });
  } catch (error) {
    console.error("Error fetching comment replies:", error);
    Alert.alert("Error", "Could not load comment replies.");
  }
};

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

    const response = await axios.post(endpoint, body, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.status === 200 || response.status === 201) {
      const newComment = {
        ...response.data.data,
        user: {
          full_name: userProfile.full_name,
          avatar_url: userProfile.avatar_url,
        },
      };
      
      setPost((prevPost) => {
        const updatedComments = [newComment, ...prevPost.comments];
        console.log("Comment added successfully:", newComment);
        console.log("Total comments after addition:", updatedComments.length);
        return { ...prevPost, comments: updatedComments };
      });
      setCommentText('');
    } else {
      Alert.alert("Error", "Unexpected response from the server.");
    }
  } catch (error) {
    console.error("Error adding comment:", error);
    Alert.alert("Error", "Failed to add comment.");
  }
};

return (
  // Existing JSX...
  <View style={styles.commentsContainer}>
    {post.artistComments.length > 0 && (
      <Text style={styles.sectionTitle}>Artist Comments ({post.artistComments.length})</Text>
    )}
    {post.artistComments.map((comment, index) => (
      <View key={index} style={styles.commentWrapper}>
        {/* Existing rendering logic for artist comments */}
      </View>
    ))}

    {post.comments?.length > 0 && (
      <Text style={styles.sectionTitle}>Fan Comments ({post.comments.length})</Text>
    )}
    {post.comments?.map((comment, index) => (
      <View key={index} style={styles.fanCommentContainer}>
        {/* Existing rendering logic for fan comments */}
      </View>
    ))}
  </View>
  // Remaining JSX...
);
