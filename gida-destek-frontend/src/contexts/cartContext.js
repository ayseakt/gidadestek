// contexts/CartContext.js - Backend Order Integration
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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

  // ✅ Backend'den siparişleri getirme fonksiyonu
  const loadOrderHistory = useCallback(async () => {
    try {
      if (!authService.isAuthenticated()) {
        setOrderHistory([]);
        return;
      }

      const response = await fetch('/api/orders/my-orders', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.orders) {
          setOrderHistory(data.orders);
        }
      }
    } catch (error) {
      console.error('Sipariş geçmişi yüklenirken hata:', error);
    }
  }, []);

  // ✅ FIX: useCallback ile performance optimize edilmiş fonksiyonlar
  const loadCartFromBackend = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await cartService.getCart();
      
      if (response.data && response.data.success) {
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
          packageData: item.package
        }));
        
        setCartItems(formattedItems);
        setCartCount(formattedItems.length);
      }
    } catch (error) {
      console.error('Sepet yüklenirken hata:', error);
      setCartItems([]);
      setCartCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCartCount = useCallback(async () => {
    try {
      const response = await cartService.getCartCount();
      if (response.data && response.data.success) {
        setCartCount(response.data.data.count);
      }
    } catch (error) {
      console.error('Sepet sayısı alınırken hata:', error);
    }
  }, []);

  // ✅ ÖNCE updateOrderStatus'u tanımla
  const updateOrderStatus = useCallback((orderId, newStatus) => {
    setOrderHistory(prev => 
      prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, lastUpdated: new Date().toISOString() }
          : order
      )
    );
  }, []);

  // ✅ SONRA startOrderSimulation'ı tanımla
  const startOrderSimulation = useCallback((orderId) => {
    console.log(`Sipariş simülasyonu başlatıldı: ${orderId}`);
    
    // 2 dakika sonra "hazırlanıyor" durumuna geç
    setTimeout(() => {
      console.log(`Sipariş hazırlanıyor: ${orderId}`);
      updateOrderStatus(orderId, 'hazirlaniyor');
      
      // Bildirim göster (eğer izin varsa)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Siparişiniz Hazırlanıyor! 👨‍🍳', {
          body: `${orderId} numaralı siparişiniz hazırlanmaya başlandı.`,
          icon: '/favicon.ico'
        });
      }
    }, 120000); // 2 dakika = 120000ms
    
    // 15 dakika sonra "hazır" durumuna geç
    setTimeout(() => {
      console.log(`Sipariş hazır: ${orderId}`);
      updateOrderStatus(orderId, 'hazir');
      
      // Hazır bildirimi
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Siparişiniz Hazır! 🎉', {
          body: `${orderId} numaralı siparişiniz teslim alınmaya hazır. Onay kodunuzu yanınızda bulundurun.`,
          icon: '/favicon.ico',
          requireInteraction: true // Kullanıcı tıklayana kadar kapanmasın
        });
      }
    }, 900000); // 15 dakika = 900000ms
  }, [updateOrderStatus]);

  // ✅ Bildirim izni isteme fonksiyonu
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('Bildirim izni:', permission);
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  // ✅ FIX: İlk yükleme için ayrı useEffect ve auth kontrolü
  useEffect(() => {
    if (authService.isAuthenticated()) {
      loadCartFromBackend();
      loadCartCount();
      loadOrderHistory(); // ✅ Sipariş geçmişini de yükle
    }
  }, [loadCartFromBackend, loadCartCount, loadOrderHistory]);

  // ✅ FIX: Auth değişikliklerini dinleme - debounced
  useEffect(() => {
    let timeoutId;
    
    const handleAuthChange = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (authService.isAuthenticated()) {
          loadCartFromBackend();
          loadCartCount();
          loadOrderHistory();
        } else {
          setCartItems([]);
          setCartCount(0);
          setOrderHistory([]);
        }
      }, 300);
    };

    window.addEventListener('storage', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', handleAuthChange);
      clearTimeout(timeoutId);
    };
  }, [loadCartFromBackend, loadCartCount, loadOrderHistory]);

  // ✅ FIX: Optimize edilmiş addToCart fonksiyonu
  const addToCart = useCallback(async (item) => {
    if (!authService.isAuthenticated()) {
      return { 
        success: false, 
        message: 'Sepete ürün eklemek için giriş yapmalısınız!',
        needsAuth: true
      };
    }

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
      const response = await cartService.addToCart(item.id, item.quantity || 1);
      
      if (response.data && response.data.success) {
        await Promise.all([
          loadCartFromBackend(),
          loadCartCount()
        ]);
        
        return { 
          success: true, 
          message: response.data.message || 'Ürün sepete eklendi!' 
        };
      } else {
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
      
      let errorMessage = 'Ürün sepete eklenirken hata oluştu';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
        if (error.response.data.data && error.response.data.data.alreadyInCart) {
          return {
            success: false,
            message: errorMessage,
            alreadyInCart: true
          };
        }
      }
      
      return { 
        success: false, 
        message: errorMessage 
      };
    } finally {
      setIsLoading(false);
    }
  }, [cartItems, loadCartFromBackend, loadCartCount]);

  const removeFromCart = useCallback(async (cartId) => {
    try {
      setIsLoading(true);
      await cartService.removeFromCart(cartId);
      
      await Promise.all([
        loadCartFromBackend(),
        loadCartCount()
      ]);
      
      toast.success('Ürün sepetten kaldırıldı!');
    } catch (error) {
      console.error('Ürün kaldırma hatası:', error);
      toast.error('Ürün sepetten kaldırılamadı.');
    } finally {
      setIsLoading(false);
    }
  }, [loadCartFromBackend, loadCartCount]);

  const updateCartItem = useCallback(async (cartId, quantity) => {
    try {
      setIsLoading(true);
      const response = await cartService.updateCartItem(cartId, quantity);
      
      if (response.data && response.data.success) {
        await Promise.all([
          loadCartFromBackend(),
          loadCartCount()
        ]);
        
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
  }, [loadCartFromBackend, loadCartCount]);

  const clearCart = useCallback(async () => {
    try {
      setIsLoading(true);
      await cartService.clearCart();
      
      await Promise.all([
        loadCartFromBackend(),
        loadCartCount()
      ]);
      
      toast.success('Sepetiniz temizlendi!');
    } catch (error) {
      console.error('Sepet temizleme hatası:', error);
      toast.error('Sepet temizlenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, [loadCartFromBackend, loadCartCount]);

  // ✅ FIX: Memoized hesaplama - DEĞER olarak, fonksiyon değil
  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      return total + (parseFloat(item.newPrice || item.price || 0) * parseInt(item.quantity || 1));
    }, 0);
  }, [cartItems]);

  // ✅ EKLENEN: Geriye uyumluluk için fonksiyon versiyonu da
  const getCartTotal = useCallback(() => {
    return cartTotal;
  }, [cartTotal]);

  const isInCart = useCallback((itemId, storeId) => {
    return cartItems.some(item => 
      item.id === itemId && item.storeId === storeId
    );
  }, [cartItems]);

  const validateCart = useCallback(async () => {
    try {
      const now = Date.now();
      const lastValidation = validateCart.lastCall || 0;
      
      if (now - lastValidation < 5000) {
        return { isValid: true, message: 'Sepetiniz güncel (cached)' };
      }
      
      validateCart.lastCall = now;
      await loadCartFromBackend();
      return { isValid: true, message: 'Sepetiniz güncel' };
    } catch (error) {
      console.error('Sepet doğrulama hatası:', error);
      return { isValid: false, message: 'Sepet doğrulanamadı' };
    }
  }, [loadCartFromBackend]);

  // ✅ Backend entegrasyonu ile sipariş oluşturma
  const processPayment = useCallback(async (paymentData) => {
    setIsLoading(true);
    
    try {
      // Sepeti doğrula
      await validateCart();
      
      if (cartItems.length === 0) {
        throw new Error('Sepetiniz boş');
      }

      // 1. Önce ödeme simülasyonunu çalıştır
      const { PaymentSimulator } = await import('../utils/paymentSimulator');
      const simulator = new PaymentSimulator();
      
      const simulationData = {
        ...paymentData,
        amount: cartTotal
      };
      
      console.log('Ödeme simülasyonu başlatılıyor:', simulationData);
      
      const paymentResult = await simulator.processPayment(simulationData);
      
      // 2. Ödeme başarısızsa hemen dön
      if (!paymentResult.success) {
        return paymentResult;
      }

      // 3. Ödeme başarılıysa backend'e sipariş kaydet
      const orderPayload = {
        // Sipariş bilgileri
        trackingNumber: paymentResult.trackingNumber,
        totalAmount: parseFloat(paymentResult.totalAmount),
        paymentMethod: paymentData.paymentMethod,
        deliveryAddress: paymentData.deliveryAddress,
        customerNotes: paymentData.customerNotes,
        estimatedPickupTime: paymentData.estimatedPickupTime,
        
        // Sipariş kalemleri
        items: cartItems.map(item => ({
          package_id: item.id,
          quantity: item.quantity,
          unit_price: item.newPrice,
          package_name: item.product,
          seller_name: item.storeName
        })),
        
        // Simülasyon bilgileri
        isSimulation: true,
        transactionId: paymentResult.transactionId,
        confirmationCode: paymentResult.confirmationCode,
        authorizationCode: paymentResult.authorizationCode,
        
        // Durum bilgisi
        status: 'devam_ediyor',
        estimatedReadyTime: paymentResult.estimatedReadyTime
      };

      console.log('Backend\'e sipariş gönderiliyor:', orderPayload);

      // Backend'e sipariş gönder
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify(orderPayload)
      });

      const backendResult = await response.json();
      console.log('Backend response:', backendResult);

      if (!response.ok) {
        throw new Error(backendResult.message || 'Sipariş backend\'e kaydedilemedi');
      }

      if (backendResult.success) {
        // Sipariş başarıyla kaydedildi - sepeti temizle
        await clearCart();
        
        // Sipariş geçmişini yenile
        await loadOrderHistory();
        
        // Sipariş simülasyonunu başlat
        startOrderSimulation(backendResult.orderId || paymentResult.orderId);
        
        return {
          success: true,
          orderId: backendResult.orderId || paymentResult.orderId,
          trackingNumber: paymentResult.trackingNumber,
          confirmationCode: paymentResult.confirmationCode,
          totalAmount: paymentResult.totalAmount,
          paymentMethod: paymentResult.paymentMethod,
          transactionId: paymentResult.transactionId,
          estimatedReadyTime: paymentResult.estimatedReadyTime,
          message: backendResult.message || paymentResult.message
        };
      } else {
        throw new Error(backendResult.message || 'Sipariş oluşturulamadı');
      }

    } catch (error) {
      console.error('Ödeme işlemi hatası:', error);
      return {
        success: false,
        message: error.message || 'Ödeme sırasında bir hata oluştu',
        suggestions: [
          'Lütfen tekrar deneyiniz',
          'İnternet bağlantınızı kontrol edin',
          'Farklı ödeme yöntemi deneyin'
        ]
      };
    } finally {
      setIsLoading(false);
    }
  }, [cartItems, cartTotal, validateCart, clearCart, loadOrderHistory, startOrderSimulation]);

  const cancelOrder = useCallback(async (orderId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: 'Kullanıcı tarafından iptal edildi'
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Sipariş geçmişini yenile
        await loadOrderHistory();
        return { success: true, message: result.message || 'Sipariş iptal edildi' };
      } else {
        throw new Error(result.message || 'İptal işlemi başarısız');
      }
    } catch (error) {
      console.error('Sipariş iptal hatası:', error);
      return { success: false, message: error.message };
    }
  }, [loadOrderHistory]);

  const getOrderById = useCallback((orderId) => {
    return orderHistory.find(order => order.id === orderId);
  }, [orderHistory]);

  const getActiveOrders = useMemo(() => {
    return orderHistory.filter(order => 
      ['devam_ediyor', 'hazir'].includes(order.status)
    );
  }, [orderHistory]);

  const getCompletedOrders = useMemo(() => {
    return orderHistory.filter(order => 
      ['teslim_edildi', 'iptal_edildi'].includes(order.status)
    );
  }, [orderHistory]);

  // ✅ FIX: Memoized context value
  const value = useMemo(() => ({
    // Sepet işlemleri
    cartItems,
    cartCount,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    cartTotal,        // ✅ Değer olarak
    getCartTotal,     // ✅ Fonksiyon olarak (geriye uyumluluk)
    isInCart,
    validateCart,
    loadCartFromBackend,
    startOrderSimulation,
    requestNotificationPermission,
    // Loading durumu
    isLoading,
    
    // Satın alma işlemleri
    processPayment,
    
    // Sipariş yönetimi
    orderHistory,
    loadOrderHistory,
    updateOrderStatus,
    cancelOrder,
    getOrderById,
    getActiveOrders,
    getCompletedOrders
  }), [
    cartItems,
    cartCount,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    cartTotal,
    getCartTotal,
    isInCart,
    validateCart,
    loadCartFromBackend,
    startOrderSimulation,
    requestNotificationPermission,
    isLoading,
    processPayment,
    orderHistory,
    loadOrderHistory,
    updateOrderStatus,
    cancelOrder,
    getOrderById,
    getActiveOrders,
    getCompletedOrders
  ]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};