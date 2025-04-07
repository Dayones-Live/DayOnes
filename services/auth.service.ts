import { GOOGLE_CONFIG } from '../config/google';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export const authService = {
  async googleSignIn(token: string): Promise<User> {
    try {
      const response = await fetch(`${GOOGLE_CONFIG.backendUrl}/api/v1/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error('Failed to authenticate with Google');
      }

      return await response.json();
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  },

  logout(): void {
    // Clear any stored user data
    localStorage.removeItem('user');
  },
}; 