import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  TextInput,
  Modal,
} from 'react-native';
import { useSelector } from 'react-redux';
import { BASEURL } from '../../assets/constants';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const SuperAdminDashboard = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [pendingArtists, setPendingArtists] = useState([]);
  const [artistRequests, setArtistRequests] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('reports');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

  const fetchPendingArtists = async () => {
    if (!accessToken) {
      console.error('Access token is missing');
      setError('Access token is missing');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching pending artists from:', `${BASEURL}/api/v1/user/pending-artists`);
      const response = await fetch(`${BASEURL}/api/v1/user/pending-artists`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log('Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Fetch Pending Artists Error:', errorData);
        throw new Error(errorData.message || `Failed to fetch pending artists. Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched Pending Artists Data:', data);
      setPendingArtists(data.data || []);
    } catch (err) {
      console.error('Error while fetching pending artists:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchArtistRequests = async () => {
    if (!accessToken) {
      console.error('Access token is missing');
      setError('Access token is missing');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching artist requests from:', `${BASEURL}/api/v1/user/artist-requests`);
      const response = await fetch(`${BASEURL}/api/v1/user/artist-requests`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log('Response Status:', response.status);

      if (response.status === 404) {
        // Endpoint not implemented yet, show a placeholder message
        console.log('Artist requests endpoint not implemented yet');
        setArtistRequests([]);
        setError('Artist requests history feature is coming soon. Currently only pending artists are available.');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Fetch Artist Requests Error:', errorData);
        throw new Error(errorData.message || `Failed to fetch artist requests. Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched Artist Requests Data:', data);
      setArtistRequests(data.data || []);
    } catch (err) {
      console.error('Error while fetching artist requests:', err);
      if (err.message.includes('404') || err.message.includes('Not Found')) {
        setError('Artist requests history feature is coming soon. Currently only pending artists are available.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleArtistAction = async (action, userId, notes = '') => {
    if (!accessToken) {
      console.error('Access token is missing');
      Alert.alert('Error', 'Access token is missing');
      return;
    }

    setLoading(true);

    try {
      const endpoint = action === 'approve' ? 'approve-artist' : 'reject-artist';
      const url = `${BASEURL}/api/v1/user/${endpoint}`;
      
      console.log(`${action} artist request:`, { url, userId, notes });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId,
          adminNotes: notes
        }),
      });

      console.log(`${action} Response Status:`, response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`${action} Artist Error:`, errorData);
        throw new Error(errorData.message || `${action} failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`${action} Artist Success:`, data);
      
      Alert.alert('Success', `Artist ${action}d successfully.`);
      fetchPendingArtists(); // Refresh the list
      if (activeTab === 'history') {
        fetchArtistRequests(); // Refresh history too
      }
    } catch (err) {
      console.error(`Error during ${action} artist:`, err);
      Alert.alert('Error', err.message || `An error occurred while ${action}ing the artist.`);
    } finally {
      setLoading(false);
      setShowNotesModal(false);
      setAdminNotes('');
      setSelectedAction(null);
      setSelectedArtist(null);
    }
  };

  const openActionModal = (action, artist) => {
    setSelectedAction(action);
    setSelectedArtist(artist);
    setShowNotesModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#ff9800';
      case 'approved':
        return '#4caf50';
      case 'rejected':
        return '#f44336';
      default:
        return '#888';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return 'clock-o';
      case 'approved':
        return 'check-circle';
      case 'rejected':
        return 'times-circle';
      default:
        return 'question-circle';
    }
  };

  const getFilteredArtistRequests = () => {
    let filtered = artistRequests;
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(request => 
        request.full_name?.toLowerCase().includes(query) ||
        request.email?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
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
    <View key={index} style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={styles.reportBadge}>
          <FontAwesome name="flag" size={12} color="#fff" />
          <Text style={styles.reportNumber}>#{index + 1}</Text>
        </View>
        <Text style={styles.reportDate}>
          {new Date(report.created_at).toLocaleDateString()}
        </Text>
      </View>
      
      <View style={styles.reportContent}>
        <Text style={styles.reportDescription}>{report.description}</Text>
        
        <View style={styles.reportDetails}>
          <View style={styles.detailRow}>
            <FontAwesome name="user" size={14} color="#888" />
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Reported by:</Text> {report.reportedBy?.full_name || 'Unknown'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <FontAwesome name="user-circle" size={14} color="#888" />
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Reported user:</Text> {report.reportedUser?.full_name || 'N/A'}
      </Text>
          </View>
          
          {report.reportedComment?.message && (
            <View style={styles.detailRow}>
              <FontAwesome name="comment" size={14} color="#888" />
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Comment:</Text> {report.reportedComment.message}
      </Text>
            </View>
          )}
          
          {report.reportedPost?.id && (
            <View style={styles.detailRow}>
              <FontAwesome name="file-text" size={14} color="#888" />
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Post ID:</Text> {report.reportedPost.id}
      </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actionButtons}>
      {report.reportedPost?.id && (
        <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
          onPress={() =>
            Alert.alert(
                'Delete Post',
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
            <FontAwesome name="trash" size={14} color="#fff" />
            <Text style={styles.actionButtonText}>Delete Post</Text>
        </TouchableOpacity>
      )}

      {report.reportedComment?.id && (
        <TouchableOpacity
            style={[styles.actionButton, styles.warningButton]}
          onPress={() =>
            Alert.alert(
                'Delete Comment',
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
            <FontAwesome name="comment-slash" size={14} color="#fff" />
            <Text style={styles.actionButtonText}>Delete Comment</Text>
        </TouchableOpacity>
      )}

      {report.reportedComment?.parent_comment_id && (
        <TouchableOpacity
            style={[styles.actionButton, styles.infoButton]}
          onPress={() =>
            Alert.alert(
                'Delete Reply',
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
            <FontAwesome name="reply" size={14} color="#fff" />
            <Text style={styles.actionButtonText}>Delete Reply</Text>
        </TouchableOpacity>
      )}
      </View>
    </View>
  );

  const renderPendingArtistItem = (artist, index) => (
    <View key={index} style={styles.artistCard}>
      <View style={styles.artistHeader}>
        <View style={styles.artistAvatar}>
          {artist.avatar_url ? (
            <FontAwesome name="user-circle" size={40} color="#00ff00" />
          ) : (
            <FontAwesome name="user-circle" size={40} color="#666" />
          )}
        </View>
        <View style={styles.artistInfo}>
          <Text style={styles.artistName}>{artist.full_name}</Text>
          <Text style={styles.artistEmail}>{artist.email}</Text>
          {artist.phone_number && (
            <Text style={styles.artistPhone}>{artist.phone_number}</Text>
          )}
          <Text style={styles.artistDate}>
            Registered: {new Date(artist.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.pendingBadge}>
          <FontAwesome name="clock-o" size={12} color="#fff" />
          <Text style={styles.pendingText}>Pending</Text>
        </View>
      </View>
      
      <View style={styles.artistActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => openActionModal('approve', artist)}
        >
          <FontAwesome name="check" size={14} color="#fff" />
          <Text style={styles.actionButtonText}>Approve</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => openActionModal('reject', artist)}
        >
          <FontAwesome name="times" size={14} color="#fff" />
          <Text style={styles.actionButtonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderArtistRequestItem = (request, index) => (
    <View key={index} style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestAvatar}>
          {request.avatar_url ? (
            <FontAwesome name="user-circle" size={40} color="#00ff00" />
          ) : (
            <FontAwesome name="user-circle" size={40} color="#666" />
          )}
        </View>
        <View style={styles.requestInfo}>
          <Text style={styles.requestName}>{request.full_name}</Text>
          <Text style={styles.requestEmail}>{request.email}</Text>
          {request.phone_number && (
            <Text style={styles.requestPhone}>{request.phone_number}</Text>
          )}
          <Text style={styles.requestDate}>
            Applied: {new Date(request.created_at).toLocaleDateString()}
          </Text>
          {request.updated_at && request.updated_at !== request.created_at && (
            <Text style={styles.requestDate}>
              Updated: {new Date(request.updated_at).toLocaleDateString()}
            </Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
          <FontAwesome name={getStatusIcon(request.status)} size={12} color="#fff" />
          <Text style={styles.statusText}>{request.status}</Text>
        </View>
      </View>
      
      {request.admin_notes && (
        <View style={styles.adminNotesContainer}>
          <Text style={styles.adminNotesLabel}>Admin Notes:</Text>
          <Text style={styles.adminNotesText}>{request.admin_notes}</Text>
        </View>
      )}
      
      {request.status === 'pending' && (
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => openActionModal('approve', request)}
          >
            <FontAwesome name="check" size={14} color="#fff" />
            <Text style={styles.actionButtonText}>Approve</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => openActionModal('reject', request)}
          >
            <FontAwesome name="times" size={14} color="#fff" />
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <FontAwesome name="shield" size={64} color="#666" />
      <Text style={styles.emptyStateTitle}>No Reports Found</Text>
      <Text style={styles.emptyStateText}>
        There are currently no reports to review. The community is clean!
      </Text>
    </View>
  );

  const renderEmptyArtists = () => (
    <View style={styles.emptyState}>
      <FontAwesome name="users" size={64} color="#666" />
      <Text style={styles.emptyStateTitle}>No Pending Artists</Text>
      <Text style={styles.emptyStateText}>
        There are currently no artists waiting for approval.
      </Text>
    </View>
  );

  const renderEmptyHistory = () => (
    <View style={styles.emptyState}>
      <FontAwesome name="history" size={64} color="#666" />
      <Text style={styles.emptyStateTitle}>Artist Requests History</Text>
      <Text style={styles.emptyStateText}>
        {error && error.includes('coming soon') 
          ? 'This feature is coming soon! Currently only pending artists are available in the Artists tab.'
          : 'No artist requests have been submitted yet.'
        }
      </Text>
      {error && error.includes('coming soon') && (
        <TouchableOpacity
          style={styles.comingSoonButton}
          onPress={() => setActiveTab('artists')}
        >
          <Text style={styles.comingSoonButtonText}>View Pending Artists</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHistoryFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.searchContainer}>
        <FontAwesome name="search" size={16} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <View style={styles.statusFilters}>
        <TouchableOpacity
          style={[styles.statusFilter, statusFilter === 'all' && styles.activeStatusFilter]}
          onPress={() => setStatusFilter('all')}
        >
          <Text style={[styles.statusFilterText, statusFilter === 'all' && styles.activeStatusFilterText]}>
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.statusFilter, statusFilter === 'pending' && styles.activeStatusFilter]}
          onPress={() => setStatusFilter('pending')}
        >
          <Text style={[styles.statusFilterText, statusFilter === 'pending' && styles.activeStatusFilterText]}>
            Pending
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.statusFilter, statusFilter === 'approved' && styles.activeStatusFilter]}
          onPress={() => setStatusFilter('approved')}
        >
          <Text style={[styles.statusFilterText, statusFilter === 'approved' && styles.activeStatusFilterText]}>
            Approved
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.statusFilter, statusFilter === 'rejected' && styles.activeStatusFilter]}
          onPress={() => setStatusFilter('rejected')}
        >
          <Text style={[styles.statusFilterText, statusFilter === 'rejected' && styles.activeStatusFilterText]}>
            Rejected
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome name="arrow-left" size={20} color="#fff" />
      </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Content Moderation</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => {
              if (activeTab === 'reports') {
                fetchReport();
              } else if (activeTab === 'artists') {
                fetchPendingArtists();
              } else if (activeTab === 'history') {
                fetchArtistRequests();
              }
            }}
            disabled={loading}
          >
            <FontAwesome 
              name="refresh" 
              size={18} 
              color={loading ? "#666" : "#fff"} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reports' && styles.activeTab]}
          onPress={() => setActiveTab('reports')}
        >
          <FontAwesome name="flag" size={16} color={activeTab === 'reports' ? "#fff" : "#888"} />
          <Text style={[styles.tabText, activeTab === 'reports' && styles.activeTabText]}>
            Reports
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'artists' && styles.activeTab]}
          onPress={() => {
            setActiveTab('artists');
            if (pendingArtists.length === 0) {
              fetchPendingArtists();
            }
          }}
        >
          <FontAwesome name="users" size={16} color={activeTab === 'artists' ? "#fff" : "#888"} />
          <Text style={[styles.tabText, activeTab === 'artists' && styles.activeTabText]}>
            Artists
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => {
            setActiveTab('history');
            if (artistRequests.length === 0) {
              fetchArtistRequests();
            }
          }}
        >
          <FontAwesome name="history" size={16} color={activeTab === 'history' ? "#fff" : "#888"} />
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
          onPress={() => setActiveTab('analytics')}
        >
          <FontAwesome name="bar-chart" size={16} color={activeTab === 'analytics' ? "#fff" : "#888"} />
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
            Analytics
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
        >
          <FontAwesome name="cog" size={16} color={activeTab === 'settings' ? "#fff" : "#888"} />
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <View style={styles.content}>
        {activeTab === 'reports' && (
          <>
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00ff00" />
                <Text style={styles.loadingText}>Loading reports...</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <FontAwesome name="exclamation-triangle" size={24} color="#ff6b6b" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchReport}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {!loading && !error && (
              <ScrollView style={styles.reportsContainer} showsVerticalScrollIndicator={false}>
                {reportData.length === 0 ? (
                  renderEmptyState()
                ) : (
                  reportData.map(renderReportItem)
                )}
      </ScrollView>
            )}
          </>
        )}

        {activeTab === 'artists' && (
          <>
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00ff00" />
                <Text style={styles.loadingText}>Loading pending artists...</Text>
    </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <FontAwesome name="exclamation-triangle" size={24} color="#ff6b6b" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchPendingArtists}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {!loading && !error && (
              <ScrollView style={styles.reportsContainer} showsVerticalScrollIndicator={false}>
                {pendingArtists.length === 0 ? (
                  renderEmptyArtists()
                ) : (
                  pendingArtists.map(renderPendingArtistItem)
                )}
              </ScrollView>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <>
            {renderHistoryFilters()}
            
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00ff00" />
                <Text style={styles.loadingText}>Loading artist requests...</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <FontAwesome name="exclamation-triangle" size={24} color="#ff6b6b" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchArtistRequests}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

            {!loading && !error && (
              <ScrollView style={styles.reportsContainer} showsVerticalScrollIndicator={false}>
                {getFilteredArtistRequests().length === 0 ? (
                  renderEmptyHistory()
                ) : (
                  getFilteredArtistRequests().map(renderArtistRequestItem)
                )}
              </ScrollView>
            )}
          </>
        )}

        {activeTab === 'analytics' && (
          <View style={styles.placeholderContainer}>
            <FontAwesome name="bar-chart" size={48} color="#666" />
            <Text style={styles.placeholderTitle}>Analytics Coming Soon</Text>
            <Text style={styles.placeholderText}>
              Detailed analytics and insights will be available here.
            </Text>
          </View>
        )}

        {activeTab === 'settings' && (
          <View style={styles.placeholderContainer}>
            <FontAwesome name="cog" size={48} color="#666" />
            <Text style={styles.placeholderTitle}>Settings Coming Soon</Text>
            <Text style={styles.placeholderText}>
              Admin settings and configuration options will be available here.
            </Text>
          </View>
        )}
      </View>

      {/* Admin Notes Modal */}
      <Modal
        visible={showNotesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNotesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedAction === 'approve' ? 'Approve Artist' : 'Reject Artist'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {selectedArtist?.full_name} ({selectedArtist?.email})
            </Text>
            
            <Text style={styles.modalLabel}>Admin Notes (Optional):</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add notes about this decision..."
              placeholderTextColor="#888"
              value={adminNotes}
              onChangeText={setAdminNotes}
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowNotesModal(false);
                  setAdminNotes('');
                  setSelectedAction(null);
                  setSelectedArtist(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  selectedAction === 'approve' ? styles.approveButton : styles.rejectButton
                ]}
                onPress={() => handleArtistAction(selectedAction, selectedArtist.id, adminNotes)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.actionButtonText}>
                    {selectedAction === 'approve' ? 'Approve' : 'Reject'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  headerContent: {
    flex: 1,
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 8,
    marginHorizontal: 1,
  },
  activeTab: {
    backgroundColor: '#00ff00',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
    marginLeft: 4,
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#00ff00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  reportsContainer: {
    flex: 1,
  },
  reportCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reportNumber: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  reportDate: {
    color: '#888',
    fontSize: 12,
  },
  reportContent: {
    marginBottom: 16,
  },
  reportDescription: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  reportDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    color: '#ccc',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  detailLabel: {
    color: '#888',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 120,
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
  },
  warningButton: {
    backgroundColor: '#ffa726',
  },
  infoButton: {
    backgroundColor: '#42a5f5',
  },
  approveButton: {
    backgroundColor: '#4caf50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  artistCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  artistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  artistAvatar: {
    marginRight: 12,
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  artistEmail: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 2,
  },
  artistPhone: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  artistDate: {
    color: '#666',
    fontSize: 11,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  artistActions: {
    flexDirection: 'row',
    gap: 12,
  },
  // History Styles
  filtersContainer: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    paddingVertical: 12,
    marginLeft: 8,
  },
  statusFilters: {
    flexDirection: 'row',
    gap: 8,
  },
  statusFilter: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  activeStatusFilter: {
    backgroundColor: '#00ff00',
  },
  statusFilterText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  activeStatusFilterText: {
    color: '#000',
  },
  requestCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestAvatar: {
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  requestEmail: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 2,
  },
  requestPhone: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  requestDate: {
    color: '#666',
    fontSize: 11,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  adminNotesContainer: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  adminNotesLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  adminNotesText: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 18,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  placeholderTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 16,
  },
  modalLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  comingSoonButton: {
    backgroundColor: '#00ff00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  comingSoonButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
});

export default SuperAdminDashboard;
