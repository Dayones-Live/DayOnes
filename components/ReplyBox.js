import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Video from 'react-native-video';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import styles from '../screens/artist/artistStyles/PostDetailsPageStyles';

const ReplyBox = ({
  replies,
  likedReplies,
  onLikeReply,
  onOpenConversation,
  onOpenReportMenu,
  onOpenFullScreenImage,
}) => {
  // Calculate max height to show approximately 5-7 replies
  // Each reply is roughly 100-120px tall, so 5-7 replies = ~600-800px
  // But we want it contained, so let's use ~400-500px max height
  const maxHeight = verticalScale(450);
  const sortedReplies = replies.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <View style={styles.replyBoxContainer}>
      <View style={styles.repliesHeader}>
        <Text style={styles.repliesHeaderText}>Replies ({replies.length})</Text>
        <Text style={[styles.repliesHeaderText, { fontSize: moderateScale(11) }]}>
          Scroll to view all
        </Text>
      </View>
      <ScrollView
        style={[styles.replyBoxScrollContainer, { maxHeight }]}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={true}
        scrollEventThrottle={16}
        bounces={false}
      >
        {sortedReplies.map((reply) => (
          <View key={reply.id.toString()} style={styles.replyCard}>
            <View style={styles.userInfoContainer}>
              <Image source={{ uri: reply.user.avatar_url }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{reply.user.full_name}</Text>
                <Text style={styles.replyText}>{reply.message}</Text>
              </View>
            </View>
            {reply.url && reply.media_type === "PHOTO" && (
              <TouchableOpacity onPress={() => onOpenFullScreenImage(reply.url)}>
                <Image source={{ uri: reply.url }} style={styles.commentAImage} />
              </TouchableOpacity>
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
            <View style={[styles.interactionRow, { paddingTop: verticalScale(8), paddingBottom: verticalScale(8) }]}>
              <TouchableOpacity 
                onPress={() => onLikeReply(reply.id)}
                style={{ flexDirection: 'row', alignItems: 'center', marginRight: scale(16) }}
              >
                <Icon
                  name={likedReplies.includes(reply.id) ? "heart" : "heart-o"}
                  size={18}
                  color={likedReplies.includes(reply.id) ? "#ED4956" : "#FFFFFF"}
                />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => onOpenConversation(reply.user.id, reply.user.avatar_url, reply.user.full_name)}
                style={{ flexDirection: 'row', alignItems: 'center', marginRight: scale(16) }}
              >
                <Icon name="paper-plane-o" size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onOpenReportMenu(reply.id)}>
                <Icon name="ellipsis-h" size={18} color="#FFFFFF" style={styles.dotsButton} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default ReplyBox;

