import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { setAccessToken, setUserID, setUserProfile } from '../redux/actions';
import { Alert } from 'react-native';
import { BASEURL } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const logoutUser = async (accessToken) => {
  const response = await axios.post(`${BASEURL}/api/v1/auth/signout`, {}, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 200) {
    return true;
  } else {
    throw new Error('Could not log out');
  }
};

const useLogout = () => {
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state.accessToken);

  return useMutation(() => logoutUser(accessToken), {
    onSuccess: async () => {
      try {
        // Clear all auth-related data from AsyncStorage
        await AsyncStorage.multiRemove([
          'authToken',
          'refreshToken',
          'tokenExpiry',
          'userRole',
          'userData'
        ]);
        
        // Clear Redux store
        dispatch(setAccessToken(null));
        dispatch(setUserID(null));
        dispatch(setUserProfile(null));
        
        Alert.alert('Logout Successful', 'You have been logged out.');
      } catch (error) {
        console.error('Error clearing auth data during logout:', error);
        Alert.alert('Logout Error', 'Failed to clear authentication data.');
      }
    },
    onError: (error) => {
      let errorMessage = 'An unexpected error occurred.';

      if (error.response?.data?.message) {
        errorMessage = error.response?.data?.message;
      }

      Alert.alert('Logout Error', errorMessage);
    },
  });
};

export default useLogout;
