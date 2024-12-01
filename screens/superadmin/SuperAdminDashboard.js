import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { BASEURL } from '../../assets/constants';

const SuperAdminDashboard = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [error, setError] = useState(null);

  const accessToken = useSelector((state) => state.accessToken);

  const fetchReport = async () => {
    if (!accessToken) {
      console.error('Access token is missing');
      setError('Access token is missing');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching reports from:', `${BASEURL}/api/v1/report`);
      const response = await fetch(`${BASEURL}/api/v1/report`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log('Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Fetch Report Error:', errorData);
        throw new Error(errorData.message || `Failed to fetch report. Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched Report Data:', data);
      setReportData(data.data);
    } catch (err) {
      console.error('Error while fetching report:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionType, postId, commentId = null, replyId = null) => {
    let url;
    let method = 'DELETE';
  
    // Construct the URL based on the action type
    switch (actionType) {
      case 'DELETE_POST':
        if (!postId) {
          console.error('Invalid postId for DELETE_POST');
          Alert.alert('Error', 'Post ID is required to delete a post.');
          return;
        }
        url = `${BASEURL}/api/v1/post/${postId}`;
        break;
  
      case 'DELETE_COMMENT':
        if (!postId || !commentId) {
          console.error('Invalid postId or commentId for DELETE_COMMENT');
          Alert.alert('Error', 'Post ID and Comment ID are required to delete a comment.');
          return;
        }
        url = `${BASEURL}/api/v1/post/${postId}/comment/${commentId}`;
        break;
  
      case 'DELETE_REPLY':
        if (!postId || !commentId || !replyId) {
          console.error('Invalid postId, commentId, or replyId for DELETE_REPLY');
          Alert.alert('Error', 'Post ID, Comment ID, and Reply ID are required to delete a reply.');
          return;
        }
        url = `${BASEURL}/api/v1/post/${postId}/comment/${commentId}/reply/${replyId}`;
        break;
  
      default:
        console.error('Invalid action type');
        Alert.alert('Error', 'Invalid action type specified.');
        return;
    }
  
    try {
      console.log(`Executing ${actionType} with parameters:`);
      console.log('URL:', url);
      console.log('Headers:', {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      });
  
      // Make the API request
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
  
      // Log response status
      console.log(`${actionType} Response Status:`, response.status);
  
      if (!response.ok) {
        const errorData = await response.json();
  
        // Log detailed error response for debugging
        console.error(`${actionType} Error Response:`, errorData);
  
        throw new Error(errorData.message || `Action failed with status: ${response.status}`);
      }
  
      // Success message
      Alert.alert('Success', `${actionType.replace('_', ' ')} completed successfully.`);
      console.log(`${actionType} completed successfully.`);
      fetchReport(); // Refresh reports after the action
    } catch (err) {
      // Log the error
      console.error(`Error during ${actionType}:`, err);
  
      // Show an alert with the error message
      Alert.alert('Error', err.message || 'An error occurred while performing the action.');
    }
  };
  
  
  

  const renderReportItem = (report, index) => (
    <View key={index} style={styles.reportItem}>
      <Text style={styles.reportTitle}>Report #{index + 1}</Text>
      <Text style={styles.reportText}>
        <Text style={styles.label}>Description:</Text> {report.description}
      </Text>
      <Text style={styles.reportText}>
        <Text style={styles.label}>Reported By:</Text> {report.reportedBy?.full_name || 'Unknown'}
      </Text>
      <Text style={styles.reportText}>
        <Text style={styles.label}>Reported User:</Text> {report.reportedUser?.full_name || 'N/A'}
      </Text>
      <Text style={styles.reportText}>
        <Text style={styles.label}>Reported Comment:</Text> {report.reportedComment?.message || 'N/A'}
      </Text>
      <Text style={styles.reportText}>
        <Text style={styles.label}>Reported Post:</Text> {report.reportedPost?.id || 'N/A'}
      </Text>
      <Text style={styles.reportText}>
        <Text style={styles.label}>Created At:</Text> {new Date(report.created_at).toLocaleString()}
      </Text>

      {/* Delete Post */}
      {report.reportedPost?.id && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            Alert.alert(
              'Confirm Action',
              'Are you sure you want to delete this post?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => handleAction('DELETE_POST', report.reportedPost.id),
                },
              ]
            )
          }
        >
          <Text style={styles.actionText}>Delete Post</Text>
        </TouchableOpacity>
      )}

      {/* Delete Comment */}
      {report.reportedComment?.id && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            Alert.alert(
              'Confirm Action',
              'Are you sure you want to delete this comment?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () =>
                    handleAction(
                      'DELETE_COMMENT',
                      report.reportedComment.artist_post_user_id,
                      report.reportedComment.id
                    ),
                },
              ]
            )
          }
        >
          <Text style={styles.actionText}>Delete Comment</Text>
        </TouchableOpacity>
      )}

      {/* Delete Reply */}
      {report.reportedComment?.parent_comment_id && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            Alert.alert(
              'Confirm Action',
              'Are you sure you want to delete this reply?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () =>
                    handleAction(
                      'DELETE_REPLY',
                      report.reportedComment.artist_post_user_id,
                      report.reportedComment.id
                    ),
                },
              ]
            )
          }
        >
          <Text style={styles.actionText}>Delete Reply</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Super Admin Dashboard</Text>

      <TouchableOpacity style={styles.button} onPress={fetchReport} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Loading...' : 'Fetch Reports'}</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#00ff00" />}

      {error && <Text style={styles.errorText}>{error}</Text>}

      <ScrollView style={styles.reportContainer}>
        {reportData.map(renderReportItem)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#ff5722',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff0000',
    fontSize: 14,
    marginVertical: 10,
    textAlign: 'center',
  },
  reportContainer: {
    flex: 1,
    width: '100%',
  },
  reportItem: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  reportText: {
    fontSize: 14,
    color: '#ddd',
    marginBottom: 5,
  },
  label: {
    fontWeight: 'bold',
    color: '#fff',
  },
  actionButton: {
    marginTop: 10,
    backgroundColor: '#4caf50',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default SuperAdminDashboard;
