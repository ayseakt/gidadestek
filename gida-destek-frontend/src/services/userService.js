// src/services/userService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5051/api';

// Token'ı local storage'dan al
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

// Kullanıcı profil bilgilerini getir
export const getUserProfile = async () => {
  try {
    const response = await axios.get(`${API_URL}/profile`, getAuthHeader());
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Sunucu hatası' };
  }
};

// Kullanıcı profil bilgilerini güncelle
export const updateUserProfile = async (userData) => {
  try {
    const response = await axios.put(`${API_URL}/profile/update`, userData, getAuthHeader());
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Sunucu hatası' };
  }
};

// Şifre değiştir
export const changePassword = async (passwordData) => {
  try {
    const response = await axios.post(`${API_URL}/profile/change-password`, passwordData, getAuthHeader());
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Sunucu hatası' };
  }
};

// Profil resmi yükle
export const uploadProfilePicture = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('profilePicture', imageFile);
    
    const response = await axios.post(
      `${API_URL}/profile/upload-picture`,
      formData,
      {
        ...getAuthHeader(),
        headers: {
          ...getAuthHeader().headers,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Sunucu hatası' };
  }
};

// İki adımlı doğrulamayı etkinleştir
export const enableTwoFactor = async () => {
  try {
    const response = await axios.post(`${API_URL}/profile/enable-2fa`, {}, getAuthHeader());
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Sunucu hatası' };
  }
};

// İki adımlı doğrulamayı doğrula
export const verifyTwoFactor = async (verificationCode) => {
  try {
    const response = await axios.post(
      `${API_URL}/profile/verify-2fa`,
      { verificationCode },
      getAuthHeader()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Sunucu hatası' };
  }
};

// İki adımlı doğrulamayı devre dışı bırak
export const disableTwoFactor = async () => {
  try {
    const response = await axios.post(`${API_URL}/profile/disable-2fa`, {}, getAuthHeader());
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Sunucu hatası' };
  }
};
// Satıcı profil bilgilerini getir
export const getSellerProfile = async () => {
  try {
    const response = await axios.get(`${API_URL}/profile/seller`, getAuthHeader());
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Sunucu hatası' };
  }
};

// Satıcı profil bilgilerini güncelle
export const updateSellerProfile = async (sellerData) => {
  try {
    const response = await axios.put(`${API_URL}/profile/seller/update`, sellerData, getAuthHeader());
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Sunucu hatası' };
  }
};