// services/statisticsService.js
import axios from 'axios';

// Base URL
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5051/api';

// Mock data - Backend hazır olana kadar kullanılacak
const mockData = {
  generalStats: {
    toplamPaket: 156,
    kazanilanTutar: 4250,
    azaltilanCO2: 78,
    basariOrani: 87,
    ortalamaPaketFiyati: 27,
    toplamMusteri: 89,
    tekrarMusteri: 34
  },
  weeklySales: [
    { gun: 'Pazartesi', satis: 23, kazanc: 620 },
    { gun: 'Salı', satis: 19, kazanc: 513 },
    { gun: 'Çarşamba', satis: 31, kazanc: 837 },
    { gun: 'Perşembe', satis: 28, kazanc: 756 },
    { gun: 'Cuma', satis: 35, kazanc: 945 },
    { gun: 'Cumartesi', satis: 12, kazanc: 324 },
    { gun: 'Pazar', satis: 8, kazanc: 216 }
  ],
  categoryDistribution: [
    { kategori: 'Ana Yemek', paket_sayisi: 45 },
    { kategori: 'Çorba', paket_sayisi: 23 },
    { kategori: 'Salata', paket_sayisi: 18 },
    { kategori: 'Tatlı', paket_sayisi: 12 },
    { kategori: 'İçecek', paket_sayisi: 8 }
  ],
  monthlyTrend: [
    { ay: 'Ocak', paket: 234, co2: 117, kazanc: 6318 },
    { ay: 'Şubat', paket: 198, co2: 99, kazanc: 5346 },
    { ay: 'Mart', paket: 267, co2: 133, kazanc: 7209 },
    { ay: 'Nisan', paket: 156, co2: 78, kazanc: 4212 }
  ],
  hourlyDistribution: [
    { saat: '08:00-10:00', siparis: 5 },
    { saat: '10:00-12:00', siparis: 12 },
    { saat: '12:00-14:00', siparis: 28 },
    { saat: '14:00-16:00', siparis: 15 },
    { saat: '16:00-18:00', siparis: 22 },
    { saat: '18:00-20:00', siparis: 35 },
    { saat: '20:00-22:00', siparis: 18 }
  ]
};

// API'nin çalışıp çalışmadığını kontrol et
const USE_MOCK_DATA = false; // Backend hazır olunca false yapın

// Simulated API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to make API calls
const makeApiCall = async (endpoint) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      }
    });
    return response.data;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};

const statisticsService = {
  // Genel istatistikler
  getGeneralStatistics: async () => {
    if (USE_MOCK_DATA) {
      await delay(500);
      return mockData.generalStats;
    }
    return await makeApiCall('/statistics');
  },

  // Haftalık satışlar
  getWeeklySales: async () => {
    if (USE_MOCK_DATA) {
      await delay(300);
      return mockData.weeklySales;
    }
    return await makeApiCall('/statistics/weekly-sales');
  },

  // Kategori dağılımı
  getCategoryDistribution: async () => {
    if (USE_MOCK_DATA) {
      await delay(300);
      return mockData.categoryDistribution;
    }
    return await makeApiCall('/statistics/category-distribution');
  },

  // Aylık trend
  getMonthlyTrend: async () => {
    if (USE_MOCK_DATA) {
      await delay(400);
      return mockData.monthlyTrend;
    }
    return await makeApiCall('/statistics/monthly-trend');
  },

  // Saatlik dağılım
  getHourlyDistribution: async () => {
    if (USE_MOCK_DATA) {
      await delay(300);
      return mockData.hourlyDistribution;
    }
    return await makeApiCall('/statistics/hourly-distribution');
  }
};

export default statisticsService;