import axiosInstance from '../../utils/axiosConfig';
import { BASEURL } from '../constants';


// Fetch all conversations with pagination
export const getConversations = async (accessToken, pageNo = 1, pageSize = 10) => {
  try {
    const response = await axiosInstance.get('/api/v1/conversation', {
      params: { pageNo, pageSize }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};

// Fetch all messages for a given conversation
export const getMessages = async (conversationId, pageNo = 1, pageSize = 50) => {
  if (!conversationId) {
    console.error('No conversation ID provided');
    throw new Error('Conversation ID is required');
  }

  try {
    const response = await axiosInstance.get('/api/v1/message', {
      params: { 
        conversationId,
        pageNo,
        pageSize
      }
    });
    console.log('Messages fetched successfully:', response.data?.data?.messages?.length);
    return response.data;
  } catch (error) {
    console.error('Error fetching messages:', {
      status: error.response?.status,
      error: error.response?.data || error.message,
      conversationId
    });
    throw error;
  }
};

// Disconnect the WebSocket
export const disconnect = async (accessToken) => {
  try {
    const response = await axiosInstance.post('/api/v1/message/disconnect', {}, {
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
