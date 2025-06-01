import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaMapMarkerAlt, FaCalendarAlt, FaClock, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaSearch, FaFilter, FaReceipt, FaSpinner ,FaDirections, FaStar,
  FaRegStar, FaStarHalfAlt, FaComment} from 'react-icons/fa';
import './MyOrders.css';

function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  // Yorum modalı state'leri
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: '',
    food_quality_rating: 5,
    service_rating: 5,
    value_rating: 5,
    is_anonymous: false
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Navigation handler functions
  const navigateToProfile = () => {
    navigate('/profile');
  };

  const navigateToOrders = () => {
    navigate('/orders');
  };
  const getDirections = (address, event) => {
    event.stopPropagation(); // Kartın tıklama olayını engellemek için
    
    if (!address) {
      alert('Adres bilgisi bulunamadı');
      return;
    }

    // Kullanıcının cihazını tespit et
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    const isAndroid = /android/i.test(userAgent);

    const encodedAddress = encodeURIComponent(address);

    if (isIOS) {
      // iOS için Apple Maps'i dene, yoksa Google Maps
      const appleUrl = `maps://maps.apple.com/?daddr=${encodedAddress}`;
      const googleUrl = `https://maps.google.com/maps?daddr=${encodedAddress}`;
      
      // Apple Maps'i aç, başarısız olursa Google Maps'e yönlendir
      window.location.href = appleUrl;
      setTimeout(() => {
        window.open(googleUrl, '_blank');
      }, 1500);
    } else if (isAndroid) {
      // Android için Google Maps uygulamasını dene
      const googleAppUrl = `google.navigation:q=${encodedAddress}`;
      const googleWebUrl = `https://maps.google.com/maps?daddr=${encodedAddress}`;
      
      try {
        window.location.href = googleAppUrl;
      } catch (e) {
        window.open(googleWebUrl, '_blank');
      }
    } else {
      // Desktop veya diğer cihazlar için web tarayıcısında Google Maps
      const googleWebUrl = `https://maps.google.com/maps?daddr=${encodedAddress}`;
      window.open(googleWebUrl, '_blank');
    }
  };
  // Sipariş durumlarına göre renk ve ikon belirleme
  const statusConfig = {
    'devam_ediyor': { color: '#ffc107', icon: <FaHourglassHalf />, text: 'Devam Ediyor' },
    'teslim_edildi': { color: '#28a745', icon: <FaCheckCircle />, text: 'Teslim Edildi' },
    'iptal_edildi': { color: '#dc3545', icon: <FaTimesCircle />, text: 'İptal Edildi' },
    'hazir': { color: '#17a2b8', icon: <FaCheckCircle />, text: 'Hazır' }
  };
  

  // Yıldız gösterimi
  const renderStars = (rating, onRatingChange = null) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span 
          key={i} 
          style={{ 
            color: i <= rating ? '#ffc107' : '#dee2e6',
            cursor: onRatingChange ? 'pointer' : 'default',
            fontSize: '1.2rem'
          }}
          onClick={() => onRatingChange && onRatingChange(i)}
        >
          <FaStar />
        </span>
      );
    }
    return stars;
  };

// Backend'den siparişleri getir - DÜZELTİLMİŞ VERSİYON
const fetchOrders = async (showLoader = true) => {
  try {
    if (showLoader) setLoading(true);
    if (!showLoader) setRefreshing(true);
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ Token bulunamadı, login sayfasına yönlendiriliyor');
      navigate('/login');
      return;
    }

    console.log('🔄 Backend bağlantısı kontrol ediliyor...');
    
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? '' 
      : 'http://localhost:5051';
    
    const apiUrl = `${baseUrl}/api/orders/my-orders`;
    console.log('📡 API URL:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Response Status:', response.status);

    if (!response.ok) {
      if (response.status === 401) {
        console.log('❌ 401 Unauthorized - Token geçersiz');
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Sunucudan beklenmeyen yanıt formatı');
    }

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Backend response:', data);
      console.log('🔍 İlk sipariş raw data:', JSON.stringify(data.orders[0], null, 2));
      
      // Backend'den gelen veriyi frontend formatına çevir - SELLER_ID DÜZELTİLDİ
const formattedOrders = (data.orders || []).map(order => {
  
  // Backend'den gelen farklı ID formatlarını kontrol et
  let orderId = null;
  
  // Tüm olası order ID kaynaklarını kontrol et
  if (order.order_id) {
    orderId = order.order_id;
  } else if (order.orderId) {
    orderId = order.orderId;
  } else if (order.id) {
    orderId = order.id;
  }

  // Backend'den gelen farklı seller_id formatlarını kontrol et
  let sellerId = null;
  
  // Tüm olası seller_id kaynaklarını kontrol et
  if (order.seller_id) {
    sellerId = order.seller_id;
  } else if (order.sellerId) {
    sellerId = order.sellerId;
  } else if (order.seller && order.seller.seller_id) {
    sellerId = order.seller.seller_id;
  }

  // Debugging için order yapısını logla
  console.log('🔍 Order mapping debug:', {
    backendOrder: {
      order_id: order.order_id,
      orderId: order.orderId,
      id: order.id,
      seller_id: order.seller_id,
      sellerId: order.sellerId
    },
    mappedValues: {
      finalOrderId: orderId,
      finalSellerId: sellerId
    }
  });

  // Order ID bulunamadıysa uyarı ver
  if (!orderId) {
    console.error('❌ ORDER ID BULUNAMADI - Order yapısı:', {
      orderKeys: Object.keys(order),
      order: order
    });
  }

  // Seller ID bulunamadıysa uyarı ver
  if (!sellerId) {
    console.error('❌ SELLER ID BULUNAMADI - Order yapısı:', {
      orderKeys: Object.keys(order),
      sellerStructure: order.seller
    });
  }
  
  return {
    id: orderId, // ✅ Düzeltilmiş order ID mapping
    seller_id: sellerId, // ✅ Düzeltilmiş seller_id mapping
    storeName: order.seller || 
               order.sellerName || 
               order.seller_name ||
               (order.seller && order.seller.business_name) || 
               'İş Yeri Adı Belirtilmemiş',
    productName: order.orderName || 
                 order.productName || 
                 (order.items && order.items.length > 0 ? 
                  order.items.map(item => item.packageName || item.name).join(', ') : 'Ürün Adı Yok'),
    price: parseFloat(order.totalAmount || order.total_amount || order.price || 0),
    originalPrice: parseFloat(order.originalPrice || order.totalAmount || order.total_amount || order.price || 0),
    orderDate: order.orderDate || order.createdAt || new Date().toISOString(),
    pickupDate: order.pickupDate || order.orderDate || order.createdAt || new Date().toISOString(),
    status: order.status === 'yeni' ? 'devam_ediyor' : order.status,
    address: order.address || 
             order.pickupAddress ||
             (order.seller && order.seller.address) || 
             'Adres bilgisi yok',
    confirmationCode: order.confirmationCode,
    trackingNumber: order.orderNumber || `SPY${(orderId || '').toString().padStart(8, '0')}`,
    storeImage: order.storeImage || '/default-store.png',
    items: order.items || [{ 
      name: order.orderName || order.productName || 'Ürün', 
      quantity: 1, 
      price: order.totalAmount || order.total_amount || order.price || 0 
    }],
    hasReview: order.hasReview || false,
    package_id: order.package_id || (order.items && order.items[0] && order.items[0].packageId)
  };
});
      
console.log('🔄 Formatlanmış siparişler kontrolü:', formattedOrders.map(o => ({
  id: o.id,
  seller_id: o.seller_id,
  storeName: o.storeName,
  hasValidIds: !!(o.id && o.seller_id)
})));
const validOrders = formattedOrders.filter(order => {
  if (!order.id || !order.seller_id) {
    console.warn('⚠️ Eksik ID\'li sipariş filtrelendi:', {
      id: order.id,
      seller_id: order.seller_id,
      storeName: order.storeName
    });
    return false;
  }
  return true;
});

console.log('✅ Geçerli siparişler:', validOrders.length, '/', formattedOrders.length);

      
      setOrders(formattedOrders);
      setFilteredOrders(formattedOrders);
      setError(null);
    } else {
      throw new Error(data.message || 'Siparişler getirilemedi');
    }
  } catch (err) {
    console.error('❌ Sipariş getirme hatası:', err);
    setError('Siparişler yüklenirken hata oluştu: ' + err.message);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};
  // Yorum gönderme
// Yorum gönderme - GÜVENLİ VERSİYON
const submitReview = async () => {
  if (!reviewOrder) {
    console.error('❌ Review order bulunamadı');
    alert('Sipariş bilgisi bulunamadı. Lütfen sayfayı yenileyin.');
    return;
  }

  try {
    setSubmittingReview(true);
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
      navigate('/login');
      return;
    }

    const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5051';
    
    // Seller ID'yi farklı yollardan al
    const sellerId = reviewOrder.seller_id || reviewOrder.sellerId;
    
    console.log('🔍 Review için detaylı seller bilgileri:', {
      'reviewOrder.seller_id': reviewOrder.seller_id,
      'reviewOrder.sellerId': reviewOrder.sellerId,
      'sellerId': sellerId,
      'reviewOrder.id': reviewOrder.id,
      'reviewOrder keys': Object.keys(reviewOrder),
      'reviewOrder': reviewOrder
    });
    
    // Seller ID kontrolü - detaylı hata mesajı
    if (!sellerId) {
      const errorMessage = `Satıcı bilgisi bulunamadı.
        
        Sipariş Detayları:
        - Order ID: ${reviewOrder.id || 'Bilinmiyor'}
        - Store Name: ${reviewOrder.storeName || 'Bilinmiyor'}
        - Seller ID: ${reviewOrder.seller_id || 'undefined'}
        - Seller ID Alt: ${reviewOrder.sellerId || 'undefined'}
        
        Bu sorun genellikle backend'den gelen veri yapısındaki eksiklikten kaynaklanır.
        Lütfen sayfayı yenileyin veya destek ekibiyle iletişime geçin.`;
      
      console.error('❌ Seller ID bulunamadı:', {
        orderStructure: reviewOrder,
        availableKeys: Object.keys(reviewOrder)
      });
      
      alert(errorMessage);
      return;
    }

    // Backend'e gönderilecek veri - EKSİK ALANLAR EKLENDİ
    const reviewPayload = {
      seller_id: parseInt(sellerId), // ✅ Integer'a çevir
      rating: parseInt(reviewData.rating),
      order_id: reviewOrder.id,
      package_id: reviewOrder.package_id,
      overall_rating: parseInt(reviewData.rating),
      comment: reviewData.comment || '', // ✅ Boş string varsayılan
      food_quality_rating: parseInt(reviewData.food_quality_rating),
      service_rating: parseInt(reviewData.service_rating),
      value_rating: parseInt(reviewData.value_rating),
      is_anonymous: Boolean(reviewData.is_anonymous)
    };

    // Payload'ı konsola yazdır - DEBUG
    console.log('📤 Review payload gönderiliyor:', reviewPayload);
    
    // Kritik alanları tekrar kontrol et
    if (!reviewPayload.seller_id || !reviewPayload.rating || !reviewPayload.order_id) {
      console.error('❌ Kritik alanlar eksik:', {
        seller_id: reviewPayload.seller_id,
        rating: reviewPayload.rating,
        order_id: reviewPayload.order_id
      });
      alert('Gerekli bilgiler eksik. Lütfen sayfayı yenileyin.');
      return;
    }
    
    console.log('📡 Review API çağrısı yapılıyor...');
    
    const response = await fetch(`${baseUrl}/api/reviews/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewPayload)
    });

    console.log('📡 Review Response Status:', response.status);
    console.log('📡 Review Response Headers:', Object.fromEntries(response.headers.entries()));

    // Response kontrolü
    if (!response.ok) {
      if (response.status === 401) {
        alert('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
        navigate('/login');
        return;
      } else if (response.status === 400) {
        throw new Error('Gönderdiğiniz bilgiler eksik veya hatalı.');
      } else if (response.status === 404) {
        throw new Error('Yorum servisi bulunamadı. Backend çalışıyor mu kontrol edin.');
      } else if (response.status === 500) {
        throw new Error('Sunucu hatası oluştu. Lütfen tekrar deneyin.');
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    // Content-Type kontrolü
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ Beklenmeyen content-type:', contentType);
      throw new Error('Sunucudan beklenmeyen yanıt formatı alındı.');
    }

    // Response'u parse et
    const data = await response.json();
    console.log('📡 Review Response Data:', data);
    
    if (data.success) {
      console.log('✅ Yorum başarıyla gönderildi:', data);
      
      // Siparişleri güncelle
      const updatedOrders = orders.map(order => 
        order.id === reviewOrder.id 
          ? { ...order, hasReview: true }
          : order
      );
      setOrders(updatedOrders);
      setFilteredOrders(updatedOrders);
      
      // Modal'ı kapat ve verileri sıfırla
      setShowReviewModal(false);
      setReviewOrder(null);
      setReviewData({
        rating: 5,
        comment: '',
        food_quality_rating: 5,
        service_rating: 5,
        value_rating: 5,
        is_anonymous: false
      });
      
      alert('Yorumunuz başarıyla gönderildi! Teşekkür ederiz.');
    } else {
      console.error('❌ Backend hatası:', data);
      throw new Error(data.message || data.error || 'Yorum gönderilirken bilinmeyen hata oluştu');
    }
  } catch (error) {
    console.error('❌ Yorum gönderme hatası:', error);
    
    // Kullanıcı dostu hata mesajları
    let userMessage = 'Yorum gönderilirken hata oluştu.';
    
    if (error.message.includes('fetch')) {
      userMessage = 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.';
    } else if (error.message.includes('JSON')) {
      userMessage = 'Sunucudan geçersiz yanıt alındı. Lütfen tekrar deneyin.';
    } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      userMessage = 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
    } else {
      userMessage = error.message;
    }
    
    alert(userMessage);
  } finally {
    setSubmittingReview(false);
  }
};
    // Yorum modalını aç
  const openReviewModal = (order) => {
    setReviewOrder(order);
    setShowReviewModal(true);
  };
  // Component mount edildiğinde siparişleri getir
  useEffect(() => {
    fetchOrders(true);
    
    // URL'den success parametresi varsa başarı mesajı göster
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      // Başarı mesajı için notification sistemi kullanabilirsiniz
      console.log('✅ Siparişiniz başarıyla oluşturuldu!');
      
      // URL'yi temizle
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // 2 saniye sonra siparişleri yenile (yeni sipariş görünsün diye)
      setTimeout(() => {
        fetchOrders(false);
      }, 2000);
    }
  }, [navigate]);

  // Siparişleri filtreleme
  const filterOrders = (search, date, status) => {
    let filtered = [...orders];
    
    // Arama filtresi
    if (search) {
      filtered = filtered.filter(order => 
        order.storeName?.toLowerCase().includes(search.toLowerCase()) || 
        order.productName?.toLowerCase().includes(search.toLowerCase()));
    }
    
    // Tarih filtresi
    if (date) {
      const filterDate = new Date(date).toDateString();
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate).toDateString();
        return orderDate === filterDate;
      });
    }
    
    // Durum filtresi
    if (status) {
      filtered = filtered.filter(order => order.status === status);
    }
    
    setFilteredOrders(filtered);
  };

  // Arama veya filtreleme değiştiğinde
  useEffect(() => {
    filterOrders(searchTerm, dateFilter, statusFilter);
  }, [searchTerm, dateFilter, statusFilter, orders]);

  // Sipariş detayını gösterme
  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  // Tarih formatını düzenleme
  const formatDate = (dateString) => {
    if (!dateString) return 'Tarih bilgisi yok';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
  };

  // Tarih formatını kısa düzenleme (sadece gün/ay/yıl)
  const formatShortDate = (dateString) => {
    if (!dateString) return 'Tarih bilgisi yok';
    const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
  };

  // Filtreleri temizleme
  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter('');
    setStatusFilter('');
    setShowFilters(false);
  };

  // Sipariş iptal etme işlemi - Backend'e istek gönder - GELİŞTİRİLMİŞ
  const cancelOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5051';
      const response = await fetch(`${baseUrl}/api/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Kullanıcı tarafından iptal edildi'
        })
      });

      // Content-Type kontrolü
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Sunucudan beklenmeyen yanıt formatı');
      }

      const data = await response.json();
      
      if (data.success) {
        // Local state'i güncelle
        const updatedOrders = orders.map(order => {
          if (order.id === orderId) {
            return {...order, status: 'iptal_edildi'};
          }
          return order;
        });
        
        setOrders(updatedOrders);
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({...selectedOrder, status: 'iptal_edildi'});
        }
        
        alert('Siparişiniz başarıyla iptal edildi.');
      } else {
        throw new Error(data.message || 'İptal işlemi başarısız');
      }
    } catch (error) {
      console.error('❌ Sipariş iptal hatası:', error);
      alert('Sipariş iptal edilirken hata oluştu: ' + error.message);
    }
  };

  // Durum rengi ve ikonu belirleme
  const getStatusInfo = (status) => {
    return statusConfig[status] || { color: '#999', icon: null, text: 'Bilinmiyor' };
  };

  // Sipariş durum ikonunu getir
  const getStatusIcon = (status) => {
    switch(status) {
      case 'teslim_edildi':
        return <div className="status-icon delivered"><FaCheckCircle /></div>;
      case 'iptal_edildi':
        return <div className="status-icon cancelled"><FaTimesCircle /></div>;
      case 'devam_ediyor':
        return <div className="status-icon in-progress"><FaHourglassHalf /></div>;
      case 'hazir':
        return <div className="status-icon ready"><FaCheckCircle /></div>;
      default:
        return null;
    }
  };

  // Yenile butonu
  const handleRefresh = () => {
    fetchOrders(false);
  };

  // API durumunu test etme fonksiyonu
  const testApiConnection = async () => {
    try {
      console.log('🧪 API bağlantısı test ediliyor...');
      const response = await fetch('/api/orders/my-orders', {
        method: 'HEAD', // Sadece header bilgilerini al
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      console.log('🧪 Test Response Status:', response.status);
      console.log('🧪 Test Response Headers:', [...response.headers.entries()]);
      
      if (response.ok) {
        console.log('✅ API bağlantısı başarılı');
      } else {
        console.log('❌ API bağlantısı başarısız:', response.status);
      }
    } catch (error) {
      console.log('❌ API test hatası:', error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="trendyol-orders-container">
        <div className="trendyol-content">
          <div className="trendyol-orders-content">
            <h1 className="trendyol-page-title">Siparişlerim</h1>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '200px',
              flexDirection: 'column',
              color: '#666'
            }}>
              <FaSpinner style={{ fontSize: '2rem', marginBottom: '1rem' }} className="fa-spin" />
              <p>Siparişleriniz yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="trendyol-orders-container">
      {/* Header bar */}
      <div className="header-bar" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1rem',
        borderBottom: '1px solid #eee',
        backgroundColor: '#fff'
      }}>

        

      </div>

      {/* Main content area */}
      <div className="trendyol-content">
        <div className="trendyol-orders-content">
          <h1 className="trendyol-page-title">Siparişlerim</h1>
          
          {/* Search and Filter */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Sipariş ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  background: showFilters ? '#ff6000' : 'none',
                  border: '1px solid #ff6000',
                  color: showFilters ? 'white' : '#ff6000',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                <FaFilter /> Filtrele
              </button>
            </div>

            {showFilters && (
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                marginBottom: '1rem'
              }}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="">Tüm Durumlar</option>
                  <option value="devam_ediyor">Devam Ediyor</option>
                  <option value="hazir">Hazır</option>
                  <option value="teslim_edildi">Teslim Edildi</option>
                  <option value="iptal_edildi">İptal Edildi</option>
                </select>
                
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                />
                
                <button
                  onClick={clearFilters}
                  style={{
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Temizle
                </button>
              </div>
            )}
          </div>

          {/* Error state */}
          {error && (
            <div style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '1rem',
              borderRadius: '4px',
              marginBottom: '1rem',
              border: '1px solid #f5c6cb'
            }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>⚠️ Hata:</strong> {error}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => fetchOrders(true)}
                  style={{
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Tekrar Dene
                </button>
                <button
                  onClick={testApiConnection}
                  style={{
                    background: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Bağlantı Test Et
                </button>
              </div>
            </div>
          )}
          
          {/* Orders list */}
          <div className="trendyol-orders-list">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order, index) => (
                <div 
                  key={`order-${order.id || index}`} 
                  className="trendyol-order-card"
                  onClick={() => handleOrderClick(order)}
                >
                  <div className="trendyol-order-top">
                    <div className="trendyol-order-restaurant">
                      
                      <p>{order.storeName}</p>
                    </div>
                    <div className="trendyol-order-date">
                      <h3>Sipariş Tarihi</h3>
                      <p>{formatShortDate(order.orderDate)}</p>
                    </div>
                    <div className="trendyol-order-price">
                      <h3>Sipariş Tutarı</h3>
                      <p className="price">{order.price?.toFixed(2)} TL</p>
                    </div>
                    <div className="trendyol-order-status">
                      {getStatusIcon(order.status)}
                    </div>
                    <div className="trendyol-order-actions">
                      <button className="trendyol-detail-button">
                        Sipariş Detayı
                      </button>
                    </div>
                  </div>
                  
                  <div className="trendyol-order-details">
                    <div className="order-product-name">
                      {order.status === 'iptal_edildi' && (
                        <div className="cancelled-label">
                          <FaTimesCircle /> Sipariş İptal Edildi
                        </div>
                      )}
                      {order.status === 'teslim_edildi' && (
                        <div className="delivered-label">
                          <FaCheckCircle /> Sipariş Teslim Edildi
                        </div>
                      )}
                      {order.status === 'hazir' && (
                        <div className="ready-label">
                          <FaCheckCircle /> Sipariş Hazır - Alınmayı Bekliyor
                        </div>
                      )}
                      {order.status === 'devam_ediyor' && (
                        <div className="active-label">
                          <FaHourglassHalf /> Sipariş Hazırlanıyor
                        </div>
                      )}
                      <p className="product-description">{order.productName}</p>
                    </div>
                                        {/* Yorum butonu - Sadece teslim edilmiş siparişler için */}
                    {order.status === 'teslim_edildi' && (
                      <div className="review-section" style={{ marginTop: '0.5rem' }}>
                        {!order.hasReview ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openReviewModal(order);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              background: '#ffc107',
                              color: '#212529',
                              border: 'none',
                              padding: '0.5rem 1rem',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              fontWeight: '500'
                            }}
                          >
                            <FaStar />
                            Yorum Yap & Puanla
                          </button>
                        ) : (
                          <div style={{ 
                            color: '#28a745', 
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <FaCheckCircle />
                            Yorumunuz alındı
                          </div>
                        )}
                      </div>
                    )}
                    {/* Yol Tarifi Butonu - Sadece hazır ve devam eden siparişler için */}
                    {(order.status === 'hazir' || order.status === 'devam_ediyor') && order.address && (
                      <div className="order-directions">
                        <button
                          onClick={(e) => getDirections(order.address, e)}
                          className="directions-button"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            marginTop: '0.5rem'
                          }}
                        >
                          <FaDirections />
                          Yol Tarifi Al
                        </button>
                        <div style={{ 
                          fontSize: '0.8rem', 
                          color: '#666', 
                          marginTop: '0.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <FaMapMarkerAlt />
                          {order.address?.length > 50 ? 
                            order.address.substring(0, 50) + '...' : 
                            order.address
                          }
                        </div>
                      </div>
                    )}                    
                  </div>
                </div>
              ))
            ) : (
              <div className="no-orders" style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#666'
              }}>
                <FaReceipt style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }} />
                <h3>Henüz siparişiniz bulunmuyor</h3>
                <p>İlk siparişinizi vermek için alışverişe başlayın!</p>
                <button
                  onClick={() => navigate('/packages')}
                  style={{
                    marginTop: '1rem',
                    background: '#ff6000',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Alışverişe Başla
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {showReviewModal && reviewOrder && (
        <div 
          className="order-detail-overlay" 
          onClick={() => setShowReviewModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000         }}
        >
          <div 
            className="order-detail-modal" 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '2rem',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                Siparişinizi Değerlendirin
              </h2>
              <p style={{ color: '#666', margin: 0 }}>
                {reviewOrder.storeName} - {reviewOrder.productName}
              </p>
            </div>

            {/* Genel Puan */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Genel Puan:
              </label>
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem' }}>
                {renderStars(reviewData.rating, (rating) => 
                  setReviewData({...reviewData, rating})
                )}
              </div>
            </div>

            {/* Yemek Kalitesi */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Yemek Kalitesi:
              </label>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {renderStars(reviewData.food_quality_rating, (rating) => 
                  setReviewData({...reviewData, food_quality_rating: rating})
                )}
              </div>
            </div>

            {/* Hizmet */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Hizmet:
              </label>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {renderStars(reviewData.service_rating, (rating) => 
                  setReviewData({...reviewData, service_rating: rating})
                )}
              </div>
            </div>

            {/* Fiyat-Performans */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Fiyat-Performans:
              </label>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {renderStars(reviewData.value_rating, (rating) => 
                  setReviewData({...reviewData, value_rating: rating})
                )}
              </div>
            </div>

            {/* Yorum */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Yorumunuz:
              </label>
              <textarea
                value={reviewData.comment}
                onChange={(e) => setReviewData({...reviewData, comment: e.target.value})}
                placeholder="Deneyiminizi paylaşın..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Anonim Seçeneği */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={reviewData.is_anonymous}
                  onChange={(e) => setReviewData({...reviewData, is_anonymous: e.target.checked})}
                />
                Anonim olarak gönder
              </label>
            </div>

            {/* Butonlar */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowReviewModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                İptal
              </button>
              <button
                onClick={submitReview}
                disabled={submittingReview}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '4px',
                  background: '#ffc107',
                  color: '#212529',
                  cursor: submittingReview ? 'not-allowed' : 'pointer',
                  opacity: submittingReview ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {submittingReview && <FaSpinner className="fa-spin" />}
                Gönder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sipariş detay modalı */}
      {showOrderDetail && selectedOrder && (
        <div className="order-detail-overlay" onClick={() => setShowOrderDetail(false)}>
          <div className="trendyol-order-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sipariş Detayı</h2>
              <button className="close-modal-button" onClick={() => setShowOrderDetail(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="trendyol-order-detail-status" style={{ color: getStatusInfo(selectedOrder.status).color }}>
                {getStatusInfo(selectedOrder.status).icon}
                <span>{getStatusInfo(selectedOrder.status).text}</span>
              </div>
              
              <div className="trendyol-order-detail-store">
                <img src={selectedOrder.storeImage} alt={selectedOrder.storeName} />
                <div>
                  <h3>{selectedOrder.storeName}</h3>
                  <p>{selectedOrder.productName}</p>
                </div>
              </div>
              
              <div className="trendyol-order-detail-info">
                <div className="detail-row">
                  <FaReceipt />
                  <div>
                    <strong>Sipariş No:</strong>
                    <p>#{selectedOrder.id}</p>
                  </div>
                </div>
                
                {selectedOrder.trackingNumber && (
                  <div className="detail-row">
                    <FaReceipt />
                    <div>
                      <strong>Takip No:</strong>
                      <p>{selectedOrder.trackingNumber}</p>
                    </div>
                  </div>
                )}
                
                <div className="detail-row">
                  <FaCalendarAlt />
                  <div>
                    <strong>Sipariş Tarihi:</strong>
                    <p>{formatDate(selectedOrder.orderDate)}</p>
                  </div>
                </div>
                
                <div className="detail-row">
                  <FaClock />
                  <div>
                    <strong>Teslim Alma Tarihi:</strong>
                    <p>{formatDate(selectedOrder.pickupDate)}</p>
                  </div>
                </div>
                
                <div className="detail-row">
                  <FaMapMarkerAlt />
                  <div>
                    <strong>Adres:</strong>
                    <p>{selectedOrder.address}</p>
                  </div>
                </div>

                {selectedOrder.confirmationCode && (
                  <div className="detail-row">
                    <FaCheckCircle />
                    <div>
                      <strong>Onay Kodu:</strong>
                      <p style={{ 
                        fontSize: '1.2rem', 
                        fontWeight: 'bold', 
                        color: '#28a745',
                        letterSpacing: '2px'
                      }}>
                        {selectedOrder.confirmationCode}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="trendyol-order-items">
                <h3>Sipariş İçeriği</h3>
                <table className="trendyol-items-table">
                  <thead>
                    <tr>
                      <th>Ürün</th>
                      <th>Adet</th>
                      <th>Fiyat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                      <tr key={`item-${idx}-${item.name || 'unnamed'}`}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>{item.price?.toFixed(2)} TL</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="trendyol-order-summary">
                {selectedOrder.originalPrice && selectedOrder.originalPrice > selectedOrder.price && (
                  <>
                    <div className="summary-row">
                      <span>Normal Fiyat:</span>
                      <span>{selectedOrder.originalPrice.toFixed(2)} TL</span>
                    </div>
                    <div className="summary-row discount">
                      <span>İndirim:</span>
                      <span>-{(selectedOrder.originalPrice - selectedOrder.price).toFixed(2)} TL</span>
                    </div>
                  </>
                )}
                <div className="summary-row total">
                  <span>Toplam:</span>
                  <span>{selectedOrder.price?.toFixed(2)} TL</span>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              {(selectedOrder.status === 'devam_ediyor' || selectedOrder.status === 'hazir') && (
                <button 
                  className="trendyol-cancel-order-button"
                  onClick={() => cancelOrder(selectedOrder.id)}
                >
                  Siparişi İptal Et
                </button>
              )}
              
              {selectedOrder.status === 'hazir' && (
                <button 
                  className="trendyol-primary-button"
                  onClick={() => {
                    // Google Maps'te konumu aç
                    const address = encodeURIComponent(selectedOrder.address);
                    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
                  }}
                >
                  Yol Tarifi Al
                </button>
              )}
              
              {/* {selectedOrder.status === 'teslim_edildi' && (
                <button 
                  className="trendyol-primary-button"
                  onClick={() => {
                    // Tekrar sipariş verme işlemi
                    navigate('/packages');
                  }}
                >
                  Tekrar Sipariş Ver
                </button>
              )} */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyOrders;