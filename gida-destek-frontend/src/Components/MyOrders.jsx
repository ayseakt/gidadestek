import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaMapMarkerAlt, FaCalendarAlt, FaClock, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaSearch, FaFilter, FaReceipt } from 'react-icons/fa';
import './MyOrders.css';




function TrendyolStyleMyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);

  // Navigation handler functions
  const navigateToProfile = () => {
    navigate('/profile'); // Navigate to ProfileUser.jsx
  };

  const navigateToOrders = () => {
    navigate('/orders'); // Navigate to current page (or refresh)
  };

  // Sipariş durumlarına göre renk ve ikon belirleme
  const statusConfig = {
    'devam_ediyor': { color: '#ffc107', icon: <FaHourglassHalf />, text: 'Devam Ediyor' },
    'teslim_edildi': { color: '#28a745', icon: <FaCheckCircle />, text: 'Teslim Edildi' },
    'iptal_edildi': { color: '#dc3545', icon: <FaTimesCircle />, text: 'İptal Edildi' },
    'hazir': { color: '#17a2b8', icon: <FaCheckCircle />, text: 'Hazır' }
  };

  // Örnek sipariş verileri
  useEffect(() => {
    // API'den veri çekilecek yer
    const sampleOrders = [
      {
        id: 1,
        storeName: 'Ada Market',
        storeImage: 'https://via.placeholder.com/60',
        productName: 'Market Paketi',
        orderDate: '2025-05-15T14:30:00',
        pickupDate: '2025-05-15T18:00:00',
        address: 'Bağdat Caddesi No:102, Kadıköy',
        price: 49.90,
        originalPrice: 85.00,
        status: 'devam_ediyor',
        items: [
          { name: 'Karışık Meyve', quantity: 1, price: 25.00 },
          { name: 'Fırın Ürünleri', quantity: 2, price: 30.00 }
        ]
      },
      {
        id: 2,
        storeName: 'Yeşil Fırın',
        storeImage: 'https://via.placeholder.com/60',
        productName: 'Günlük Ekmek Paketi',
        orderDate: '2025-05-14T16:45:00',
        pickupDate: '2025-05-14T19:00:00',
        address: 'İstiklal Caddesi No:23, Beyoğlu',
        price: 35.50,
        originalPrice: 70.00,
        status: 'teslim_edildi',
        items: [
          { name: 'Ekşi Mayalı Ekmek', quantity: 1, price: 20.00 },
          { name: 'Poğaça', quantity: 3, price: 15.00 }
        ]
      },
      {
        id: 3,
        storeName: 'Organik Manav',
        storeImage: 'https://via.placeholder.com/60',
        productName: 'Sebze Paketi',
        orderDate: '2025-05-13T10:15:00',
        pickupDate: '2025-05-13T13:30:00',
        address: 'Osmanbey Mahallesi, No:45, Şişli',
        price: 42.75,
        originalPrice: 85.50,
        status: 'iptal_edildi',
        items: [
          { name: 'Karışık Sebze', quantity: 1, price: 42.75 }
        ]
      },
      {
        id: 4,
        storeName: 'Mevsim Cafe',
        storeImage: 'https://via.placeholder.com/60',
        productName: 'Tatlı Paketi',
        orderDate: '2025-05-10T14:20:00',
        pickupDate: '2025-05-10T17:00:00',
        address: 'Teşvikiye Mahallesi, No:12, Nişantaşı',
        price: 55.00,
        originalPrice: 110.00,
        status: 'teslim_edildi',
        items: [
          { name: 'Cheesecake', quantity: 1, price: 30.00 },
          { name: 'Brownie', quantity: 2, price: 25.00 }
        ]
      },
      {
        id: 5,
        storeName: 'Tadım Lokantası',
        storeImage: 'https://via.placeholder.com/60',
        productName: 'Akşam Yemeği Paketi',
        orderDate: '2025-05-12T18:00:00',
        pickupDate: '2025-05-12T21:30:00',
        address: 'Cihangir Mahallesi, No:78, Beyoğlu',
        price: 65.50,
        originalPrice: 130.00,
        status: 'hazir',
        items: [
          { name: 'Ana Yemek', quantity: 1, price: 45.50 },
          { name: 'Meze Tabağı', quantity: 1, price: 20.00 }
        ]
      }
    ];
    
    setOrders(sampleOrders);
    setFilteredOrders(sampleOrders);
  }, []);

  // Siparişleri filtreleme
  const filterOrders = (search, date, status) => {
    let filtered = [...orders];
    
    // Arama filtresi
    if (search) {
      filtered = filtered.filter(order => 
        order.storeName.toLowerCase().includes(search.toLowerCase()) || 
        order.productName.toLowerCase().includes(search.toLowerCase()));
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
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
  };

  // Tarih formatını kısa düzenleme (sadece gün/ay/yıl)
  const formatShortDate = (dateString) => {
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

  // Sipariş iptal etme işlemi
  const cancelOrder = (orderId) => {
    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        return {...order, status: 'iptal_edildi'};
      }
      return order;
    });
    
    setOrders(updatedOrders);
    setSelectedOrder({...selectedOrder, status: 'iptal_edildi'});
    
    // Normalde burada API'ye iptal isteği gönderilecek
    alert('Siparişiniz iptal edildi.');
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

  return (
    <div className="trendyol-orders-container">
      {/* Header bar */}

      {/* Main content area */}
      <div className="trendyol-content">

        
        <div className="trendyol-orders-content">
          <h1 className="trendyol-page-title">Siparişlerim</h1>
          
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
                      <p className="price">{order.price.toFixed(2)} TL</p>
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
                          <FaTimesCircle /> 1 Ürün İptal Edildi
                        </div>
                      )}
                      {order.status === 'teslim_edildi' && (
                        <div className="delivered-label">
                          <FaCheckCircle /> 1 Ürün Teslim Edildi
                        </div>
                      )}
                      {(order.status === 'devam_ediyor' || order.status === 'hazir') && (
                        <div className="active-label">
                          <FaHourglassHalf /> {order.status === 'hazir' ? 'Ürün Hazır' : 'Sipariş Alındı'}
                        </div>
                      )}
                      <p className="product-description">{order.productName}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-orders">
                <p>Sipariş bulunamadı.</p>
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
                
                <div className="detail-row">
                  <FaCalendarAlt />
                  <div>gidadestek
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
                    {selectedOrder.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>{item.price.toFixed(2)} TL</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="trendyol-order-summary">
                <div className="summary-row">
                  <span>Normal Fiyat:</span>
                  <span>{selectedOrder.originalPrice.toFixed(2)} TL</span>
                </div>
                <div className="summary-row discount">
                  <span>İndirim:</span>
                  <span>-{(selectedOrder.originalPrice - selectedOrder.price).toFixed(2)} TL</span>
                </div>
                <div className="summary-row total">
                  <span>Toplam:</span>
                  <span>{selectedOrder.price.toFixed(2)} TL</span>
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
                <button className="trendyol-primary-button">
                  Yol Tarifi Al
                </button>
              )}
              
              {selectedOrder.status === 'teslim_edildi' && (
                <button className="trendyol-primary-button">
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

export default TrendyolStyleMyOrders;