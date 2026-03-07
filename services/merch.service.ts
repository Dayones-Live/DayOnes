import axiosInstance from '../utils/axiosConfig';

const MERCH_BASE = '/api/v1/merch';

export const getMerchDropByPost = async (postId: string) => {
  const response = await axiosInstance.get(`${MERCH_BASE}/drops/post/${postId}`);
  return response.data?.data;
};

export const getMerchDrop = async (dropId: string) => {
  const response = await axiosInstance.get(`${MERCH_BASE}/drops/${dropId}`);
  return response.data?.data;
};

export const createMerchOrder = async (orderData: {
  merchDropId: string;
  items: { merchProductId: string; quantity: number }[];
  shippingAddress: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state_code: string;
    country_code: string;
    zip: string;
  };
}) => {
  const response = await axiosInstance.post(`${MERCH_BASE}/orders`, orderData);
  return response.data?.data;
};

export const getFanOrders = async () => {
  const response = await axiosInstance.get(`${MERCH_BASE}/orders`);
  return response.data?.data;
};

export const getOrder = async (orderId: string) => {
  const response = await axiosInstance.get(`${MERCH_BASE}/orders/${orderId}`);
  return response.data?.data;
};

export const requestReturn = async (orderId: string) => {
  const response = await axiosInstance.patch(`${MERCH_BASE}/orders/${orderId}/return`);
  return response.data?.data;
};
