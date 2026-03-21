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

const STRIPE_BASE = '/api/v1/stripe';

export const getArtistDrops = async () => {
  const response = await axiosInstance.get(`${MERCH_BASE}/drops`);
  return response.data?.data;
};

export const createMerchDrop = async (artistPostId: string) => {
  const response = await axiosInstance.post(`${MERCH_BASE}/drops`, { artistPostId });
  return response.data?.data;
};

export const cancelMerchDrop = async (dropId: string) => {
  const response = await axiosInstance.delete(`${MERCH_BASE}/drops/${dropId}`);
  return response.data;
};

export const getPayoutHistory = async () => {
  const response = await axiosInstance.get(`${MERCH_BASE}/payouts`);
  return response.data?.data;
};

export const getPayoutBalance = async () => {
  const response = await axiosInstance.get(`${MERCH_BASE}/payouts/balance`);
  return response.data?.data;
};

export const getStripeConnectStatus = async () => {
  const response = await axiosInstance.get(`${STRIPE_BASE}/connect/status`);
  return response.data?.data;
};

export const startStripeOnboarding = async () => {
  const response = await axiosInstance.post(`${STRIPE_BASE}/connect/onboard`);
  return response.data?.data;
};
