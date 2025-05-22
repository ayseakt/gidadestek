import api from './api';

// API'nizin temel URL'si (sunucu adresinize göre değiştirin)
const API_URL = 'http://localhost:5051/api'// veya kendi backend URL'niz

// Konum işlemleri için servis
const locationService = {
  // Tüm konumları getir
  getAllLocations: async () => {
    try {
      return await api.get(`${API_URL}/locations`);
    } catch (error) {
      console.error('Konumlar getirilirken hata oluştu:', error);
      throw error;
    }
  },

  // ID'ye göre tek bir konum getir
  getLocationById: async (id) => {
    try {
      return await api.get(`${API_URL}/locations/${id}`);
    } catch (error) {
      console.error(`ID ${id} olan konum getirilirken hata oluştu:`, error);
      throw error;
    }
  },

  // Yeni konum ekle (gerekirse)
  createLocation: async (locationData) => {
    try {
      return await api.post(`${API_URL}/locations`, locationData);
    } catch (error) {
      console.error('Konum oluşturulurken hata oluştu:', error);
      throw error;
    }
  },

  // Diğer konum işlemleri buraya eklenebilir
  // ...
};

export default locationService;