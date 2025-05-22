import axios from 'axios';

// API için temel URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5051/api';

// Axios instance oluştur
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken') || 
                 localStorage.getItem('token') || 
                 sessionStorage.getItem('authToken') ||
                 sessionStorage.getItem('token');
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log("📦 Token Header'a Eklendi:", config.headers['Authorization']);
    } else {
      console.warn("🚫 Token Bulunamadı!");
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Oturum süresi dolmuş veya geçersiz token');
      
      if (!window.location.pathname.includes('/login')) {
        const returnUrl = window.location.pathname;
        
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        
        window.location.href = `/login?returnUrl=${encodeURIComponent(returnUrl)}`;
      }
    }
    
    return Promise.reject(error);
  }
);

// Paket servisi
export const packageService = {
  // ⭐ Artık doğru endpoint'e istek gönderir
  getMyPackages: () => api.get('/packages/my-packages'),
  
  createPackage: (packageData) => {
    console.log("API'ye gönderilen veri:", packageData);
    return api.post('/packages', packageData);
  },
  
  updatePackage: (id, packageData) => api.put(`/packages/${id}`, packageData),
  
  cancelPackage: (id) => api.post(`/packages/${id}/cancel`),
  
  getPackageDetails: (id) => api.get(`/packages/${id}`)
};

// İstatistik servisi
export const statisticsService = {
  getMyStats: () => api.get('/statistics/my-stats'),
  
  getStatsByDateRange: (startDate, endDate) => 
    api.get(`/statistics/date-range?start=${startDate}&end=${endDate}`)
};

// Kimlik doğrulama servisi
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  
  register: (userData) => api.post('/auth/register', userData),
  
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  
  resetPassword: (token, password) => 
    api.post('/auth/reset-password', { token, password }),
    
  refreshToken: (refreshToken) => 
    api.post('/auth/refresh-token', { refresh_token: refreshToken })
};

// Konum servisi
export const locationService = {
  getAllLocations: () => api.get('/seller-locations'),
  
  addLocation: (locationData) => api.post('/seller-locations', locationData),
  
  updateLocation: (id, locationData) => api.put(`/seller-locations/${id}`, locationData),
  
  deleteLocation: (id) => api.delete(`/seller-locations/${id}`)
};

// Kategori servisi
export const categoryService = {
  getAllCategories: () => api.get('/categories'),
  
  addCategory: (categoryData) => api.post('/categories', categoryData),
  
  updateCategory: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  
  deleteCategory: (id) => api.delete(`/categories/${id}`)
};

export default api;