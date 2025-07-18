import axios from 'axios';
import { BASEURL } from '../constants';

// Profile Service - Instagram-like profile management
export const profileService = {
  // Public endpoints (no authentication required)
  
  /**
   * Get a user's public profile information
   * @param {string} userId - The user ID to fetch profile for
   * @returns {Promise<Object>} User profile data
   */
  async getPublicProfile(userId) {
    try {
      const response = await axios.get(`${BASEURL}/api/v1/profile/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching public profile:', error);
      throw error;
    }
  },

  /**
   * Get all gallery images for a specific user
   * @param {string} userId - The user ID to fetch gallery for
   * @param {number} page - Page number for pagination
   * @param {number} pageSize - Number of items per page
   * @returns {Promise<Object>} Gallery images data
   */
  async getPublicGallery(userId, page = 1, pageSize = 20) {
    try {
      const response = await axios.get(`${BASEURL}/api/v1/profile/gallery/${userId}`, {
        params: { page, pageSize }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching public gallery:', error);
      throw error;
    }
  },

  // Protected endpoints (require authentication)

  /**
   * Update user's own profile information
   * @param {Object} profileData - Profile update data
   * @param {string} accessToken - User's access token
   * @returns {Promise<Object>} Updated profile data
   */
  async updateProfile(profileData, accessToken) {
    try {
      const response = await axios.post(`${BASEURL}/api/v1/profile/update`, profileData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  /**
   * Add a new image to user's own gallery
   * @param {Object} imageData - Gallery image data
   * @param {string} accessToken - User's access token
   * @returns {Promise<Object>} Created image data
   */
  async addGalleryImage(imageData, accessToken) {
    try {
      const response = await axios.post(`${BASEURL}/api/v1/profile/gallery/add`, imageData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error adding gallery image:', error);
      throw error;
    }
  },

  /**
   * Update an existing gallery image
   * @param {string} imageId - The image ID to update
   * @param {Object} updateData - Image update data
   * @param {string} accessToken - User's access token
   * @returns {Promise<Object>} Updated image data
   */
  async updateGalleryImage(imageId, updateData, accessToken) {
    try {
      const response = await axios.put(`${BASEURL}/api/v1/profile/gallery/${imageId}`, updateData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating gallery image:', error);
      throw error;
    }
  },

  /**
   * Delete a gallery image
   * @param {string} imageId - The image ID to delete
   * @param {string} accessToken - User's access token
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteGalleryImage(imageId, accessToken) {
    try {
      const response = await axios.delete(`${BASEURL}/api/v1/profile/gallery/${imageId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting gallery image:', error);
      throw error;
    }
  },

  /**
   * Get user's own profile with gallery (authenticated)
   * @param {string} accessToken - User's access token
   * @returns {Promise<Object>} User profile with gallery data
   */
  async getOwnProfile(accessToken) {
    try {
      const response = await axios.get(`${BASEURL}/api/v1/profile/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching own profile:', error);
      throw error;
    }
  },

  /**
   * Get user's own gallery (authenticated)
   * @param {string} accessToken - User's access token
   * @param {number} page - Page number for pagination
   * @param {number} pageSize - Number of items per page
   * @returns {Promise<Object>} User's gallery data
   */
  async getOwnGallery(accessToken, page = 1, pageSize = 20) {
    try {
      const response = await axios.get(`${BASEURL}/api/v1/profile/gallery/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: { page, pageSize }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching own gallery:', error);
      throw error;
    }
  }
};

// Helper functions for common profile operations
export const profileHelpers = {
  /**
   * Format social media links for display
   * @param {Object} socialMedia - Social media object
   * @returns {Array} Array of formatted social media links
   */
  formatSocialMediaLinks(socialMedia) {
    if (!socialMedia) return [];
    
    const platforms = [
      { key: 'instagram', name: 'Instagram', icon: 'instagram' },
      { key: 'twitter', name: 'Twitter', icon: 'twitter' },
      { key: 'facebook', name: 'Facebook', icon: 'facebook' },
      { key: 'tiktok', name: 'TikTok', icon: 'music' },
      { key: 'youtube', name: 'YouTube', icon: 'youtube-play' }
    ];

    return platforms
      .filter(platform => socialMedia[platform.key])
      .map(platform => ({
        ...platform,
        url: socialMedia[platform.key]
      }));
  },

  /**
   * Validate profile update data
   * @param {Object} profileData - Profile data to validate
   * @returns {Object} Validation result
   */
  validateProfileUpdate(profileData) {
    const errors = [];

    if (profileData.bio && profileData.bio.length > 150) {
      errors.push('Bio must be 150 characters or less');
    }

    if (profileData.description && profileData.description.length > 500) {
      errors.push('Description must be 500 characters or less');
    }

    if (profileData.website && !profileData.website.startsWith('http')) {
      errors.push('Website must start with http:// or https://');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Validate gallery image data
   * @param {Object} imageData - Image data to validate
   * @returns {Object} Validation result
   */
  validateGalleryImage(imageData) {
    const errors = [];

    if (!imageData.image_url) {
      errors.push('Image URL is required');
    }

    if (imageData.caption && imageData.caption.length > 200) {
      errors.push('Caption must be 200 characters or less');
    }

    if (imageData.alt_text && imageData.alt_text.length > 100) {
      errors.push('Alt text must be 100 characters or less');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}; 