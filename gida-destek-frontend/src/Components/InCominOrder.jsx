import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaMapMarkerAlt,FaCalendarAlt, FaClock, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaSearch, FaFilter, 
  FaReceipt, FaSpinner,FaBell,FaUser,FaPhone,FaCheck,FaTimes,FaPlay,FaPause,FaEye,FaBoxOpen,FaSortAmountDown} from 'react-icons/fa';
import './ınComingOrder.css';


function IncomingOrders() {
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
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, price_high, price_low
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const getConfirmationCode = async () => {
    const res = await fetch('/api/generate-confirmation-code');
    const data = await res.json();
    return data.code;
  };

  // Sipariş durumlarına göre renk ve ikon belirleme (satıcı perspektifi)
  const statusConfig = {
    'yeni': { color: '#007bff', icon: <FaBell />, text: 'Yeni Sipariş',bgColor: '#e3f2fd',priority: 1
    },'onaylandi': { color: '#28a745', icon: <FaCheck />,text: 'Onaylandı',bgColor: '#e8f5e9',priority: 2
    },'hazirlaniyor': { color: '#ffc107', icon: <FaHourglassHalf />, text: 'Hazırlanıyor',bgColor: '#fff8e1',priority: 3
    },'hazir': { color: '#17a2b8', icon: <FaBoxOpen />, text: 'Hazır - Alınmayı Bekliyor',bgColor: '#e0f7fa',priority: 4
    },'teslim_edildi': { color: '#28a745', icon: <FaCheckCircle />, text: 'Teslim Edildi',bgColor: '#e8f5e9',priority: 5
    },'iptal_edildi': { color: '#dc3545', icon: <FaTimesCircle />, text: 'İptal Edildi',bgColor: '#ffebee',priority: 6
    },'reddedildi': { color: '#6c757d', icon: <FaTimes />,text: 'Reddedildi',bgColor: '#f5f5f5',priority: 7
    }
  };
// Backend'den gelen siparişleri getir
  const fetchIncomingOrders = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      if (!showLoader) setRefreshing(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ Token bulunamadı, login sayfasına yönlendiriliyor');
        navigate('/login');
        return;
      }
      console.log('🔄 Gelen siparişler getiriliyor...');
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? '' 
        : 'http://localhost:5051';
      
      const apiUrl = `${baseUrl}/api/orders/incoming-orders`; // Satıcıya gelen siparişler
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

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('❌ HTML Response:', textResponse.substring(0, 500));
        
        if (textResponse.includes('<!DOCTYPE html>')) {
          throw new Error('Backend API erişilemez durumda! Satıcı siparişleri endpoint\'i kontrol edin.');
        }
        
        throw new Error('Sunucudan beklenmeyen yanıt formatı');
      }

      let data;
      try {
        const responseText = await response.text();
        console.log('📦 Raw Response:', responseText.substring(0, 200));
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON Parse hatası:', parseError);
        throw new Error('Sunucu yanıtı JSON formatında değil');
      }
      
      if (data.success) {
        console.log('✅ Gelen siparişler başarıyla getirildi:', data.orders);
        setOrders(data.orders || []);
        setFilteredOrders(data.orders || []);
        
        // Yeni sipariş sayısını hesapla
        const newOrders = (data.orders || []).filter(order => order.status === 'yeni');
        setNewOrdersCount(newOrders.length);
        
        setError(null);
      } else {
        throw new Error(data.message || 'Gelen siparişler getirilemedi');
      }
    } catch (err) {
      console.error('❌ Gelen sipariş getirme hatası:', err);
      
      let userMessage = 'Gelen siparişler yüklenirken hata oluştu';
      
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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Component mount edildiğinde siparişleri getir
  useEffect(() => {
    fetchIncomingOrders(true);
    
    // 30 saniyede bir otomatik yenile (yeni siparişler için)
    const interval = setInterval(() => {
      fetchIncomingOrders(false);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [navigate]);

  // Siparişleri filtreleme ve sıralama
  const filterAndSortOrders = (search, date, status, sort) => {
    let filtered = [...orders];
    
    // Arama filtresi
    if (search) {
      filtered = filtered.filter(order => 
        order.customerName?.toLowerCase().includes(search.toLowerCase()) || 
        order.productName?.toLowerCase().includes(search.toLowerCase()) ||
        order.id?.toString().includes(search));
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
    
    // Sıralama
    filtered.sort((a, b) => {
      switch (sort) {
        case 'newest':
          return new Date(b.orderDate) - new Date(a.orderDate);
        case 'oldest':
          return new Date(a.orderDate) - new Date(b.orderDate);
        case 'price_high':
          return b.price - a.price;
        case 'price_low':
          return a.price - b.price;
        case 'priority':
          return statusConfig[a.status]?.priority - statusConfig[b.status]?.priority;
        default:
          return 0;
      }
    });
    
    setFilteredOrders(filtered);
  };

  // Arama veya filtreleme değiştiğinde
  useEffect(() => {
    filterAndSortOrders(searchTerm, dateFilter, statusFilter, sortBy);
  }, [searchTerm, dateFilter, statusFilter, sortBy, orders]);

  // Sipariş detayını gösterme
  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  // Sipariş durumunu güncelleme
  const updateOrderStatus = async (orderId, newStatus, reason = '') => {
    try {
      // Eğer teslim edildi durumuna geçiyorsak ve onay kodu kontrolü yapılmadıysa engelle
      if (newStatus === 'teslim_edildi' && !reason.includes('Doğru onay kodu ile teslim edildi')) {
        alert('❌ Güvenlik hatası: Teslim işlemi sadece doğru onay kodu ile yapılabilir!');
        return;
      }
      
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5051';
      
      const response = await fetch(`${baseUrl}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          reason: reason,
          updatedBy: 'seller',
          timestamp: new Date().toISOString() // Zaman damgası ekleyelim
        })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Sunucudan beklenmeyen yanıt formatı');
      }

      const data = await response.json();
      
      if (data.success) {
        // Local state'i güncelle
        const updatedOrders = orders.map(order => {
          if (order.id === orderId) {
            return {
              ...order, 
              status: newStatus, 
              lastUpdated: new Date().toISOString(),
              deliveryReason: reason // Teslim nedenini de saklayalım
            };
          }
          return order;
        });
        
        setOrders(updatedOrders);
        
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({
            ...selectedOrder, 
            status: newStatus, 
            lastUpdated: new Date().toISOString(),
            deliveryReason: reason
          });
        }
        
        // Başarı mesajı (teslim edildi durumu için özel mesaj)
        if (newStatus === 'teslim_edildi') {
          console.log(`✅ Sipariş #${orderId} başarıyla teslim edildi. ${reason}`);
        } else {
          const statusText = statusConfig[newStatus]?.text || newStatus;
          alert(`Sipariş durumu "${statusText}" olarak güncellendi.`);
        }
        
      } else {
        throw new Error(data.message || 'Durum güncelleme başarısız');
      }
    } catch (error) {
      console.error('❌ Sipariş durum güncelleme hatası:', error);
      alert('Sipariş durumu güncellenirken hata oluştu: ' + error.message);
    }
  };


  // Sipariş onaylama
// Mevcut acceptOrder fonksiyonunun yerine:
const acceptOrder = async (orderId) => {
  const estimatedTime = window.prompt('Tahmini hazırlanma süresi (dakika):', '15');
  if (estimatedTime) {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5051';
      
      const response = await fetch(`${baseUrl}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'onaylandi',
          reason: `Tahmini süre: ${estimatedTime} dakika`,
          updatedBy: 'seller'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const updatedOrders = orders.map(order => {
          if (order.id === orderId) {
            return data.order;
          }
          return order;
        });
        
        setOrders(updatedOrders);
        
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(data.order);
        }
        
        if (data.order.confirmationCode) {
          alert(`✅ Sipariş onaylandı!\n🔐 Müşteri onay kodu: ${data.order.confirmationCode}\n⏱️ Tahmini süre: ${estimatedTime} dakika\n\n⚠️ Bu kodu müşteriye bildirin!`);
        } else {
          alert(`✅ Sipariş onaylandı!\n⏱️ Tahmini süre: ${estimatedTime} dakika`);
        }
        
      } else {
        throw new Error(data.message || 'Sipariş onaylama başarısız');
      }
    } catch (error) {
      console.error('❌ Sipariş onaylama hatası:', error);
      alert('Sipariş onaylanırken hata oluştu: ' + error.message);
    }
  }
};
// deliverOrderSecure fonksiyonunu acceptOrder'dan sonra ekleyin:
const deliverOrderSecure = async (orderId) => {
  try {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      alert('❌ Sipariş bulunamadı!');
      return;
    }
    
    if (!order.confirmationCode) {
      alert('❌ Bu siparişte onay kodu bulunmuyor. Lütfen önce siparişi onaylayın.');
      return;
    }
    
    if (order.status !== 'hazir') {
      alert('❌ Bu sipariş henüz hazır durumda değil!');
      return;
    }
    
    const enteredCode = window.prompt(
      `🔐 Müşterinin onay kodunu girin:\n\n` +
      `📱 Müşteri bu kodu size söyleyecek.\n` +
      `⚠️ Kod 6 haneli olmalıdır.`
    );
    
    if (enteredCode === null) {
      return;
    }
    
    if (!enteredCode.trim()) {
      alert('❌ Lütfen onay kodunu girin!');
      return;
    }
    
    if (enteredCode.trim().length !== 6) {
      alert('❌ Onay kodu 6 haneli olmalıdır!');
      return;
    }
    
    const token = localStorage.getItem('token');
    const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5051';
    
    const response = await fetch(`${baseUrl}/api/orders/${orderId}/verify-delivery`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        enteredCode: enteredCode.trim().toUpperCase()
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      const updatedOrders = orders.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'teslim_edildi',
            deliveredAt: new Date().toISOString()
          };
        }
        return o;
      });
      
      setOrders(updatedOrders);
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          status: 'teslim_edildi',
          deliveredAt: new Date().toISOString()
        });
        setShowOrderDetail(false);
      }
      
      alert('✅ Sipariş başarıyla teslim edildi!\n🎉 Teşekkür ederiz.');
      
    } else {
      alert(`❌ ${data.message}\n\n🔑 Girilen kod: "${enteredCode}"\n💡 Müşteriden doğru kodu isteyiniz.`);
    }
    
  } catch (error) {
    console.error('❌ Teslim etme hatası:', error);
    alert('Teslim işlemi sırasında hata oluştu: ' + error.message);
  }
};

  // Sipariş reddetme
  const rejectOrder = (orderId) => {
    const reason = window.prompt('Ret nedeni:', 'Stok bulunmuyor');
    if (reason) {
      updateOrderStatus(orderId, 'reddedildi', reason);
    }
  };

  // Tarih formatını düzenleme
  const formatDate = (dateString) => {
    if (!dateString) return 'Tarih bilgisi yok';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return 'Tarih bilgisi yok';
    const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
  };

  // Filtreleri temizleme
  const clearFilters = () => {setSearchTerm('');setDateFilter('');setStatusFilter('');setSortBy('newest');setShowFilters(false);
  };

  // Durum rengi ve ikonu belirleme
  const getStatusInfo = (status) => {
    return statusConfig[status] || { color: '#999', icon: null, text: 'Bilinmiyor', bgColor: '#f5f5f5' };
  };

  // Yenile butonu
  const handleRefresh = () => {
    fetchIncomingOrders(false);
  };

  // Hızlı eylem butonları
  const getQuickActions = (order) => {
    switch (order.status) {
      case 'yeni':
        return (
          <div className="quick-actions">
            <button 
              className="quick-action-btn accept"
              onClick={(e) => {
                e.stopPropagation();
                acceptOrder(order.id);
              }}
            >
              <FaCheck /> Onayla
            </button>
            <button 
              className="quick-action-btn reject"
              onClick={(e) => {
                e.stopPropagation();
                rejectOrder(order.id);
              }}
            >
              <FaTimes /> Reddet
            </button>
          </div>
        );
      case 'onaylandi':
        return (
          <div className="quick-actions">
            <button 
              className="quick-action-btn start"
              onClick={(e) => {
                e.stopPropagation();
                updateOrderStatus(order.id, 'hazirlaniyor');
              }}
            >
              <FaPlay /> Hazırlamaya Başla
            </button>
          </div>
        );
      case 'hazirlaniyor':
        return (
          <div className="quick-actions">
            <button 
              className="quick-action-btn complete"
              onClick={(e) => {
                e.stopPropagation();
                updateOrderStatus(order.id, 'hazir');
              }}
            >
              <FaCheck /> Hazır
            </button>
          </div>
        );
        case 'hazir':
            return (
              <div className="quick-actions">
                <button 
                  className="quick-action-btn deliver"
                  onClick={(e) => {
                    e.stopPropagation();
                    deliverOrderSecure(order.id);
                  }}
                >
                  <FaCheckCircle /> Güvenli Teslim
                </button>
                
                {order.confirmationCode && (
                  <div className="confirmation-code-display ready">
                    <span className="code-label">🔐 Beklenen Kod:</span>
                    <span className="code-value highlighted">{order.confirmationCode}</span>
                  </div>
                )}
              </div>
            );
      default:
        return null;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="seller-orders-container">
        <div className="seller-content">
          <div className="seller-orders-content">
            <h1 className="seller-page-title">Gelen Siparişler</h1>
            <div className="loading-container">
              <FaSpinner className="fa-spin loading-spinner" />
              <p>Gelen siparişler yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="seller-orders-container">
      {/* Header bar */}
      <div className="header-bar">
        <button 
          onClick={() => navigate(-1)}
          className="back-button"
        >
          <FaChevronLeft />
        </button>
        
        <div className="header-title">
          <h1>Gelen Siparişler</h1>
          {newOrdersCount > 0 && (
            <span className="new-orders-badge">{newOrdersCount} Yeni</span>
          )}
        </div>
        
        <div className="header-actions">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="refresh-button"
          >
            {refreshing ? <FaSpinner className="fa-spin" /> : 'Yenile'}
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="seller-content">
        <div className="seller-orders-content">
          
          {/* Search, Filter and Sort */}
          <div className="controls-section">
            <div className="search-filter-row">
              <div className="search-input-container">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Müşteri adı, ürün veya sipariş no ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="control-buttons">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="priority">Öncelik Sırası</option>
                  <option value="newest">En Yeni</option>
                  <option value="oldest">En Eski</option>
                  <option value="price_high">Fiyat (Yüksek)</option>
                  <option value="price_low">Fiyat (Düşük)</option>
                </select>
                
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`filter-button ${showFilters ? 'active' : ''}`}
                >
                  <FaFilter /> Filtrele
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="filters-panel">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Tüm Durumlar</option>
                  <option value="yeni">Yeni Siparişler</option>
                  <option value="onaylandi">Onaylandı</option>
                  <option value="hazirlaniyor">Hazırlanıyor</option>
                  <option value="hazir">Hazır</option>
                  <option value="teslim_edildi">Teslim Edildi</option>
                  <option value="iptal_edildi">İptal Edildi</option>
                  <option value="reddedildi">Reddedildi</option>
                </select>
                
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="filter-date"
                />
                
                <button
                  onClick={clearFilters}
                  className="clear-filters-button"
                >
                  Temizle
                </button>
              </div>
            )}
          </div>

          {/* Error state */}
          {error && (
            <div className="error-container">
              <div className="error-message">
                <strong>⚠️ Hata:</strong> {error}
              </div>
              <div className="error-actions">
                <button
                  onClick={() => fetchIncomingOrders(true)}
                  className="retry-button"
                >
                  Tekrar Dene
                </button>
              </div>
            </div>
          )}
          
          {/* Orders list */}
          <div className="seller-orders-list">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                return (
                  <div 
                    key={order.id} 
                    className={`seller-order-card ${order.status}`}
                    onClick={() => handleOrderClick(order)}
                    style={{ borderLeft: `4px solid ${statusInfo.color}` }}
                  >
                    <div className="order-card-header">
                      <div className="order-basic-info">
                        <div className="order-id">
                          <strong>#{order.id}</strong>
                        </div>
                        <div className="order-customer">
                          <FaUser className="customer-icon" />
                          <span>{order.customerName}</span>
                          {order.customerPhone && (
                            <FaPhone 
                              className="phone-icon" 
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`tel:${order.customerPhone}`);
                              }}
                            />
                          )}
                        </div>
                      </div>
                      
                      <div className="order-status-info">
                        <div 
                          className="status-badge" 
                          style={{ 
                            backgroundColor: statusInfo.bgColor,
                            color: statusInfo.color 
                          }}
                        >
                          {statusInfo.icon}
                          <span>{statusInfo.text}</span>
                        </div>
                        
                        <div className="order-time">
                          <FaClock />
                          <span>{formatShortDate(order.orderDate)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="order-card-body">
                      <div className="order-product-info">
                        <h4>{order.productName}</h4>
                        <p className="order-description">{order.description}</p>
                        {order.specialRequests && (
                          <p className="special-requests">
                            <strong>Özel İstek:</strong> {order.specialRequests}
                          </p>
                        )}
                      </div>
                      
                      <div className="order-details-row">
                        <div className="order-price">
                          <span className="price-label">Tutar:</span>
                          <span className="price-value">{order.price?.toFixed(2)} TL</span>
                        </div>
                        
                        {order.estimatedTime && (
                          <div className="estimated-time">
                            <FaClock />
                            <span>{order.estimatedTime} dk</span>
                          </div>
                        )}
                        
                        {order.address && (
                          <div className="order-address">
                            <FaMapMarkerAlt />
                            <span>{order.address.substring(0, 50)}...</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="order-card-footer">
                      {getQuickActions(order)}
                      
                      <button className="view-detail-button">
                        <FaEye /> Detay Gör
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-orders">
                <FaReceipt className="no-orders-icon" />
                <h3>Henüz gelen sipariş bulunmuyor</h3>
                <p>Yeni siparişler geldiğinde burada görünecek.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sipariş detay modalı */}
      {showOrderDetail && selectedOrder && (
        <div className="order-detail-overlay" onClick={() => setShowOrderDetail(false)}>
          <div className="seller-order-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Sipariş Detayı - #{selectedOrder.id}</h2>
              <button className="close-modal-button" onClick={() => setShowOrderDetail(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="order-status-section">
                <div className="current-status" style={{ color: getStatusInfo(selectedOrder.status).color }}>
                  {getStatusInfo(selectedOrder.status).icon}
                  <span>{getStatusInfo(selectedOrder.status).text}</span>
                </div>
                
                <div className="status-timeline">
                  {/* Durum geçmişi buraya eklenebilir */}
                </div>
              </div>
              
              <div className="customer-info-section">
                <h3>Müşteri Bilgileri</h3>
                <div className="customer-details">
                  <div className="detail-row">
                    <FaUser />
                    <div>
                      <strong>Ad Soyad:</strong>
                      <p>{selectedOrder.customerName}</p>
                    </div>
                  </div>
                  
                  {selectedOrder.customerPhone && (
                    <div className="detail-row">
                      <FaPhone />
                      <div>
                        <strong>Telefon:</strong>
                        <p>
                          <a href={`tel:${selectedOrder.customerPhone}`}>
                            {selectedOrder.customerPhone}
                          </a>
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="detail-row">
                    <FaMapMarkerAlt />
                    <div>
                      <strong>Adres:</strong>
                      <p>{selectedOrder.address}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="order-info-section">
                <h3>Sipariş Bilgileri</h3>
                <div className="order-details">
                  <div className="detail-row">
                    <FaReceipt />
                    <div>
                      <strong>Sipariş Tarihi:</strong>
                      <p>{formatDate(selectedOrder.orderDate)}</p>
                    </div>
                  </div>
                  
                  {selectedOrder.pickupDate && (
                    <div className="detail-row">
                      <FaClock />
                      <div>
                        <strong>Teslim Alma Tarihi:</strong>
                        <p>{formatDate(selectedOrder.pickupDate)}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedOrder.confirmationCode && (
                    <div className="detail-row">
                      <FaCheckCircle />
                      <div>
                        <strong>Onay Kodu:</strong>
                        <p className="confirmation-code">{selectedOrder.confirmationCode}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="product-info-section">
                <h3>Ürün Detayları</h3>
                <div className="product-details">
                  <h4>{selectedOrder.productName}</h4>
                  <p>{selectedOrder.description}</p>
                  
                  {selectedOrder.specialRequests && (
                    <div className="special-requests-detail">
                      <strong>Özel İstekler:</strong>
                      <p>{selectedOrder.specialRequests}</p>
                    </div>
                  )}
                  
                  {selectedOrder.items && selectedOrder.items.length > 0 && (
                    <div className="order-items">
                      <h4>Sipariş İçeriği</h4>
                      <table className="items-table">
                        <thead>
                          <tr>
                            <th>Ürün</th>
                            <th>Adet</th>
                            <th>Fiyat</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items.map((item, index) => (
                            <tr key={index}>
                              <td>{item.name}</td>
                              <td>{item.name}</td>
                                                            <td>{item.quantity}</td>
                              <td>{item.price?.toFixed(2)} TL</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  <div className="price-summary">
                    <div className="total-price">
                      <strong>Toplam Tutar: {selectedOrder.price?.toFixed(2)} TL</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <div className="modal-actions">
                {selectedOrder.status === 'yeni' && (
                  <>
                    <button 
                      className="modal-action-btn accept-btn"
                      onClick={() => {
                        acceptOrder(selectedOrder.id);
                        setShowOrderDetail(false);
                      }}
                    >
                      <FaCheck /> Siparişi Onayla
                    </button>
                    <button 
                      className="modal-action-btn reject-btn"
                      onClick={() => {
                        rejectOrder(selectedOrder.id);
                        setShowOrderDetail(false);
                      }}
                    >
                      <FaTimes /> Siparişi Reddet
                    </button>
                  </>
                )}
                
                {selectedOrder.status === 'onaylandi' && (
                  <button 
                    className="modal-action-btn start-btn"
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'hazirlaniyor');
                      setShowOrderDetail(false);
                    }}
                  >
                    <FaPlay /> Hazırlamaya Başla
                  </button>
                )}
                
                {selectedOrder.status === 'hazirlaniyor' && (
                  <button 
                    className="modal-action-btn complete-btn"
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'hazir');
                      setShowOrderDetail(false);
                    }}
                  >
                    <FaCheck /> Hazır Olarak İşaretle
                  </button>
                )}
                                  
                  {selectedOrder.status === 'hazir' && (
                    <button 
                      className="modal-action-btn deliver-btn"
                      onClick={() => {
                        deliverOrderSecure(selectedOrder.id);
                      }}
                    >
                      <FaCheckCircle /> 🔐 Güvenli Teslim Et
                    </button>
                  )}

                
                <button 
                  className="modal-action-btn close-btn"
                  onClick={() => setShowOrderDetail(false)}
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IncomingOrders;