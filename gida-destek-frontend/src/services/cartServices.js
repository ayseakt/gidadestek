// services/cartServices.js - DÜZELTME VERSİYONU
import api from './api';

const cartService = {
  /**
   * Sepete ürün ekler
   */
  addToCart: async (packageId, quantity = 1) => {
    try {
      console.log('=== SEPETE EKLEME DEBUG BAŞLANGICI ===');
      console.log('1. İlk parametreler:', {
        packageId,
        packageIdType: typeof packageId,
        packageIdValue: packageId,
        quantity,
        quantityType: typeof quantity,
        quantityValue: quantity
      });
      
      // Temel kontroller
      if (packageId === null || packageId === undefined || packageId === '') {
        throw new Error('Package ID boş olamaz');
      }
      
      // Akıllı numeric conversion
      let numericPackageId;
      if (typeof packageId === 'number' && !isNaN(packageId)) {
        numericPackageId = packageId;
      } else if (typeof packageId === 'string') {
        if (packageId.startsWith('real_')) {
          const extracted = packageId.replace('real_', '');
          numericPackageId = parseInt(extracted, 10);
        } else {
          numericPackageId = parseInt(packageId, 10);
        }
      } else {
        throw new Error(`Geçersiz paket ID formatı: ${typeof packageId}`);
      }
      
      const numericQuantity = parseInt(quantity, 10);
      
      // Validasyon
      if (isNaN(numericPackageId) || numericPackageId <= 0) {
        throw new Error(`Package ID dönüştürülemedi: "${packageId}" -> ${numericPackageId}`);
      }
      
      if (isNaN(numericQuantity) || numericQuantity <= 0) {
        throw new Error(`Geçersiz miktar: "${quantity}" -> ${numericQuantity}`);
      }

      console.log('API çağrısı yapılacak:', {
        package_id: numericPackageId,
        quantity: numericQuantity
      });

      const response = await api.post('/cart/add', {
        package_id: numericPackageId,
        quantity: numericQuantity
      });
      
      console.log('API çağrısı başarılı:', response.data);
      return response;
      
    } catch (error) {
      console.error('Sepete ekleme hatası:', error);
      if (error.response) {
        console.error('API Response Error:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      throw error;
    }
  },

  /**
   * Sepeti getirir
   */
  getCart: async () => {
    try {
      console.log('[DEBUG] getCart API çağrısı yapılıyor...');
      const response = await api.get('/cart');
      console.log('[DEBUG] getCart başarılı:', response.data);
      return response;
    } catch (error) {
      console.error('[DEBUG] Sepet getirme hatası:', error);
      throw error;
    }
  },

  /**
   * Sepet sayısını getirir
   */
  getCartCount: async () => {
    try {
      console.log('[DEBUG] getCartCount API çağrısı yapılıyor...');
      const response = await api.get('/cart/count');
      console.log('[DEBUG] getCartCount başarılı:', response.data);
      return response;
    } catch (error) {
      console.error('[DEBUG] Sepet sayısı getirme hatası:', error);
      if (error.response?.status === 404) {
        return { data: { success: true, data: { count: 0 } } };
      }
      throw error;
    }
  },

  /**
   * Sepet öğesini günceller
   */
  updateCartItem: async (cartItemId, quantity) => {
    try {
      console.log('[DEBUG] updateCartItem çağrısı:', { cartItemId, quantity });
      
      const response = await api.put(`/cart/item/${cartItemId}`, {
        quantity: parseInt(quantity)
      });
      
      console.log('[DEBUG] updateCartItem başarılı:', response.data);
      return response;
    } catch (error) {
      console.error('[DEBUG] Sepet güncelleme hatası:', error);
      throw error;
    }
  },

  /**
   * ⭐ DÜZELTME: Sepetten ürün siler
   */
  removeFromCart: async (cartItemId) => {
    try {
      console.log('[DEBUG] removeFromCart SERVICE çağrısı başladı');
      console.log('[DEBUG] Parametre cartItemId:', cartItemId, typeof cartItemId);
      
      // ⭐ ID'yi güvenli şekilde dönüştür
      const cartItemIdInt = parseInt(cartItemId, 10);
      
      if (isNaN(cartItemIdInt) || cartItemIdInt <= 0) {
        throw new Error(`Geçersiz cart item ID: ${cartItemId} -> ${cartItemIdInt}`);
      }
      
      console.log('[DEBUG] Dönüştürülmüş cartItemId:', cartItemIdInt);
      console.log('[DEBUG] API endpoint:', `/cart/item/${cartItemIdInt}`);
      
      const response = await api.delete(`/cart/item/${cartItemIdInt}`);
      
      console.log('[DEBUG] removeFromCart API yanıtı:', response.data);
      console.log('[DEBUG] HTTP Status:', response.status);
      
      return response;
      
    } catch (error) {
      console.error('[DEBUG] removeFromCart SERVICE hatası:', error);
      
      if (error.response) {
        console.error('[DEBUG] API Error Response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          url: error.config?.url,
          method: error.config?.method
        });
      } else if (error.request) {
        console.error('[DEBUG] Network Error:', error.request);
      } else {
        console.error('[DEBUG] Other Error:', error.message);
      }
      
      throw error;
    }
  },

  /**
   * ⭐ DÜZELTME: Sepeti temizler
   */
  clearCart: async () => {
    try {
      console.log('[DEBUG] clearCart SERVICE çağrısı başladı');
      
      const response = await api.delete('/cart/clear');
      
      console.log('[DEBUG] clearCart API yanıtı:', response.data);
      console.log('[DEBUG] HTTP Status:', response.status);
      
      return response;
      
    } catch (error) {
      console.error('[DEBUG] clearCart SERVICE hatası:', error);
      
      if (error.response) {
        console.error('[DEBUG] API Error Response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          url: error.config?.url,
          method: error.config?.method
        });
      } else if (error.request) {
        console.error('[DEBUG] Network Error:', error.request);
      } else {
        console.error('[DEBUG] Other Error:', error.message);
      }
      
      throw error;
    }
  }
};

export default cartService;