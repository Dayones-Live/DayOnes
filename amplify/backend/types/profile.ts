// Profile and Gallery Type Definitions

export interface ProfileUpdateInput {
  bio?: string;
  description?: string;
  website?: string;
  social_media?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
  };
}

export interface GalleryImageInput {
  image_url: string;
  caption?: string;
  alt_text?: string;
  display_order?: number;
}

export interface GalleryImageUpdateInput {
  caption?: string;
  alt_text?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface GalleryImage {
  id: string;
  user_id: string;
  image_url: string;
  caption?: string;
  alt_text?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  description?: string;
  website?: string;
  role: 'ARTIST' | 'USER' | 'ADMIN';
  social_media?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
  };
  created_at: string;
  updated_at: string;
  gallery_images?: GalleryImage[];
  stats?: {
    total_posts?: number;
    followers_count?: number;
    following_count?: number;
  };
}

export interface ProfileResponse {
  success: boolean;
  data: UserProfile;
  message?: string;
}

export interface GalleryResponse {
  success: boolean;
  data: {
    images: GalleryImage[];
    total_count: number;
    page: number;
    page_size: number;
  };
  message?: string;
}

export interface ProfileUpdateResponse {
  success: boolean;
  data: UserProfile;
  message?: string;
}

export interface GalleryImageResponse {
  success: boolean;
  data: GalleryImage;
  message?: string;
} 