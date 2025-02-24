import axios from 'axios';
import { BASEURL } from '../constants';


// Fetch all conversations with pagination
export const getConversations = async (pageNo, pageSize) => {
  try {
    const response = await axiosInstance.get(`/api/v1/conversation?pageNo=${pageNo}&pageSize=${pageSize}`);
    return response.data || { conversations: [] };
  } catch (error) {
    // If the interceptor handled the 401, we'll get null data
    if (!error) return { conversations: [] };
    throw error;
  }
};

// Fetch all messages for a given conversation
export const getMessages = async (conversationId, accessToken, pageNo = 1, pageSize = 50) => {
  try {
    const response = await axios.get(`${BASEURL}/api/v1/message`, {
      params: { conversationId, pageNo, pageSize },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log('Messages fetched:', response.data);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// Disconnect the WebSocket
export const disconnect = async (accessToken) => {
  try {
    const response = await axios.post(`${BASEURL}/api/v1/message/disconnect`, {}, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log('Disconnected:', response.data);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};

// Handle API Errors
const handleApiError = (error, pageNo = 1, pageSize = 10) => {
  if (error.response) {
    if (error.response.status === 404) {
      console.warn('No data found, returning empty array.');
      return { data: [], meta: { count: 0, page: pageNo, size: pageSize, pages: 0 } };
    }
    if (error.response.status === 401) {
      console.error('Unauthorized request, check access token.');
      throw new Error('Unauthorized access. Please check your credentials.');
    }
    console.error(`Error fetching data: ${error.response.status}`);
  } else {
    console.error('Network error or server is unreachable:', error.message);
  }
  throw error;
};
