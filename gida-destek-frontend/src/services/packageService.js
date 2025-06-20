import api from './api';

// Paket işlemleri için servis fonksiyonları
const packageService = {
  /**
   * Yeni bir paket oluşturur
   */
  createPackage: (packageData) => {
    return api.post('/packages/create', packageData); // '/create' ekleyin
  },
      
  /**
   * Aktif paketleri getirir
   */
  getActivePackages: () => {
    return api.get('/packages/active');
  },
    
  /**
   * Belirli bir paketi ID'ye göre getirir
   */
  getPackageById: (packageId) => {
    return api.get(`/packages/${packageId}`);
  },
    
  /**
   * Bir paketi günceller
   */
  updatePackage: (packageId, packageData) => {
    return api.put(`/packages/${packageId}`, packageData);
  },
    
  /**
   * Bir paketi siler/deaktif eder
   */
  deletePackage: (packageId) => {
    return api.delete(`/packages/${packageId}`);
  },
    
  /**
   * Bir paketin fotoğrafını yükler
   */
  uploadPackageImage: (formData) => {
    return api.post('/package-images', formData);
  },
    
  /**
   * Satıcının geçmiş paketlerini getirir
   */
  getPastPackages: () => {
    return api.get('/packages/history');
  },
    
  /**
   * Satıcının paket istatistiklerini getirir
   */
  getPackageStats: () => {
    return api.get('/packages/stats');
  },
    
  /**
   * Tüm aktif paketleri getirir
   */
  getAllActivePackages: () => {
    return api.get('/packages/all-active');
  },
getAllActivePackagesWithImages: () => {
  return api.get('/packages/all-active-with-categories'); // Bu endpoint'i kullanın
},
  /**
   * Kullanıcının kendi paketlerini getirir
   */
  getMyPackages: () => {
    return api.get('/packages/my-packages');
  },


};

export default packageService;