// services/statisticsService.js
import api from '../config/api'; // veya api dosyanızın yolu

const statisticsService = {
  // ✅ DÜZELTME: Backend'deki endpoint ile eşleştir
  getMyStats: async () => {
    try {
      // Backend'de /general endpoint'i var, /my-stats yok
      const response = await api.get('/statistics/general');
      console.log('Genel istatistik response:', response);
      return response;
    } catch (error) {
      console.error('Genel istatistik hatası:', error);
      throw error;
    }
  },

  // ✅ DÜZELTME: Detaylı istatistikler için endpoint eklenecek
  getDetailedStats: async (sellerId) => {
    try {
      // Bu endpoint'i backend'e eklemeniz gerekiyor
      const response = await api.get(`/statistics/detailed/${sellerId}`);
      console.log('Detaylı istatistik response:', response);
      return response;
    } catch (error) {
      console.error('Detaylı istatistik hatası:', error);
      throw error;
    }
  },

  // Eski API endpoint'inizi kullanmaya devam etmek isterseniz
  getStatsBySellerId: async (sellerId) => {
    try {
      const response = await api.get(`/statistics/${sellerId}`);
      console.log('Seller istatistik response:', response);
      return response;
    } catch (error) {
      console.error('Seller istatistik hatası:', error);
      throw error;
    }
  },

  // Dönem bazlı istatistikler
  getPeriodStats: async (period) => {
    try {
      const response = await api.get(`/statistics/period/${period}`);
      console.log('Dönem istatistik response:', response);
      return response;
    } catch (error) {
      console.error('Dönem istatistik hatası:', error);
      throw error;
    }
  },

  // Grafik verileri
  getChartData: async (type, period) => {
    try {
      const response = await api.get(`/statistics/charts/${type}?period=${period}`);
      console.log('Grafik verisi response:', response);
      return response;
    } catch (error) {
      console.error('Grafik verisi hatası:', error);
      throw error;
    }
  }
};

export default statisticsService;