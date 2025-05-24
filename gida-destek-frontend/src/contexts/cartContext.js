// contexts/CartContext.js - Geliştirilmiş versiyon
import React, { createContext, useContext, useState, useEffect } from 'react';
import cartService from '../services/cartServices';
import authService from '../services/AuthService';
import { toast } from 'react-toastify';
const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);

  // Sayfa yüklendiğinde sepeti backend'den getir
  useEffect(() => {
    if (authService.isAuthenticated()) {
      loadCartFromBackend();
      loadCartCount();
    }
  }, []);

  // Backend'den sepeti yükle
  const loadCartFromBackend = async () => {
    try {
      setIsLoading(true);
      const response = await cartService.getCart();
      
      if (response.data && response.data.success) {
        // Backend'den gelen veriyi frontend formatına dönüştür
        const formattedItems = response.data.data.items.map(item => ({
          cartId: item.cart_item_id,
          id: item.package_id,
          product: item.package.package_name,
          storeName: item.package.seller.business_name,
          storeId: item.package.seller_id,
          price: parseFloat(item.package.original_price),
          newPrice: parseFloat(item.unit_price),
          image: item.package.image_url,
          quantity: item.quantity,
          description: item.package.description,
          location: item.package.location ? {
            address: item.package.location.address,
            district: item.package.location.district,
            city: item.package.location.city
          } : null,
          addedAt: item.added_at,
          // Backend'den gelen diğer veriler
          packageData: item.package
        }));
        
        setCartItems(formattedItems);
        setCartCount(formattedItems.length);
      }
    } catch (error) {
      console.error('Sepet yüklenirken hata:', error);
      // Hata durumunda boş sepet göster
      setCartItems([]);
      setCartCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Sepet sayısını backend'den getir
  const loadCartCount = async () => {
    try {
      const response = await cartService.getCartCount();
      if (response.data && response.data.success) {
        setCartCount(response.data.data.count);
      }
    } catch (error) {
      console.error('Sepet sayısı alınırken hata:', error);
    }
  };

  // Sepete ürün ekleme - Geliştirilmiş versiyon
  const addToCart = async (item) => {
    // Kullanıcı giriş yapmış mı kontrol et
    if (!authService.isAuthenticated()) {
      return { 
        success: false, 
        message: 'Sepete ürün eklemek için giriş yapmalısınız!',
        needsAuth: true
      };
    }

    // Önce sepette var mı kontrol et
    const isAlreadyInCart = cartItems.some(cartItem => 
      cartItem.id === item.id && cartItem.storeId === item.storeId
    );

    if (isAlreadyInCart) {
      return {
        success: false,
        message: 'Bu ürün sepetinizde zaten mevcut!',
        alreadyInCart: true
      };
    }

    try {
      setIsLoading(true);
      
      // Backend'e sepete ekleme isteği gönder
      const response = await cartService.addToCart(item.id, item.quantity || 1);
      
      if (response.data && response.data.success) {
        // Başarılı ekleme sonrası sepeti yeniden yükle
        await loadCartFromBackend();
        await loadCartCount();
        
        return { 
          success: true, 
          message: response.data.message || 'Ürün sepete eklendi!' 
        };
      } else {
        // Backend'den gelen hata mesajını kontrol et
        if (response.data.data && response.data.data.alreadyInCart) {
          return {
            success: false,
            message: response.data.message,
            alreadyInCart: true
          };
        }
        
        return { 
          success: false, 
          message: response.data.message || 'Ürün sepete eklenemedi!' 
        };
      }
    } catch (error) {
      console.error('Sepete ekleme hatası:', error);
      
      // Hata mesajını kullanıcı dostu hale getir
      let errorMessage = 'Ürün sepete eklenirken hata oluştu';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
        // Backend'den alreadyInCart kontrolü
        if (error.response.data.data && error.response.data.data.alreadyInCart) {
          return {
            success: false,
            message: errorMessage,
            alreadyInCart: true
          };
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        message: errorMessage 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Sepetten ürün çıkarma - Backend entegreli
const removeFromCart = async (cartId) => {
  console.log('🔥 removeFromCart çağrıldı!');
  console.log('🔥 cartId:', cartId);
  console.log('🔥 cartItems:', cartItems);
  console.log('🔥 Bu ürünün cartId\'si:', cartItems.find(item => item.cartId === cartId));
  setIsLoading(true);
  try {
    console.log(`[FRONTEND DEBUG] removeFromCart fonksiyonu çağrıldı. cartId:`, cartId);
    await cartService.removeFromCart(cartId);
    await loadCartFromBackend(); // await ekle
    await loadCartCount(); // sepet sayısını da güncelle
    toast.success('Ürün sepetten kaldırıldı!');
  } catch (error) {
    console.error('[FRONTEND DEBUG] Ürün kaldırma hatası:', error);
    toast.error('Ürün sepetten kaldırılamadı.');
  } finally {
    setIsLoading(false);
  }
};

  // Sepet öğesi güncelleme - Backend entegreli
  const updateCartItem = async (cartId, quantity) => {
    try {
      setIsLoading(true);
      
      const response = await cartService.updateCartItem(cartId, quantity);
      
      if (response.data && response.data.success) {
        // Başarılı güncelleme sonrası sepeti yeniden yükle
        await loadCartFromBackend();
        await loadCartCount();
        
        return { 
          success: true, 
          message: response.data.message || 'Sepet güncellendi!' 
        };
      } else {
        return { 
          success: false, 
          message: response.data.message || 'Sepet güncellenemedi!' 
        };
      }
    } catch (error) {
      console.error('Sepet güncelleme hatası:', error);
      return { 
        success: false, 
        message: 'Sepet güncellenirken hata oluştu' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    try {
      console.log('[FRONTEND DEBUG] clearCart fonksiyonu çağrıldı.');
      await cartService.clearCart();
      await loadCartFromBackend(); // Backend'den sepeti yeniden yükle
      await loadCartCount(); // Sepet sayısını da güncelle
      toast.success('Sepetiniz temizlendi!');
    } catch (error) {
      console.error('[FRONTEND DEBUG] Sepet temizleme hatası:', error);
      toast.error('Sepet temizlenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sepet toplamını hesaplama
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (parseFloat(item.newPrice || item.price || 0) * parseInt(item.quantity || 1));
    }, 0);
  };

  // Belirli bir ürünün sepette olup olmadığını kontrol etme
  const isInCart = (itemId, storeId) => {
    return cartItems.some(item => 
      item.id === itemId && item.storeId === storeId
    );
  };

  // Sepet doğrulama
  const validateCart = async () => {
    try {
      // Backend'den güncel sepeti al ve kontrol et
      await loadCartFromBackend();
      return { isValid: true, message: 'Sepetiniz güncel' };
    } catch (error) {
      console.error('Sepet doğrulama hatası:', error);
      return { isValid: false, message: 'Sepet doğrulanamadı' };
    }
  };

  // SATIN ALMA İŞLEMLERİ (Mevcut kodunuz korundu)
  const processPayment = async (paymentData) => {
    setIsLoading(true);
    
    try {
      // Önce sepeti doğrula
      await validateCart();
      
      const orderData = {
        id: Date.now().toString(),
        items: cartItems,
        total: getCartTotal(),
        paymentMethod: paymentData.paymentMethod,
        deliveryAddress: paymentData.deliveryAddress,
        customerNotes: paymentData.customerNotes,
        orderDate: new Date().toISOString(),
        status: 'pending',
        estimatedPickupTime: paymentData.estimatedPickupTime
      };

      // Backend'e sipariş gönder
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error('Sipariş gönderilemedi');
      }

      const result = await response.json();
      
      const completedOrder = {
        ...orderData,
        id: result.orderId || orderData.id,
        paymentStatus: 'completed',
        trackingNumber: result.trackingNumber
      };

      setOrderHistory(prev => [completedOrder, ...prev]);
      
      // Sipariş tamamlandıktan sonra sepeti temizle
      await clearCart();
      
      setIsLoading(false);
      
      return { 
        success: true, 
        orderId: completedOrder.id,
        trackingNumber: completedOrder.trackingNumber,
        message: 'Siparişiniz başarıyla oluşturuldu!' 
      };

    } catch (error) {
      setIsLoading(false);
      console.error('Ödeme hatası:', error);
      return { 
        success: false, 
        message: error.message || 'Ödeme sırasında bir hata oluştu' 
      };
    }
  };

  // Sipariş durumunu güncelleme
  const updateOrderStatus = (orderId, newStatus) => {
    setOrderHistory(prev => 
      prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, lastUpdated: new Date().toISOString() }
          : order
      )
    );
  };

  // Sipariş iptal etme
  const cancelOrder = async (orderId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      if (response.ok) {
        updateOrderStatus(orderId, 'cancelled');
        return { success: true, message: 'Sipariş iptal edildi' };
      } else {
        throw new Error('İptal işlemi başarısız');
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  // Sipariş detaylarını getirme
  const getOrderById = (orderId) => {
    return orderHistory.find(order => order.id === orderId);
  };

  // Aktif siparişleri getirme
  const getActiveOrders = () => {
    return orderHistory.filter(order => 
      ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status)
    );
  };

  // Tamamlanan siparişleri getirme
  const getCompletedOrders = () => {
    return orderHistory.filter(order => 
      ['completed', 'cancelled'].includes(order.status)
    );
  };

  // Auth durumu değiştiğinde sepeti yeniden yükle
  useEffect(() => {
    const handleAuthChange = () => {
      if (authService.isAuthenticated()) {
        loadCartFromBackend();
        loadCartCount();
      } else {
        setCartItems([]);
        setCartCount(0);
      }
    };

    // Auth değişikliklerini dinle
    window.addEventListener('storage', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const value = {
    // Sepet işlemleri
    cartItems,
    cartCount,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    getCartTotal,
    isInCart,
    validateCart,
    loadCartFromBackend, // Sepeti manuel yenileme için
    
    // Loading durumu
    isLoading,
    
    // Satın alma işlemleri
    processPayment,
    
    // Sipariş yönetimi
    orderHistory,
    updateOrderStatus,
    cancelOrder,
    getOrderById,
    getActiveOrders,
    getCompletedOrders
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};