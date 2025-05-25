import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaMapMarkerAlt, FaCalendarAlt, FaClock, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaSearch, FaFilter, FaReceipt, FaSpinner } from 'react-icons/fa';
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

  // Navigation handler functions
  const navigateToProfile = () => {
    navigate('/profile');
  };

  const navigateToOrders = () => {
    navigate('/orders');
  };

  // Sipariş durumlarına göre renk ve ikon belirleme
  const statusConfig = {
    'devam_ediyor': { color: '#ffc107', icon: <FaHourglassHalf />, text: 'Devam Ediyor' },
    'teslim_edildi': { color: '#28a745', icon: <FaCheckCircle />, text: 'Teslim Edildi' },
    'iptal_edildi': { color: '#dc3545', icon: <FaTimesCircle />, text: 'İptal Edildi' },
    'hazir': { color: '#17a2b8', icon: <FaCheckCircle />, text: 'Hazır' }
  };

  // Backend'den siparişleri getir - GELİŞTİRİLMİŞ HATA YÖNETİMİ
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

    // Önce backend'in çalışıp çalışmadığını kontrol et
    console.log('🔄 Backend bağlantısı kontrol ediliyor...');
    
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? '' // Production'da aynı domain
      : 'http://localhost:5051'; // Backend'inizin gerçek portu
    
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
    console.log('📡 Response URL:', response.url);
    console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));

    // İlk olarak response durumunu kontrol et
    if (!response.ok) {
      if (response.status === 401) {
        console.log('❌ 401 Unauthorized - Token geçersiz');
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      
      if (response.status === 404) {
        console.log('❌ 404 - API endpoint bulunamadı');
        throw new Error('API endpoint bulunamadı. Backend server\'ın çalıştığından emin olun.');
      }
      
      if (response.status === 500) {
        console.log('❌ 500 - Server hatası');
        throw new Error('Sunucu hatası oluştu. Backend loglarını kontrol edin.');
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Content-Type kontrolü
    const contentType = response.headers.get('content-type');
    console.log('📦 Content-Type:', contentType);
    
    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ Beklenmeyen content-type:', contentType);
      
      // HTML response'u text olarak oku ve logla
      const textResponse = await response.text();
      console.error('❌ HTML Response:', textResponse.substring(0, 500) + '...');
      
      // Eğer React app HTML'i dönüyorsa
      if (textResponse.includes('<!DOCTYPE html>')) {
        throw new Error(`
          ❌ Backend API erişilemez durumda!
          
          Olası sebepler:
          1. Backend server çalışmıyor
          2. package.json'da proxy ayarı yanlış
          3. API endpoint'i hatalı: ${apiUrl}
          
          Çözüm:
          1. Backend server'ı başlatın
          2. package.json'a "proxy": "http://localhost:BACKEND_PORT" ekleyin
          3. Backend'de /api/orders/my-orders endpoint'ini kontrol edin
        `);
      }
      
      throw new Error('Sunucudan beklenmeyen yanıt formatı (HTML). API endpoint\'i kontrol edin.');
    }

    // JSON parse et
    let data;
    try {
      const responseText = await response.text();
      console.log('📦 Raw Response:', responseText.substring(0, 200) + '...');
      
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON Parse hatası:', parseError);
      throw new Error('Sunucu yanıtı JSON formatında değil');
    }
    
    if (data.success) {
      console.log('✅ Siparişler başarıyla getirildi:', data.orders);
      setOrders(data.orders || []);
      setFilteredOrders(data.orders || []);
      setError(null);
    } else {
      throw new Error(data.message || 'Siparişler getirilemedi');
    }
  } catch (err) {
    console.error('❌ Sipariş getirme hatası:', err);
    
    // Hata tipine göre kullanıcı dostu mesajlar
    let userMessage = 'Siparişler yüklenirken hata oluştu';
    
    if (err.message.includes('fetch')) {
      userMessage = 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.';
    } else if (err.message.includes('JSON')) {
      userMessage = 'Sunucudan geçersiz yanıt alındı. Lütfen tekrar deneyin.';
    } else if (err.message.includes('API endpoint')) {
      userMessage = 'Backend API servisi bulunamadı. Sistem yöneticisiyle iletişime geçin.';
    } else if (err.message.includes('Backend API erişilemez')) {
      userMessage = 'Backend servisi çalışmıyor. Lütfen sistem yöneticisiyle iletişime geçin.';
    } else {
      userMessage = err.message;
    }
    
    setError(userMessage);
    
    // Fallback: localStorage'dan son siparişi kontrol et (eğer varsa)
    const lastOrder = localStorage.getItem('lastOrder');
    if (lastOrder && orders.length === 0) {
      try {
        const parsedOrder = JSON.parse(lastOrder);
        console.log('📱 Cached order kullanılıyor:', parsedOrder);
        setOrders([parsedOrder]);
        setFilteredOrders([parsedOrder]);
      } catch (parseError) {
        console.error('Cached order parse error:', parseError);
      }
    }
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
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
        <button 
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.2rem',
            cursor: 'pointer',
            color: '#333'
          }}
        >
          <FaChevronLeft />
        </button>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={testApiConnection}
            style={{
              background: 'none',
              border: '1px solid #17a2b8',
              color: '#17a2b8',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            API Test
          </button>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              background: 'none',
              border: '1px solid #ddd',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              opacity: refreshing ? 0.6 : 1
            }}
          >
            {refreshing ? <FaSpinner className="fa-spin" /> : 'Yenile'}
          </button>
        </div>
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
              filteredOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="trendyol-order-card"
                  onClick={() => handleOrderClick(order)}
                >
                  <div className="trendyol-order-top">
                    <div className="trendyol-order-restaurant">
                      <h3>Restoran</h3>
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
                    {selectedOrder.items && selectedOrder.items.map((item, index) => (
                      <tr key={index}>
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
              
              {selectedOrder.status === 'teslim_edildi' && (
                <button 
                  className="trendyol-primary-button"
                  onClick={() => {
                    // Tekrar sipariş verme işlemi
                    navigate('/packages');
                  }}
                >
                  Tekrar Sipariş Ver
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyOrders;