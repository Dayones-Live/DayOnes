import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Check if the current auth token is valid
 * @returns {Promise<boolean>} true if token exists and is not expired
 */
export const isTokenValid = async () => {
  try {
    const [authToken, tokenExpiry] = await Promise.all([
      AsyncStorage.getItem('authToken'),
      AsyncStorage.getItem('tokenExpiry')
    ]);

    if (!authToken || !tokenExpiry) {
      return false;
    }

    const expiryTime = parseInt(tokenExpiry);
    const now = Date.now();
    return now < expiryTime;
  } catch (error) {
    console.error('Error checking token validity:', error);
    return false;
  }
};

/**
 * Check if token expires within the specified milliseconds
 * @param {number} ms - milliseconds before expiry to check
 * @returns {Promise<boolean>} true if token expires within the specified time
 */
export const isTokenExpiringSoon = async (ms = 5 * 60 * 1000) => { // default 5 minutes
  try {
    const tokenExpiry = await AsyncStorage.getItem('tokenExpiry');
    if (!tokenExpiry) {
      return true;
    }

    const expiryTime = parseInt(tokenExpiry);
    const now = Date.now();
    const timeUntilExpiry = expiryTime - now;
    
    return timeUntilExpiry < ms;
  } catch (error) {
    console.error('Error checking token expiry:', error);
    return true;
  }
};

