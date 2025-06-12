import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5051/api';

export const getSellerAverageRating = async (sellerId) => {
  return axios.get(`${API_URL}/reviews/seller/${sellerId}/average-rating`);
};

export default {
  getSellerAverageRating,
};