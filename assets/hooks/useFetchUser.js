import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASEURL } from '../constants';
import { setAccessToken, setUserProfile } from '../redux/actions'; // Adjust the import path

const fetchUserData = async (accessToken) => {
  try {
    const response = await axios.post(
      `${BASEURL}/api/v1/auth/me`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error('Could not fetch user information');
    }
  } catch (error) {
    throw error;
  }
};

const useFetchUser = () => {
  const dispatch = useDispatch();
  const accessTokenFromRedux = useSelector((state) => state.accessToken);

  const getAccessToken = async () => {
    // Fetch the access token from Redux or AsyncStorage
    let accessToken = accessTokenFromRedux;
    if (!accessToken) {
      try {
        accessToken = await AsyncStorage.getItem('authToken');
        if (!accessToken) {
          throw new Error('Access token not found.');
        }
      } catch (error) {
        console.error('Error fetching access token from AsyncStorage:', error);
        throw error;
      }
    }
    return accessToken;
  };

  return useMutation(async () => {
    const accessToken = await getAccessToken(); // Ensure access token is available
    dispatch(setAccessToken(accessToken));
    return await fetchUserData(accessToken);
  }, {
    onSuccess: (data) => {
      dispatch(setUserProfile(data)); // Store user data in Redux

      console.log('User profile fetched and stored in Redux:', data);
    },
    onError: (error) => {
      let errorMessage = 'An unexpected error occurred.';

      if (error.response?.data?.message) {
        errorMessage = error.response?.data?.message;
      }

      console.error('Fetch user error:', error);
      Alert.alert('Fetch Error', errorMessage);
    },
  });
};

export default useFetchUser;
