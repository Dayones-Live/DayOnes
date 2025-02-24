import { useState } from 'react';
import axios from 'axios';
import { Alert } from 'react-native';
import { BASE_URL } from '../../config/config';

const useSendMessage = (accessToken) => {
  const [error, setError] = useState(null);

  // Send Message Function
  const sendMessage = async (conversationId, message, url = null, mediaType = null) => {
    if (!accessToken) {
      Alert.alert('Error', 'User is not authenticated');
      return;
    }

    try {
      // Define message payload with conditional url and mediaType
      const payload = {
        conversationId: conversationId,
        message: message,
        ...(url && { url, mediaType }), // Only include url and mediaType if url is provided
      };

      // Log the payload for verification
      console.log('Payload being sent:', payload);

      // Send message using axios (API call)
      const response = await axios({
        method: 'POST',
        url: `${BASE_URL}/api/v1/message/send`,
        data: payload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      // Handle successful response
      console.log('Message sent successfully via API:', response.data);
      return response.data;

    } catch (err) {
      // Handle errors
      console.error('Error sending message:', err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data : err.message);
      Alert.alert('Error', 'Failed to send the message');
    }
  };

  return { sendMessage, error };
};

export default useSendMessage;
