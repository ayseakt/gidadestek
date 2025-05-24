// pages/OrdersPage.jsx
import React, { useState } from 'react';
import { useCart } from '../contexts/cartContext';
import { FaBox, FaClock, FaCheck, FaTimes, FaEye } from 'react-icons/fa';

function OrdersPage() {
  const { 
    orderHistory, 
    getActiveOrders, 
    getCompletedOrders, 
    cancelOrder,
    getOrderById 
  } = useCart();
  
  const [activeTab, setActiveTab] = useState('active'); // 'active' veya 'completed'
  const [selectedOrder, setSelectedOrder] = useState(null);

  const activeOrders = getActiveOrders();
  const completedOrders = getCompletedOrders();

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <FaClock className="status-icon pending" />;
      case 'confirmed': return <FaCheck className="status-icon confirmed" />;
      case 'preparing': return <FaBox className="status-icon preparing" />;
      case 'ready': return <FaCheck className="status-icon ready" />;
      case 'completed': return <FaCheck className="status-icon completed" />;
      case 'cancelled': return <FaTimes className="status-icon cancelled" />;
      default: return <FaClock className="status-icon" />;
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'pending': return 'Onay Bekliyor';
      case 'confirmed': return 'Onaylandı';
      case 'preparing': return 'Hazırlanıyor';
      case 'ready': return 'Hazır';
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal Edildi';
      default: return 'Bilinmeyen';
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Bu siparişi iptal etmek istediğinizden emin misiniz?')) {
      const result = await cancelOrder(orderId);
      if (result.success) {
        alert('Sipariş başarıyla iptal edildi');
      } else {
        alert(result.message);
      }
    }
  };

  const OrderCard = ({ order }) => (
    <div className="order-card">
      <div className="order-header">
        <div className="order-info">
          <h3>Sipariş #{order.id.slice(-6)}</h3>
          <p className="order-date">
            {new Date(order.orderDate).toLocaleDateString('tr-TR')}
          </p>
        </div>
        <div className="order-status">
          {getStatusIcon(order.status)}
          <span>{getStatusText(order.status)}</span>
        </div>
      </div>
      
      <div className="order-items-preview">
        {order.items.slice(0, 2).map((item, index) => (
          <div key={index} className="order-item-preview">
            <img src={item.image || 'https://via.placeholder.com/40'} alt={item.product} />
            <span>{item.product}</span>
          </div>
        ))}
        {order.items.length > 2 && (
          <span className="more-items">+{order.items.length - 2} daha</span>
        )}
      </div>
      
      <div className="order-footer">
        <div className="order-total">
          <strong>₺{order.total.toFixed(2)}</strong>
        </div>
        <div className="order-actions">
          <button 
            className="view-order-btn"
            onClick={() => setSelectedOrder(order)}
          >
            <FaEye /> Detay
          </button>
          {['pending', 'confirmed'].includes(order.status) && (
            <button 
              className="cancel-order-btn"
              onClick={() => handleCancelOrder(order.id)}
            >
              <FaTimes /> İptal Et
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const OrderDetailModal = ({ order, onClose }) => (
    <div className="modal-overlay" onClick={onClose}>
      <div className="order-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Sipariş Detayları #{order.id.slice(-6)}</h2>
          <button className="close-modal-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="modal-content">
          <div className="order-status-section">
            <div className="status-indicator">
              {getStatusIcon(order.status)}
              <span>{getStatusText(order.status)}</span>
            </div>
            <p className="order-date">
              Sipariş Tarihi: {new Date(order.orderDate).toLocaleString('tr-TR')}
            </p>
            {order.trackingNumber && (
              <p className="tracking-number">
                Takip Numarası: {order.trackingNumber}
              </p>
            )}
          </div>
          
          <div className="order-items-section">
                        <h3>Ürünler</h3>
            <ul className="order-items-list">
              {order.items.map((item, index) => (
                <li key={index} className="order-item">
                  <img src={item.image || 'https://via.placeholder.com/50'} alt={item.product} />
                  <div className="item-details">
                    <p>{item.product}</p>
                    <p>Miktar: {item.quantity}</p>
                    <p>Fiyat: ₺{item.price.toFixed(2)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="order-summary-section">
            <h3>Toplam Tutar</h3>
            <p className="order-total-price">₺{order.total.toFixed(2)}</p>
          </div>
        </div>

        <div className="modal-footer">
          {['pending', 'confirmed'].includes(order.status) && (
            <button 
              className="cancel-order-btn"
              onClick={() => {
                handleCancelOrder(order.id);
                onClose();
              }}
            >
              <FaTimes /> Siparişi İptal Et
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const ordersToDisplay = activeTab === 'active' ? activeOrders : completedOrders;

  return (
    <div className="orders-page">
      <h1>Siparişlerim</h1>
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Aktif Siparişler
        </button>
        <button 
          className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Geçmiş Siparişler
        </button>
      </div>

      <div className="orders-list">
        {ordersToDisplay.length === 0 ? (
          <p className="no-orders">Henüz siparişiniz bulunmamaktadır.</p>
        ) : (
          ordersToDisplay.map(order => (
            <OrderCard key={order.id} order={order} />
          ))
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </div>
  );
}

export default OrdersPage;
