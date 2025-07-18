import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Alert } from 'react-native';
import { profileService, profileHelpers } from '../services/profileService';

export const useProfile = (userId = null) => {
  const [profile, setProfile] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  
  const accessToken = useSelector(state => state.accessToken);
  const currentUser = useSelector(state => state.userProfile?.data);
  
  // Determine if we're viewing our own profile
  useEffect(() => {
    if (userId && currentUser) {
      setIsOwnProfile(userId === currentUser.id);
    } else if (!userId && currentUser) {
      setIsOwnProfile(true);
    }
  }, [userId, currentUser]);

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    if (!userId && !isOwnProfile) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let profileData;
      
      if (isOwnProfile && accessToken) {
        // Fetch own profile (authenticated)
        profileData = await profileService.getOwnProfile(accessToken);
      } else {
        // Fetch public profile
        profileData = await profileService.getPublicProfile(userId);
      }
      
      setProfile(profileData.data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.message || 'Failed to fetch profile');
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, [userId, isOwnProfile, accessToken]);

  // Fetch gallery data
  const fetchGallery = useCallback(async (page = 1, pageSize = 20) => {
    if (!userId && !isOwnProfile) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let galleryData;
      
      if (isOwnProfile && accessToken) {
        // Fetch own gallery (authenticated)
        galleryData = await profileService.getOwnGallery(accessToken, page, pageSize);
      } else {
        // Fetch public gallery
        galleryData = await profileService.getPublicGallery(userId, page, pageSize);
      }
      
      if (page === 1) {
        setGallery(galleryData.data.images);
      } else {
        setGallery(prev => [...prev, ...galleryData.data.images]);
      }
      
      return galleryData.data;
    } catch (err) {
      console.error('Error fetching gallery:', err);
      setError(err.response?.data?.message || 'Failed to fetch gallery');
      Alert.alert('Error', 'Failed to load gallery data');
    } finally {
      setLoading(false);
    }
  }, [userId, isOwnProfile, accessToken]);

  // Update profile
  const updateProfile = useCallback(async (profileData) => {
    if (!isOwnProfile || !accessToken) {
      Alert.alert('Error', 'You can only update your own profile');
      return;
    }
    
    // Validate profile data
    const validation = profileHelpers.validateProfileUpdate(profileData);
    if (!validation.isValid) {
      Alert.alert('Validation Error', validation.errors.join('\n'));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await profileService.updateProfile(profileData, accessToken);
      setProfile(response.data);
      Alert.alert('Success', 'Profile updated successfully');
      return response.data;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }, [isOwnProfile, accessToken]);

  // Add gallery image
  const addGalleryImage = useCallback(async (imageData) => {
    if (!isOwnProfile || !accessToken) {
      Alert.alert('Error', 'You can only add images to your own gallery');
      return;
    }
    
    // Validate image data
    const validation = profileHelpers.validateGalleryImage(imageData);
    if (!validation.isValid) {
      Alert.alert('Validation Error', validation.errors.join('\n'));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await profileService.addGalleryImage(imageData, accessToken);
      setGallery(prev => [response.data, ...prev]);
      Alert.alert('Success', 'Image added to gallery successfully');
      return response.data;
    } catch (err) {
      console.error('Error adding gallery image:', err);
      setError(err.response?.data?.message || 'Failed to add image');
      Alert.alert('Error', 'Failed to add image to gallery');
    } finally {
      setLoading(false);
    }
  }, [isOwnProfile, accessToken]);

  // Update gallery image
  const updateGalleryImage = useCallback(async (imageId, updateData) => {
    if (!isOwnProfile || !accessToken) {
      Alert.alert('Error', 'You can only update your own gallery images');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await profileService.updateGalleryImage(imageId, updateData, accessToken);
      setGallery(prev => prev.map(img => 
        img.id === imageId ? response.data : img
      ));
      Alert.alert('Success', 'Image updated successfully');
      return response.data;
    } catch (err) {
      console.error('Error updating gallery image:', err);
      setError(err.response?.data?.message || 'Failed to update image');
      Alert.alert('Error', 'Failed to update image');
    } finally {
      setLoading(false);
    }
  }, [isOwnProfile, accessToken]);

  // Delete gallery image
  const deleteGalleryImage = useCallback(async (imageId) => {
    if (!isOwnProfile || !accessToken) {
      Alert.alert('Error', 'You can only delete your own gallery images');
      return;
    }
    
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            setError(null);
            
            try {
              await profileService.deleteGalleryImage(imageId, accessToken);
              setGallery(prev => prev.filter(img => img.id !== imageId));
              Alert.alert('Success', 'Image deleted successfully');
            } catch (err) {
              console.error('Error deleting gallery image:', err);
              setError(err.response?.data?.message || 'Failed to delete image');
              Alert.alert('Error', 'Failed to delete image');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  }, [isOwnProfile, accessToken]);

  // Load initial data
  useEffect(() => {
    if (userId || isOwnProfile) {
      fetchProfile();
      fetchGallery();
    }
  }, [userId, isOwnProfile, fetchProfile, fetchGallery]);

  // Format social media links
  const socialMediaLinks = profile ? profileHelpers.formatSocialMediaLinks(profile.social_media) : [];

  return {
    // State
    profile,
    gallery,
    loading,
    error,
    isOwnProfile,
    socialMediaLinks,
    
    // Actions
    fetchProfile,
    fetchGallery,
    updateProfile,
    addGalleryImage,
    updateGalleryImage,
    deleteGalleryImage,
    
    // Utilities
    refresh: () => {
      fetchProfile();
      fetchGallery();
    }
  };
}; 