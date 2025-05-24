// services/locationService.js - Frontend versiyonu
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5051/api';

class LocationService {
  
  // TÜM LOKASYONLARİ GETİR - EKLENDİ
  static async getAllLocations() {
    try {
      const response = await fetch(`${API_BASE_URL}/locations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Lokasyonlar alınamadı');
      }
      
      return {
        success: true,
        data: result.data || result
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: []
      };
    }
  }

  // Kullanıcının tüm adreslerini getir
  static async getUserAddresses(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/addresses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Token varsa
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Adresler alınamadı');
      }
      
      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Varsayılan adresi getir
  static async getDefaultAddress(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/addresses/default`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Varsayılan adres alınamadı');
      }
      
      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Yeni adres ekle
  static async addAddress(userId, addressData) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(addressData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Adres eklenemedi');
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Adres başarıyla eklendi'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Adres güncelle
  static async updateAddress(userId, locationId, updateData) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/addresses/${locationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Adres güncellenemedi');
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Adres başarıyla güncellendi'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Adres sil
  static async deleteAddress(userId, locationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/addresses/${locationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Adres silinemedi');
      }
      
      return {
        success: true,
        message: 'Adres başarıyla silindi'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Varsayılan adres değiştir
  static async setDefaultAddress(userId, locationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/addresses/${locationId}/set-default`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Varsayılan adres değiştirilemedi');
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Varsayılan adres değiştirildi'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Yakın adresler bul
  static async findNearbyAddresses(latitude, longitude, radiusKm = 5) {
    try {
      const response = await fetch(`${API_BASE_URL}/addresses/nearby?lat=${latitude}&lng=${longitude}&radius=${radiusKm}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Yakın adresler alınamadı');
      }
      
      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}

export default LocationService;